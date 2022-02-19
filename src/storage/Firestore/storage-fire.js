import { firebaseStore, firebaseStorage } from 'src/boot/firebase'
import List from 'src/storage/List'
import ListItem from 'src/storage/ListItem'

export default {

    getFirebaseObject (object) {
        if (object instanceof List || object instanceof ListItem) {
            return object.toFirebaseObject()
        } else {
            throw new Error('Unexpected object type')
        }
    },

    async validateRegisteredUser (user) {
        try {
            const usersCollection = firebaseStore.collection('users')
            const userDoc = await usersCollection.doc(user.uid).get()

            if (!userDoc.exists) {
                await usersCollection.doc(user.uid).set({
                    id: user.uid,
                    name: user.name,
                    email: user.email,
                    photoURL: user.photoURL
                })
            }
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async getUsersList () {
        const usersList = []

        try {
            const users = await firebaseStore.collection('users').get()

            for (const user of users.docs) {
                usersList.push(user.data())
            }
        } catch (e) {
            throw new Error(e.message)
        }

        return usersList
    },

    async getUserPhotoURLFromStorage (userId) {
        try {
            const usersCollection = firebaseStore.collection('users')
            const userSnapshot = await usersCollection.doc(userId).get()
            return userSnapshot.data().photoURL
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async updatePhotoProfile (userId, photo) {
        let photoURL

        try {
            const storageRef = firebaseStorage.ref()
            const userProfileRef = storageRef.child(`userProfiles/${userId}.jpg`)

            const snapshot = await userProfileRef.put(photo)
            photoURL = await snapshot.ref.getDownloadURL()

            const usersCollection = firebaseStore.collection('users')
            const userRef = usersCollection.doc(userId)

            await userRef.update({
                photoURL: photoURL
            })
        } catch (e) {
            throw new Error(e.message)
        }

        return photoURL
    },

    async getLists (userId) {
        const results = []
        const ownerArgs = ['owner', '==', userId]
        const sharedArgs = ['sharedWith', 'array-contains', userId]

        async function loadListsFromFirebaseDocuments (listDocs) {
            for (const firebaseList of listDocs) {
                const firebaseListData = firebaseList.data()
                const list = new List(firebaseListData)
                list.id = firebaseList.id
                list.isShared = list.owner !== userId
                list.priority = firebaseListData.userPriorities ? firebaseListData.userPriorities[userId] : 0
                results.push(list)
            }
        }

        const listsCollection = firebaseStore.collection('lists')
        const listsRef = await listsCollection.where(...ownerArgs).get()
        const sharedListsRef = await listsCollection.where(...sharedArgs).get()

        await loadListsFromFirebaseDocuments(listsRef.docs)
        await loadListsFromFirebaseDocuments(sharedListsRef.docs)

        return results
    },

    async getListItems (userId, listId) {
        const listItems = []
        const listsCollection = firebaseStore.collection('lists')
        const items = await listsCollection.doc(listId).collection('items').get()

        for (const item of items.docs) {
            const firebaseItemData = item.data()
            const listItem = new ListItem(firebaseItemData)
            listItem.id = item.id
            listItem.listId = listId
            listItem.isShared = item.owner !== userId
            listItem.priority = firebaseItemData.userPriorities ? firebaseItemData.userPriorities[userId] : 0
            listItems.push(listItem)
        }

        return listItems
    },

    async saveList (userId, list) {
        const firebaseList = this.getFirebaseObject(list)

        try {
            const listsCollection = firebaseStore.collection('lists')

            if (list.id) {
                const listRef = listsCollection.doc(list.id)
                await listRef.update(firebaseList)
            } else {
                firebaseList.owner = userId
                firebaseList.sharedWith = []
                firebaseList.userPriorities = {}
                firebaseList.userPriorities[userId] = list.priority

                const docRef = await listsCollection.add(firebaseList)
                list.id = docRef.id
            }
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async saveListItem (userId, listItem) {
        if (!listItem.listId) {
            throw new Error('List item must have be part of a list')
        }

        const firebaseListItem = this.getFirebaseObject(listItem)

        try {
            const listRef = firebaseStore.collection('lists').doc(listItem.listId)
            const itemsCollection = listRef.collection('items')

            if (listItem.id) {
                const itemRef = itemsCollection.doc(listItem.id)
                await itemRef.update(firebaseListItem)
            } else {
                firebaseListItem.owner = userId
                firebaseListItem.userPriorities = {}
                firebaseListItem.userPriorities[userId] = listItem.priority

                const docRef = await itemsCollection.add(firebaseListItem)
                listItem.id = docRef.id
            }
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async shareListWithUser (firebaseListId, sharedWithUserId) {
        try {
            const listRef = firebaseStore.collection('lists').doc(firebaseListId)
            await listRef.update({
                sharedWith: firebaseStore.FieldValue.arrayUnion(sharedWithUserId)
            })
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async deleteList (userId, listId) {
        try {
            const listRef = firebaseStore.collection('lists').doc(listId)
            const items = await listRef.collection('items').where('owner', '==', userId).get()

            for (const item of items.docs) {
                await item.ref.delete()
            }

            return listRef.delete()
        } catch (e) {
            throw new Error(e.message)
        }
    },

    getItemFirebaseReference (listId, listItemId) {
        const listRef = firebaseStore.collection('lists').doc(listId)
        return listRef.collection('items').doc(listItemId)
    },

    async deleteListItem (userId, firebaseListId, firebaseItemId) {
        try {
            const itemRef = this.getItemFirebaseReference(firebaseListId, firebaseItemId)
            return itemRef.delete()
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async setItemsPriority (userId, listId, listItems) {
        return listItems.map(item => {
            const itemRef = this.getItemFirebaseReference(listId, item.id)

            return this.updateObjectPriotity(userId, itemRef, item)
        })
    },

    async setListsPriority (userId, lists) {
        return lists.map(list => {
            const listRef = firebaseStore.collection('lists').doc(list.id)

            return this.updateObjectPriotity(userId, listRef, list)
        })
    },

    async setItemStatus (userId, listItem, status) {
        const firebaseObjectUpdate = {}
        firebaseObjectUpdate.changedBy = listItem.changedBy
        firebaseObjectUpdate.modifiedAt = listItem.modifiedAt
        firebaseObjectUpdate.status = status

        try {
            const itemRef = this.getItemFirebaseReference(listItem.listId, listItem.id)
            return itemRef.update(firebaseObjectUpdate)
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async updateObjectPriotity (userId, objectRef, object) {
        const firebaseObjectUpdate = {}
        firebaseObjectUpdate.changedBy = object.changedBy
        firebaseObjectUpdate.modifiedAt = object.modifiedAt
        firebaseObjectUpdate[`userPriorities.${userId}`] = object.priority

        try {
            return objectRef.update(firebaseObjectUpdate)
        } catch (e) {
            throw new Error(e.message)
        }
    },

    async saveNoteContent (userId, note, content) {
        const firebaseObjectUpdate = {}
        firebaseObjectUpdate.changedBy = note.changedBy
        firebaseObjectUpdate.modifiedAt = note.modifiedAt
        firebaseObjectUpdate.noteContent = content

        try {
            const noteRef = firebaseStore.collection('lists').doc(note.id)
            return noteRef.update(firebaseObjectUpdate)
        } catch (e) {
            throw new Error(e.message)
        }
    }

}
