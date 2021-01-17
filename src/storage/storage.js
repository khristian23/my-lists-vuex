import localStorage from './localStorage/storage-local'
import firestore from './Firestore/storage-fire'

let storage = firestore

if (window.Cypress || window.it) {
    storage = localStorage
}

export default {
    async getLists (userId) {
        return storage.getLists(userId)
    },

    async getList (userId, listId) {
        return storage.getList(userId, listId)
    },

    async saveList (userId, list) {
        return storage.saveList(userId, list)
    },

    async saveLists (userId, lists) {
        return storage.saveLists(userId, lists)
    },

    async deleteList (userId, listId) {
        return storage.deleteList(userId, listId)
    },

    async saveListItem (userId, listItem) {
        return storage.saveListItem(userId, listItem)
    },

    async deleteListItem (userId, listItemId) {
        return storage.deleteListItem(userId, listItemId)
    }
}
