import idb from './indexed-db'
import List from 'src/storage/List'
import ListItem from 'src/storage/ListItem'
import Profile from 'src/storage/Profile'
import Consts from 'src/util/constants'

export default {

    getObject (object) {
        if (object instanceof List || object instanceof ListItem) {
            return object.toObject()
        }
        return object
    },

    async getAllLists () {
        return idb.getObjectsBy('list')
    },

    async getLists (userId) {
        const lists = await idb.getObjectsBy('list', { userId: userId }) || []
        return Promise.all(lists.map(async list => {
            const instance = new List(list)
            instance.listItems = await this._getListItems(userId, instance.id)
            return instance
        }))
    },

    async getList (userId, listId) {
        const lists = await idb.getObjectsBy('list', { id: listId })
        const list = lists[0]

        if (!list || list.userId !== userId) {
            throw Error(`List ID:${listId} not found for user ${userId}`)
        }

        const listInstance = new List(list)

        listInstance.listItems = await this._getListItems(userId, listId)
        return listInstance
    },

    async _getListItems (userId, listId) {
        const items = await idb.getObjectsBy('item', { listId: listId }) || []
        return items.map(item => new ListItem(item))
    },

    async _saveObject (table, userId, listObject) {
        if (typeof userId !== 'string' || userId === '') {
            throw Error('Invalid user id')
        }

        listObject.userId = userId

        const objectLiteralToSave = this.getObject(listObject)
        if (listObject.id) {
            await idb.updateObject(table, objectLiteralToSave)
        } else {
            delete objectLiteralToSave.id
            const generatedId = await idb.addObject(table, objectLiteralToSave)
            listObject.id = generatedId
        }
    },

    async saveList (userId, list) {
        if (!(list instanceof List)) {
            throw Error('Wrong list object type')
        }

        await this._saveObject('list', userId, list)

        for (const item of list.listItems) {
            item.listId = list.id
            if (item.syncStatus === Consts.changeStatus.deleted && !item.firebaseId) {
                await this.deleteListItem(userId, item.id)
            } else {
                await this.saveListItem(userId, item)
            }
        }
    },

    async saveLists (userId, lists) {
        for (const list of lists) {
            await this.saveList(userId, list)
        }
    },

    async saveListItem (userId, listItem) {
        if (!(listItem instanceof ListItem)) {
            throw Error('Wrong List Item object type')
        }

        if (!listItem.listId) {
            throw Error('List Item must have a listId')
        }

        return this._saveObject('item', userId, listItem)
    },

    async saveListItems (userId, listItems) {
        for (const item of listItems) {
            await this.saveListItem(userId, item)
        }
    },

    async deleteList (userId, listId) {
        await idb.deleteObjectsBy('item', { listId: listId })
        return idb.deleteObjectsBy('list', { id: listId })
    },

    async deleteListItem (userId, listItemId) {
        return idb.deleteObjectsBy('item', { id: listItemId })
    },

    async getProfile (userId) {
        const profiles = await idb.getObjectsBy('profile', { userId: userId })
        if (profiles[0]) {
            return new Profile(profiles[0])
        } else {
            return undefined
        }
    },

    async saveProfile (userId, profile) {
        if (!(profile instanceof Profile)) {
            throw Error('Wrong Profile type')
        }

        profile.userId = userId

        const existentProfile = await this.getProfile(userId)
        if (!existentProfile) {
            return idb.addObject('profile', profile.toObject())
        } else {
            return idb.updateObject('profile', profile.toObject())
        }
    }

}
