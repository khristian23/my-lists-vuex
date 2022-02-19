import Storage from 'src/storage/Firestore/storage-fire'
import Consts from 'src/util/constants'

function getCurrentUser (store) {
    return store.state.auth.user.uid
}

function sortByPriority (a, b) {
    if (a.priority === b.priority) {
        return a.name.localeCompare(b.name)
    }
    return a.priority - b.priority
}

function getListIndexById (lists, listId) {
    for (let i = 0; i < lists.length; i++) {
        if (lists[i].id === listId) {
            return i
        }
    }
}

export default {
    namespaced: true,

    state: {
        loading: false,
        lists: [],
        items: []
    },

    getters: {
        isLoadingLists: (state) => state.loading,

        getLists: (state) => state.lists,

        getListById: (state) => (listId) => {
            return state.lists.find(list => list.id === listId)
        },

        getListItemById: (state) => (itemId) => {
            return state.items.find(item => item.id === itemId)
        },

        validLists: (state) => {
            const lists = [].concat(state.lists)
            return lists.sort(sortByPriority)
        },

        pendingItems (state) {
            const items = [].concat(state.items)
            return items.filter(item => item.status === Consts.itemStatus.pending).sort(sortByPriority)
        },

        doneItems (state) {
            const items = [].concat(state.items)
            return items.filter(item => item.status === Consts.itemStatus.done).sort(sortByPriority)
        },

        allListItems (state) {
            const items = [].concat(state.items)
            return items.sort(sortByPriority)
        }
    },

    mutations: {
        loadingLists (state, value) {
            state.loading = value
        },

        removeListByIndex (state, listIndex) {
            state.lists.splice(listIndex, 1)
        },

        removeItemByIndex (state, itemIndex) {
            state.items.splice(itemIndex, 1)
        },

        setLists (state, lists) {
            state.lists = lists
        },

        setItems (state, items) {
            state.items = items
        },

        updateList (state, list) {
            const index = getListIndexById(state.lists, list.id)
            state.lists.splice(index, 1, list)
        },

        updateNoteContent (state, { note, content }) {
            note.noteContent = content
        },

        addList (state, list) {
            state.lists.splice(state.lists.length, 0, list)
        },

        updateListItemInStore (state, item) {
            const index = getListIndexById(state.items, item.id) || state.items.length
            state.items.splice(index, 1, item)
        },

        setListPriority (state, { list, priority }) {
            list.priority = priority
        },

        setItemState (state, { item, status }) {
            item.status = status
        },

        setItemPriority (state, { item, priority }) {
            item.priority = priority
        },

        setModificationValues (state, { userId, object }) {
            object.modifiedAt = Date.now()
            object.changedBy = userId
        }
    },

    actions: {
        async loadUserLists ({ commit }, userId) {
            commit('loadingLists', true)
            const lists = await Storage.getLists(userId) || []
            commit('setLists', lists)
            commit('loadingLists', false)
        },

        async getListItems ({ commit, getters }, listId) {
            const userId = getCurrentUser(this)

            const list = getters.getListById(listId)
            const listItems = await Storage.getListItems(userId, listId)
            if (list) {
                commit('setItems', listItems)
            }
        },

        async saveList ({ commit }, list) {
            const userId = getCurrentUser(this)

            commit('setModificationValues', { userId, object: list })

            if (list.syncStatus === Consts.changeStatus.new) {
                commit('addList', list)
            } else {
                commit('updateList', list)
            }

            await Storage.saveList(userId, list)
        },

        async saveNoteContent ({ commit, getters }, { noteId, content }) {
            const userId = getCurrentUser(this)
            const note = getters.getListById(noteId)

            commit('setModificationValues', { userId, object: note })

            commit('updateNoteContent', { note, content })

            await Storage.saveNoteContent(userId, note, content)
        },

        async saveLists ({ commit }, lists) {
            const userId = getCurrentUser(this)
            await Storage.saveLists(userId, lists)
            commit('setLists', lists)
        },

        async deleteList ({ state, commit }, listId) {
            const userId = getCurrentUser(this)
            await Storage.deleteList(userId, listId)

            const listIndex = getListIndexById(state.lists, listId)
            commit('removeListByIndex', listIndex)
        },

        async setItemStatus ({ getters, commit }, { itemId, status }) {
            const item = getters.getListItemById(itemId)
            const userId = getCurrentUser(this)

            commit('setModificationValues', { userId, object: item })
            commit('setItemState', { item, status })

            await Storage.setItemStatus(userId, item, status)
        },

        async setItemToDone ({ dispatch }, itemId) {
            return dispatch('setItemStatus', { itemId, status: Consts.itemStatus.done })
        },

        async setItemToPending ({ dispatch }, itemId) {
            return dispatch('setItemStatus', { itemId, status: Consts.itemStatus.pending })
        },

        async setListItemsToPending ({ getters, dispatch }, listId) {
            const list = getters.getListById(listId)

            return list.listItems.map(item => {
                return dispatch('setItemToPending', item.id)
            })
        },

        async saveItem ({ commit }, item) {
            const userId = getCurrentUser(this)

            commit('setModificationValues', { userId, object: item })

            await Storage.saveListItem(userId, item)

            commit('updateListItemInStore', item)
        },

        async deleteItem ({ getters, state, commit, dispatch }, { listId, itemId }) {
            const userId = getCurrentUser(this)
            await Storage.deleteListItem(userId, listId, itemId)

            const itemIndex = getListIndexById(state.items, itemId)
            commit('removeItemByIndex', itemIndex)
        },

        async updateItemsOrder ({ getters, commit }, { listId, listItems }) {
            const userId = getCurrentUser(this)

            const storeListItems = listItems.map(changedItem => {
                const item = getters.getListItemById(changedItem.id)
                commit('setModificationValues', { userId, object: item })
                commit('setItemPriority', { item, priority: changedItem.priority })
                return item
            })

            await Storage.setItemsPriority(userId, listId, storeListItems)
        },

        async updateListsOrder ({ getters, commit }, lists) {
            const userId = getCurrentUser(this)

            const storeLists = lists.map(changedList => {
                const list = getters.getListById(changedList.id)
                commit('setModificationValues', { userId, object: list })
                commit('setListPriority', { list, priority: changedList.priority })
                return list
            })

            await Storage.setListsPriority(userId, storeLists)
        }
    }
}
