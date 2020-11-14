import List from 'src/storage/List'
import ListItem from 'src/storage/ListItem'

const KEY = 'MY-LISTS'

export default {

    reset () {
        localStorage.removeItem(KEY)
    },

    _getDataFromStorage () {
        const data = JSON.parse(localStorage.getItem(KEY))
        return data || {}
    },

    _saveDataToStorage (data) {
        localStorage.setItem(KEY, JSON.stringify(data))
    },

    _getListObjectPosition (list, listId) {
        let i = 0
        for (; i < list.length; i++) {
            if (list[i].id === listId) {
                break
            }
        }
        return i
    },

    _saveUserListsReplacingList (userId, listId, list) {
        const userLists = this._getRawLists(userId)
        const listPosition = this._getListObjectPosition(userLists, listId)
        if (list) {
            const listData = list.toObject()
            listData.listItems = list.listItems.map(item => item.toObject())
            userLists.splice(listPosition, 1, listData)
        } else {
            userLists.splice(listPosition, 1)
        }

        return this.saveLists(userId, userLists)
    },

    _convertListDataToListObject (dataLists) {
        return (dataLists || []).map(dataList => {
            const list = new List(dataList)
            list.listItems = dataList.listItems.map(item => new ListItem(item))
            return list
        })
    },

    async getAllLists () {
        const users = this._getDataFromStorage()
        let lists = []
        Object.keys(users).forEach(userId => {
            lists = lists.concat(this._convertListDataToListObject(users[userId]))
        })
        return lists
    },

    _getRawLists (userId) {
        const users = this._getDataFromStorage()
        return users[userId] || []
    },

    getLists (userId) {
        return this._convertListDataToListObject(this._getRawLists(userId))
    },

    getList (userId, listId) {
        const userLists = this.getLists(userId)
        const listData = userLists.filter(list => list.id === listId)[0]
        if (!listData) {
            throw new Error(`List id:${listId} not found`)
        }
        return new List(listData)
    },

    saveList (userId, list) {
        if (!(list instanceof List)) {
            throw new Error('Wrong list object type')
        }

        if (!list.id) {
            list.id = Math.floor(Math.random() * 1000)
        }

        list.userId = userId
        this._saveUserListsReplacingList(userId, list.id, list)
    },

    saveLists (userId, lists) {
        const users = this._getDataFromStorage()
        users[userId] = lists
        this._saveDataToStorage(users)
    },

    saveListItem (userId, listItem) {
        if (!(listItem instanceof ListItem)) {
            throw Error('Wrong List Item object type')
        }

        if (!listItem.listId) {
            throw Error('List Item must have a listId')
        }

        if (!listItem.id) {
            listItem.id = Math.floor(Math.random() * 1000)
        }

        listItem.userId = userId

        const list = this.getList(userId, listItem.listId)
        this._addOrReplaceListItem(list, listItem)
        this.saveList(userId, list)
    },

    _addOrReplaceListItem (list, listItem) {
        const itemPosition = this._getListObjectPosition(list.listItems, listItem.id)
        list.listItems.splice(itemPosition, 1, listItem)
    },

    saveListItems (userId, listItems) {
        listItems.forEach(item => this.saveListItem(userId, item))
    },

    deleteList (userId, listId) {
        return this._saveUserListsReplacingList(userId, listId, undefined)
    }
}
