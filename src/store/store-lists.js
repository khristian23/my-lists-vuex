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

function filterOutDeletedLists (list) {
    return list.syncStatus !== Consts.changeStatus.deleted
}

function getListIndexById (lists, listId) {
    for (let i = 0; i < lists.length; i++) {
        if (lists[i].id === listId) {
            return i
        }
    }
}

async function updateList ({ getters, commit, dispatch }, listId) {
    const list = getters.getListById(listId)
    await dispatch('saveList', list)
}

async function setItemStatus ({ getters, commit, dispatch }, itemId, status) {
    const item = getters.getListItemById(itemId)
    commit('setItemState', { item, status })

    await updateList({ getters, commit, dispatch }, item.listId)
}

export default {
    namespaced: true,

    state: {
        lists: [],
        items: []
    },

    getters: {
        getLists: (state) => state.lists,

        getListById: (state) => (listId) => {
            return state.lists.find(list => list.id === listId)
        },

        getListItemById: (state) => (itemId) => {
            return state.items.find(item => item.id === itemId)
        },

        validLists: (state) => {
            const lists = [].concat(state.lists)
            return lists.filter(filterOutDeletedLists).sort(sortByPriority)
        },

        pendingItems (state) {
            const items = [].concat(state.items)
            return items.filter(item => item.status === Consts.itemStatus.pending).filter(filterOutDeletedLists).sort(sortByPriority)
        },

        doneItems (state) {
            const items = [].concat(state.items)
            return items.filter(item => item.status === Consts.itemStatus.done).filter(filterOutDeletedLists).sort(sortByPriority)
        }
    },

    mutations: {
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
        }
    },

    actions: {
        async loadUserLists ({ commit }, userId) {
            const lists = await Storage.getLists(userId) || []
            commit('setLists', lists)
        },

        getListItems ({ commit, getters }, listId) {
            const list = getters.getListById(listId)
            if (list) {
                commit('setItems', list.listItems)
            }
        },

        async saveList ({ commit }, list) {
            const userId = getCurrentUser(this)
            await Storage.saveList(userId, list)

            if (list.syncStatus === Consts.changeStatus.new) {
                commit('addList', list)
            } else {
                commit('updateList', list)
            }
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

        async setItemToDone (context, itemId) {
            await setItemStatus(context, itemId, Consts.itemStatus.done)
        },

        async setItemToPending (context, itemId) {
            await setItemStatus(context, itemId, Consts.itemStatus.pending)
        },

        async saveItem ({ commit }, item) {
            const userId = getCurrentUser(this)
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

            await Storage.setItemsPriority(userId, listId, listItems)

            listItems.forEach(changedItem => {
                const item = getters.getListItemById(changedItem.id)
                commit('setItemPriority', { item, priority: changedItem.priority })
            })
        },

        async updateListsOrder ({ getters, commit }, lists) {
            const userId = getCurrentUser(this)

            await Storage.setListsPriority(userId, lists)

            lists.forEach(changedList => {
                const list = getters.getListById(changedList.id)
                commit('setListPriority', { list, priority: changedList.priority })
            })
        }
    }
}
