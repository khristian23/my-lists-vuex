import LocalStorage from './IndexedDB/storage-idb'
import FirebaseStorage from './Firestore/storage-fire'
import Const from 'src/util/constants'
import List from './List'
import ListItem from './ListItem'
import Profile from './Profile'

export default {

    async getLastSynchonizationTimeForUser (userId) {
        const profile = await LocalStorage.getProfile(userId)
        if (profile) {
            return profile.lastSyncTime
        } else {
            return 0
        }
    },

    async setLastSynchronizationTimeForUser (userId, syncTimestamp) {
        let profile = await LocalStorage.getProfile(userId)
        if (!profile) {
            profile = new Profile({ userId: userId })
        }
        profile.lastSyncTime = syncTimestamp
        return LocalStorage.saveProfile(userId, profile)
    },

    _createDistribution () {
        return {
            newLocal: [],
            changedLocal: [],
            deletedLocal: [],
            newServer: [],
            changedServer: [],
            deletedServer: []
        }
    },

    _distributeListObjectsByModificationDate (distribution, localObject, serverObject, lastSync) {
        function isAnUnchangedLocalList (listObject) {
            return !listObject.syncStatus && listObject instanceof List && listObject.id === listObject.localId
        }

        function getMostRecentListItemModification (listItems) {
            if (!listItems) debugger
            return listItems.reduce((mostRecentModifiedAt, item) => {
                if (item.modifiedAt && mostRecentModifiedAt < item.modifiedAt) {
                    mostRecentModifiedAt = item.modifiedAt
                }
                return mostRecentModifiedAt
            }, 0)
        }

        function itWasModifiedAfterLastSync (listObject) {
            let modifiedAt = listObject.modifiedAt

            if (isAnUnchangedLocalList(listObject)) {
                modifiedAt = getMostRecentListItemModification(listObject.listItems)
            }

            return modifiedAt >= lastSync
        }

        if (itWasModifiedAfterLastSync(localObject) && itWasModifiedAfterLastSync(serverObject)) {
            if (localObject.modifiedAt < serverObject.modifiedAt) {
                distribution.changedLocal.push(localObject)
            } else {
                distribution.changedServer.push(serverObject)
            }
        } else if (itWasModifiedAfterLastSync(localObject)) {
            distribution.changedLocal.push(localObject)
        } else if (itWasModifiedAfterLastSync(serverObject)) {
            distribution.changedServer.push(serverObject)
        }
    },

    computeListsToSync (localLists, serverLists, lastSync) {
        const result = { lists: {}, items: {} }

        result.lists = this._computeListObjectsDistribution(localLists, serverLists, lastSync)

        result.items = this._computeListItemsDistribution(result.lists, localLists, serverLists, lastSync)

        return result
    },

    _computeListItemsDistribution (listResult, localObjects, serverObjects, lastSync) {
        const result = this._createDistribution()

        function addListItemsToDistribution (listType, status, idToUpdate) {
            listResult[listType].forEach(list => {
                list.listItems.forEach(item => {
                    item.syncStatus = status
                    item[idToUpdate] = item.id
                })
                result[listType].push(...list.listItems)
            })
        }

        addListItemsToDistribution('newLocal', Const.changeStatus.new, 'localId')
        addListItemsToDistribution('newServer', Const.changeStatus.new, 'firebaseId')
        addListItemsToDistribution('deletedLocal', Const.changeStatus.deleted, 'localId')
        addListItemsToDistribution('deletedServer', Const.changeStatus.deleted, 'localId')

        function findListInArray (array, id) {
            return array.filter(object => object.id === id)[0]
        }

        function addItemsDistributionToResult (itemsDistribution) {
            Object.keys(result).forEach(type => {
                result[type].push(...itemsDistribution[type])
            })
        }

        function addListsForOrphanListItems () {
            const allLocalResultLists = []
            const allServerResultLists = []
            Object.keys(listResult).forEach(type => {
                if (type.includes('Local')) {
                    allLocalResultLists.push(...listResult[type])
                } else {
                    allServerResultLists.push(...listResult[type])
                }
            })

            Object.keys(result).forEach(type => {
                const localUpdates = type.includes('Local')
                const listToSearch = localUpdates ? localObjects : serverObjects
                const resultToSearch = localUpdates ? allLocalResultLists : allServerResultLists

                const listIds = result[type].reduce((ids, listItem) => {
                    ids[listItem.listId] = true
                    return ids
                }, {})

                Object.keys(listIds).forEach(listId => {
                    listId = parseInt(listId, 10)
                    if (!findListInArray(resultToSearch, listId)) {
                        const listForOrphans = findListInArray(listToSearch, listId)
                        listResult[type].push(listForOrphans)
                    }
                })
            })
        }

        const allLists = listResult.changedLocal.concat(listResult.changedServer)
        allLists.forEach(changedList => {
            const localList = findListInArray(localObjects, changedList.localId)
            const serverList = findListInArray(serverObjects, changedList.firebaseId)

            const itemsDistribution = this._computeListObjectsDistribution(localList.listItems, serverList.listItems, lastSync)

            addItemsDistributionToResult(itemsDistribution)
        })

        addListsForOrphanListItems()

        return result
    },

    _computeListObjectsDistribution (localObjects, serverObjects, lastSync) {
        function isFlaggedAsDeleted (listObject) {
            return listObject.syncStatus === Const.changeStatus.deleted
        }

        function isNotYetSyncedToFirebase (listObject) {
            return !listObject.firebaseId
        }

        function findCorrespondentServerObject (localObject) {
            return serverObjects.filter(serverObject => serverObject.id === localObject.firebaseId)[0]
        }

        function findCorrespondentLocalObject (serverObject) {
            return localObjects.filter(localObject => localObject.firebaseId === serverObject.id)[0]
        }

        function itWasModifiedAfterLastSync (listObject) {
            return listObject.modifiedAt >= lastSync
        }

        const distribution = this._createDistribution()

        localObjects.forEach(localObject => {
            localObject.localId = localObject.id

            if (isFlaggedAsDeleted(localObject)) {
                distribution.deletedLocal.push(localObject)
            } else if (isNotYetSyncedToFirebase(localObject)) {
                distribution.newLocal.push(localObject)
            } else {
                const serverObject = findCorrespondentServerObject(localObject)
                if (serverObject) {
                    serverObject.localId = localObject.id
                    serverObject.firebaseId = serverObject.id
                    this._distributeListObjectsByModificationDate(distribution, localObject, serverObject, lastSync)
                } else {
                    localObject.syncStatus = Const.changeStatus.deleted
                    distribution.deletedServer.push(localObject)
                }
            }
        })

        serverObjects.forEach(serverObject => {
            if (itWasModifiedAfterLastSync(serverObject) && !findCorrespondentLocalObject(serverObject)) {
                serverObject.firebaseId = serverObject.id
                distribution.newServer.push(serverObject)
            }
        })

        return distribution
    },

    _syncLocalListItemToFirebase (userId, firebaseListId, localListItems) {
        return Promise.all(localListItems.map(async localItem => {
            if (localItem.syncStatus === Const.changeStatus.deleted) {
                await FirebaseStorage.deleteListItem(userId, firebaseListId, localItem.firebaseId)
            } else {
                localItem.firebaseId = await FirebaseStorage.saveListItem(userId, firebaseListId, localItem)
            }
        }))
    },

    async _processLocalListAfterFirebaseSync (userId, localList) {
        if (localList.syncStatus === Const.changeStatus.deleted) {
            await LocalStorage.deleteList(userId, localList.id)
        } else {
            const itemsToDelete = []
            const itemsToSave = []

            localList.listItems.forEach(item => {
                if (item.syncStatus === Const.changeStatus.deleted) {
                    itemsToDelete.push(item)
                } else {
                    item.syncStatus = Const.changeStatus.none
                    item.userId = userId
                    itemsToSave.push(item)
                }
            })

            localList.listItems = itemsToSave

            await Promise.all(itemsToDelete.map(async item => {
                return LocalStorage.deleteListItem(userId, item.id)
            }))

            if (localList.syncStatus) {
                localList.syncStatus = Const.changeStatus.none
                localList.userId = userId

                await LocalStorage.saveList(userId, localList)
            }
        }
    },

    syncLocalListToFirebase (userId, localLists) {
        return Promise.all(localLists.map(async localList => {
            if (localList.syncStatus === Const.changeStatus.deleted) {
                await FirebaseStorage.deleteList(userId, localList.firebaseId)
            } else if (!localList.syncStatus && localList.firebaseId) {
                await this._syncLocalListItemToFirebase(userId, localList.firebaseId, localList.listItems)
            } else {
                localList.firebaseId = await FirebaseStorage.saveList(userId, localList)
                await this._syncLocalListItemToFirebase(userId, localList.firebaseId, localList.listItems)
            }

            await this._processLocalListAfterFirebaseSync(userId, localList)
        }))
    },

    _adaptFirebaseObjectToLocalId (objectToAdapt) {
        objectToAdapt.firebaseId = objectToAdapt.id
        if (objectToAdapt.localId) {
            objectToAdapt.id = objectToAdapt.localId
        } else {
            objectToAdapt.id = undefined
        }
    },

    async syncFirebaseListToLocal (userId, firebaseLists) {
        return Promise.all(firebaseLists.map(async firebaseList => {
            if (firebaseList.syncStatus === Const.changeStatus.deleted) {
                await LocalStorage.deleteList(userId, firebaseList.id)
            } else {
                firebaseList.listItems.forEach(item => this._adaptFirebaseObjectToLocalId(item))

                this._adaptFirebaseObjectToLocalId(firebaseList)
                await LocalStorage.saveList(userId, firebaseList)
            }
        }))
    },

    async syncAnonymousLocalListsToFirebase (userId) {
        async function removeFromLocalStorage (listObject) {
            if (listObject instanceof List) {
                await LocalStorage.deleteList(userId, listObject.id)
            } else if (listObject instanceof ListItem) {
                await LocalStorage.deleteListItem(userId, listObject.id)
            }
        }

        async function removeDeletedItemsFromList (list) {
            let itemRemoved

            for (let i = list.length - 1; i >= 0; i--) {
                if (list[i].syncStatus === Const.changeStatus.deleted) {
                    itemRemoved = list.splice(i, 1)
                    await removeFromLocalStorage(itemRemoved[0])
                } else if (list[i].listItems) {
                    await removeDeletedItemsFromList(list[i].listItems)
                }
            }
        }

        const localLists = await LocalStorage.getLists(Const.user.anonymous)
        await removeDeletedItemsFromList(localLists)

        await this.syncLocalListToFirebase(userId, localLists)
        return localLists.length
    },

    async syncLocalChangesWithFirebase (userId, computed) {
        function concatenateListObjects (side, type) {
            return computed[type]['new' + side].concat(
                ...computed[type]['changed' + side],
                ...computed[type]['deleted' + side]
            )
        }

        function concatencateLocalListObjects (type) {
            return concatenateListObjects('Local', type)
        }

        function concatencateServerListObjects (type) {
            return concatenateListObjects('Server', type)
        }

        function addListItemsToList (lists, listItems) {
            lists.forEach(list => {
                list.listItems = listItems.filter(listItem => listItem.listId === list.id)
            })
        }

        function addFoundServerDeletedItemsToLocalLists (localLists) {
            computed.items.deletedServer.forEach(deletedItem => {
                localLists.some(list => {
                    if (list.id === deletedItem.listId) {
                        list.listItems.push(deletedItem)
                        return true
                    }
                    return false
                })
            })
        }

        const localLists = concatencateLocalListObjects('lists')
        const localListItems = concatencateLocalListObjects('items')
        const serverLists = concatencateServerListObjects('lists')
        const serverListItems = concatencateServerListObjects('items')

        addListItemsToList(localLists, localListItems)
        addListItemsToList(serverLists, serverListItems)

        addFoundServerDeletedItemsToLocalLists(localLists)

        return Promise.all([].concat(
            this.syncLocalListToFirebase(userId, localLists),
            this.syncFirebaseListToLocal(userId, serverLists)
        ))
    },

    async synchronize (firebaseUser) {
        const currentSync = (new Date()).getTime()
        let changesCount = 0

        try {
            const userId = firebaseUser.uid
            const lastSync = await this.getLastSynchonizationTimeForUser(userId)

            // Synchronize new local item to server
            changesCount = await this.syncAnonymousLocalListsToFirebase(userId)

            // Retrieve local and remote lists
            const localLists = await LocalStorage.getLists(userId)
            const serverLists = await FirebaseStorage.getLists(userId)

            // Synchronize changed items to server
            const computedLists = this.computeListsToSync(localLists, serverLists, lastSync)
            await this.syncLocalChangesWithFirebase(userId, computedLists)
            changesCount += localLists.length + serverLists.length

            if (changesCount > 0) {
                // Record synchronization time after fetching data from server
                await this.setLastSynchronizationTimeForUser(userId, currentSync)
            }
        } catch (e) {
            throw new Error(e.message)
        }
        return changesCount ? currentSync : false
    }
}
