import { firebaseStore } from 'src/boot/firebase'
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

    async getLists (userId) {
        const results = []
        const ownerArgs = ['owner', '==', userId]
        const sharedArgs = ['sharedWith', 'array-contains', userId]

        async function loadListsFromFirebaseDocuments (listDocs, options) {
            for (const firebaseList of listDocs) {
                const list = new List(firebaseList.data())
                list.id = firebaseList.id

                const items = await listsCollection.doc(list.id).collection('items').where(...options).get()
                for (const item of items.docs) {
                    const listItem = new ListItem(item.data())
                    listItem.id = item.id
                    listItem.listId = list.id
                    listItem.isShared = item.owner !== userId
                    list.addListItem(listItem)
                }
                results.push(list)
            }
        }

        const listsCollection = firebaseStore.collection('lists')
        const listsRef = await listsCollection.where(...ownerArgs).get()
        const sharedListsRef = await listsCollection.where(...sharedArgs).get()

        await loadListsFromFirebaseDocuments(listsRef.docs, ownerArgs)
        await loadListsFromFirebaseDocuments(sharedListsRef.docs, sharedArgs)

        return results
    },

    async saveList (userId, list) {
        const firebaseList = this.getFirebaseObject(list)

        try {
            const listsCollection = firebaseStore.collection('lists')

            if (list.firebaseId) {
                const listRef = listsCollection.doc(list.firebaseId)
                await listRef.update(firebaseList)
            } else {
                firebaseList.owner = userId
                firebaseList.sharedWith = []
                const docRef = await listsCollection.add(firebaseList)
                list.firebaseId = docRef.id
            }
        } catch (e) {
            throw new Error(e.message)
        }

        return list.firebaseId
    },

    async saveListItem (userId, firebaseListId, listItem) {
        const firebaseListItem = this.getFirebaseObject(listItem)

        try {
            const listRef = firebaseStore.collection('lists').doc(firebaseListId)
            const itemsCollection = listRef.collection('items')

            if (listItem.firebaseId) {
                const itemRef = itemsCollection.doc(listItem.firebaseId)
                await itemRef.update(firebaseListItem)
            } else {
                firebaseListItem.owner = userId
                const docRef = await itemsCollection.add(firebaseListItem)
                listItem.firebaseId = docRef.id
            }
        } catch (e) {
            throw new Error(e.message)
        }

        return listItem.firebaseId
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

    async deleteList (userId, firebaseId) {
        const listRef = firebaseStore.collection('lists').doc(firebaseId)
        const items = await listRef.collection('items').get()

        for (const item of items.docs) {
            await item.ref.delete()
        }

        return listRef.delete()
    },

    async deleteListItem (userId, firebaseListId, firebaseItemId) {
        const listRef = firebaseStore.collection('lists').doc(firebaseListId)
        const itemRef = listRef.collection('items').doc(firebaseItemId)
        return itemRef.delete()
    }

}
