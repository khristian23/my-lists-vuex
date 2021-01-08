/* eslint-disable jest/expect-expect */
import assert from 'assert'
import sinon from 'sinon'

import sync from 'src/storage/Sync'
import List from 'src/storage/List'
import ListItem from 'src/storage/ListItem'
import Profile from 'src/storage/Profile'
import Consts from 'src/util/constants'

import LocalStorage from 'src/storage/IndexedDB/storage-idb'
import IndexedDB from 'src/storage/IndexedDB/indexed-db'
import FirebaseStorage from 'src/storage/Firestore/storage-fire'

const USER_ID = 'Christian'

describe('Synchronization', () => {
    const context = {}

    let firebaseSaveListStub
    let firebaseSaveListItemStub
    let firebaseDeleteListStub
    let firebaseDeleteListItemStub

    let idbGetObjectsByStub

    let localSaveListStub
    let localSaveListItemStub
    let localDeleteListStub
    let localDeleteListItemStub

    beforeAll(() => {
        firebaseSaveListStub = sinon.stub(FirebaseStorage, 'saveList').returns(Promise.resolve(true))
        firebaseSaveListItemStub = sinon.stub(FirebaseStorage, 'saveListItem').returns(Promise.resolve(true))
        firebaseDeleteListStub = sinon.stub(FirebaseStorage, 'deleteList').returns(Promise.resolve(true))
        firebaseDeleteListItemStub = sinon.stub(FirebaseStorage, 'deleteListItem').returns(Promise.resolve(true))

        idbGetObjectsByStub = sinon.stub(IndexedDB, 'getObjectsBy').returns([])

        localSaveListStub = sinon.stub(LocalStorage, 'saveList').returns(Promise.resolve(true))
        localSaveListItemStub = sinon.stub(LocalStorage, 'saveListItem').returns(Promise.resolve(true))
        localDeleteListStub = sinon.stub(LocalStorage, 'deleteList').returns(Promise.resolve(true))
        localDeleteListItemStub = sinon.stub(LocalStorage, 'deleteListItem').returns(Promise.resolve(true))

        context.currentDate = new Date().getTime()

        for (let i = -6; i <= 5; i++) {
            const name = 'time' + (i < 0 ? 'Minus' + Math.abs(i) : (i > 0 ? 'Plus' + i : ''))
            context[name] = (new Date(context.currentDate + 1000 * 60 * 60 * 24 * i)).getTime()
        }
    })

    afterAll(() => {
        firebaseSaveListStub.restore()
        firebaseSaveListItemStub.restore()
        firebaseDeleteListStub.restore()
        firebaseDeleteListItemStub.restore()

        idbGetObjectsByStub.restore()

        localSaveListStub.restore()
        localSaveListItemStub.restore()
        localDeleteListStub.restore()
        localDeleteListItemStub.restore()
    })

    describe('Anonymous Lists', () => {
        let syncLocalListToFirebaseStub
        let getLocalListsStub

        const lists = [
            new List({ id: 1, syncStatus: Consts.changeStatus.deleted }),
            new List({
                id: 2,
                syncStatus: Consts.changeStatus.changed,
                listItems: [
                    new ListItem({ id: 11, syncStatus: Consts.changeStatus.deleted }),
                    new ListItem({ id: 12, syncStatus: Consts.changeStatus.changed })
                ]
            }),
            new List({
                id: 3,
                syncStatus: Consts.changeStatus.new,
                listItems: [
                    new ListItem({ id: 31, syncStatus: Consts.changeStatus.new }),
                    new ListItem({ id: 32, syncStatus: Consts.changeStatus.changed })
                ]
            })
        ]

        beforeAll(() => {
            syncLocalListToFirebaseStub = sinon.stub(sync, 'syncLocalListToFirebase')
            syncLocalListToFirebaseStub.returns(Promise.resolve(true))

            getLocalListsStub = sinon.stub(LocalStorage, 'getLists').returns(Promise.resolve(lists))
        })

        afterAll(() => {
            syncLocalListToFirebaseStub.restore()
            getLocalListsStub.restore()
        })

        it('should do clean up before synchronize with firebase', async () => {
            const expectedLists = [
                new List({
                    id: 2,
                    syncStatus: Consts.changeStatus.changed,
                    listItems: [
                        new ListItem({ id: 12, syncStatus: Consts.changeStatus.changed })
                    ]
                }),
                new List({
                    id: 3,
                    syncStatus: Consts.changeStatus.new,
                    listItems: [
                        new ListItem({ id: 31, syncStatus: Consts.changeStatus.new }),
                        new ListItem({ id: 32, syncStatus: Consts.changeStatus.changed })
                    ]
                })
            ]

            await sync.syncAnonymousLocalListsToFirebase(USER_ID)

            const actualLists = syncLocalListToFirebaseStub.firstCall.args[1]
            assert.deepStrictEqual(actualLists, expectedLists)
        })

        it('should clean local storage after clean up', async () => {
            await sync.syncAnonymousLocalListsToFirebase(USER_ID)

            assert.ok(localDeleteListStub.calledOnce, 'List Id 1 should be deleted')
            assert.ok(localDeleteListItemStub.calledOnce, 'ListItem Id 11 should be deleted')
        })
    })

    describe('Helper Sync functions', () => {
        it('should get the last local synchronization time from existent user', async () => {
            idbGetObjectsByStub.reset()

            const currentTime = new Date().getTime()
            idbGetObjectsByStub.returns([{
                userId: USER_ID,
                lastSyncTime: currentTime
            }])

            const lastSync = await sync.getLastSynchonizationTimeForUser(USER_ID)

            assert.strictEqual(lastSync, currentTime)
        })

        it('should get the last local synchronization time from non-existent user', async () => {
            idbGetObjectsByStub.reset()
            idbGetObjectsByStub.returns([])

            const lastSync = await sync.getLastSynchonizationTimeForUser(USER_ID)

            assert.strictEqual(lastSync, 0)
        })

        it('should set the last local synchronization time for existent user', async () => {
            const profile = new Profile({
                userId: USER_ID,
                lastSyncTime: null
            })
            const expectedProfile = profile.toObject()
            const currentTime = new Date().getTime()
            expectedProfile.lastSyncTime = currentTime

            const getProfileStub = sinon.stub(LocalStorage, 'getProfile')
                .returns(Promise.resolve(profile))
            const saveProfileStub = sinon.stub(LocalStorage, 'saveProfile')
                .returns(Promise.resolve(true))

            await sync.setLastSynchronizationTimeForUser(USER_ID, currentTime)

            const actualProfile = saveProfileStub.lastCall.lastArg
            assert.ok(saveProfileStub.calledOnceWith(USER_ID))
            assert.deepStrictEqual(actualProfile.toObject(), expectedProfile)

            getProfileStub.restore()
            saveProfileStub.restore()
        })

        it('should set the last local synchronization time for non-existent user', async () => {
            const currentTime = new Date().getTime()
            const expectedProfile = new Profile({
                userId: USER_ID,
                lastSyncTime: null
            }).toObject()
            expectedProfile.lastSyncTime = currentTime

            const getProfileStub = sinon.stub(LocalStorage, 'getProfile')
                .returns(Promise.resolve(undefined))
            const saveProfileStub = sinon.stub(LocalStorage, 'saveProfile')
                .returns(Promise.resolve(true))

            await sync.setLastSynchronizationTimeForUser(USER_ID, currentTime)

            const actualProfile = saveProfileStub.lastCall.lastArg
            assert.ok(saveProfileStub.calledOnceWith(USER_ID))
            assert.deepStrictEqual(actualProfile.toObject(), expectedProfile)

            getProfileStub.restore()
            saveProfileStub.restore()
        })

        it('should return the number of synchronized anonymous lists', async () => {
            const lists = [new List({}), new List({}), new List({})]

            const getLocalListsStub = sinon.stub(LocalStorage, 'getLists')
                .returns(Promise.resolve(lists))

            const count = await sync.syncAnonymousLocalListsToFirebase(USER_ID, lists)

            assert.ok(count, lists.length)

            getLocalListsStub.restore()
        })

        it('should update user when synchronizing anonymous lists', async () => {
            const localLists = [
                new List({
                    id: 100,
                    syncStatus: Consts.changeStatus.new,
                    userId: Consts.user.anonymous,
                    listItems: [
                        new ListItem({
                            id: 101,
                            syncStatus: Consts.changeStatus.new,
                            userId: Consts.user.anonymous
                        })
                    ]
                })
            ]

            localSaveListStub.reset()

            await sync.syncLocalListToFirebase(USER_ID, localLists)

            const firstCallList = localSaveListStub.firstCall.args[1]
            assert.strictEqual(firstCallList.userId, USER_ID)
            assert.strictEqual(firstCallList.syncStatus, Consts.changeStatus.none)
            assert.strictEqual(firstCallList.listItems[0].userId, USER_ID)
            assert.strictEqual(firstCallList.listItems[0].syncStatus, Consts.changeStatus.none)
        })

        it('should synchronize new local list to firebase', async () => {
            const fakeFirebaseId = 1000

            firebaseSaveListStub.reset()
            firebaseSaveListStub
                .onFirstCall().returns(Promise.resolve(fakeFirebaseId + 1))
                .onSecondCall().returns(Promise.resolve(fakeFirebaseId + 2))

            firebaseSaveListItemStub.reset()
            firebaseSaveListItemStub
                .onFirstCall().returns(Promise.resolve(fakeFirebaseId + 100))
                .onSecondCall().returns(Promise.resolve(fakeFirebaseId + 200))

            localSaveListStub.reset()
            localSaveListItemStub.reset()

            const localLists = [
                new List({
                    id: 100,
                    syncStatus: Consts.changeStatus.new,
                    modifiedAt: context.timeMinus2,
                    listItems: [
                        new ListItem({
                            id: 101,
                            syncStatus: Consts.changeStatus.new
                        }),
                        new ListItem({
                            id: 102,
                            syncStatus: Consts.changeStatus.new
                        })
                    ]
                }),
                new List({
                    id: 200,
                    syncStatus: Consts.changeStatus.new,
                    modifiedAt: context.timeMinus3,
                    listItems: []
                })
            ]

            await sync.syncLocalListToFirebase(USER_ID, localLists)

            assert.ok(firebaseSaveListStub.calledTwice, 'Firebase Save List called twice')
            assert.ok(firebaseSaveListItemStub.calledTwice, 'Firebase Save List Item called twice')
            assert.ok(localSaveListStub.calledTwice, 'Local Save List must be called twice')

            assert.strictEqual(firebaseSaveListItemStub.firstCall.args[1], fakeFirebaseId + 1, 'Should take first list firebase Id')
            assert.strictEqual(firebaseSaveListItemStub.secondCall.args[1], fakeFirebaseId + 1, 'Should take second list firebase Id')

            const firstLocalList = localSaveListStub.getCalls().filter(call => call.args[1].id === 100)[0].args[1]
            assert.strictEqual(firstLocalList.firebaseId, fakeFirebaseId + 1)
            assert.strictEqual(firstLocalList.syncStatus, Consts.changeStatus.none, 'Reset change flag for list')
            assert.strictEqual(firstLocalList.modifiedAt, context.timeMinus2, 'Modification timestamp kept')
            assert.ok(firstLocalList.listItems.every(item => item.syncStatus === Consts.changeStatus.none), 'Reset change list Item flag')
            assert.ok(firstLocalList.listItems.every(item => item.firebaseId > 0), 'Assign firebase Item id')
        })

        it('should synchronize changed local list to firebase', async () => {
            firebaseSaveListStub.reset()
            firebaseSaveListStub
                .onFirstCall().returns(Promise.resolve(1000))
                .onSecondCall().returns(Promise.resolve(2000))

            firebaseSaveListItemStub.reset()
            firebaseSaveListItemStub
                .onFirstCall().returns(Promise.resolve(2001))
                .onSecondCall().returns(Promise.resolve(2002))
                .onThirdCall().returns(Promise.resolve(2003))

            firebaseDeleteListItemStub.reset()

            localSaveListStub.reset()
            localSaveListItemStub.reset()
            localDeleteListItemStub.reset()

            const localLists = [
                new List({
                    id: 100,
                    syncStatus: Consts.changeStatus.changed,
                    firebaseId: 1000,
                    modifiedAt: context.timeMinus2,
                    listItems: []
                }),
                new List({
                    id: 200,
                    syncStatus: Consts.changeStatus.changed,
                    firebaseId: 2000,
                    modifiedAt: context.timeMinus2,
                    listItems: [
                        new ListItem({
                            id: 201,
                            syncStatus: Consts.changeStatus.new
                        }),
                        new ListItem({
                            id: 202,
                            firebaseId: 2002,
                            syncStatus: Consts.changeStatus.changed
                        }),
                        new ListItem({
                            id: 203,
                            firebaseId: 2003,
                            syncStatus: Consts.changeStatus.deleted
                        })
                    ]
                })
            ]

            const onyItems = false
            await sync.syncLocalListToFirebase(USER_ID, localLists, onyItems)

            assert.ok(firebaseSaveListStub.calledTwice, 'Firebase Save List called twice')
            assert.ok(firebaseSaveListItemStub.calledTwice, 'Firebase Save List Item called two times')
            assert.ok(firebaseDeleteListItemStub.calledOnce, 'Firebase Delete List Item called once')
            assert.ok(localSaveListStub.calledTwice, 'Local Save List must be called twice')
            assert.ok(localDeleteListItemStub.calledOnce, 'One list item should be deleted')

            assert.ok(firebaseSaveListItemStub.getCalls().every(call => call.args[1] === 2000), 'Should take second list firebase Id')

            const firstLocalList = localSaveListStub.getCalls().filter(call => call.args[1].id === 100)[0].args[1]
            assert.strictEqual(firstLocalList.syncStatus, Consts.changeStatus.none, 'Reset change flag for list')
            assert.strictEqual(firstLocalList.modifiedAt, context.timeMinus2, 'Modification timestamp kept')

            const secondLocalList = localSaveListStub.getCalls().filter(call => call.args[1].id === 200)[0].args[1]
            assert.strictEqual(secondLocalList.listItems.length, 2, 'Only two list items without deleted item')
            assert.ok(secondLocalList.listItems.every(item => item.syncStatus === Consts.changeStatus.none), 'Reset change list Item flag')
            assert.strictEqual(secondLocalList.listItems[0].firebaseId, 2001, 'Assign firebase Item id to new item')
        })

        it('should synchronize deleted local list to firebase', async () => {
            firebaseSaveListStub.reset()
            firebaseSaveListItemStub.reset()
            firebaseDeleteListStub.reset()
            firebaseDeleteListItemStub.reset()

            localSaveListStub.reset()
            localSaveListItemStub.reset()
            localDeleteListStub.reset()
            localDeleteListItemStub.reset()

            const localLists = [
                new List({
                    id: 300,
                    syncStatus: Consts.changeStatus.deleted,
                    firebaseId: 3000,
                    modifiedAt: context.timeMinus1,
                    listItems: [
                        new ListItem({
                            id: 301,
                            syncStatus: Consts.changeStatus.deleted
                        }),
                        new ListItem({
                            id: 302,
                            firebaseId: 3002,
                            syncStatus: Consts.changeStatus.deleted
                        }),
                        new ListItem({
                            id: 303,
                            firebaseId: 3003,
                            syncStatus: Consts.changeStatus.changed
                        })
                    ]
                })
            ]

            const onyItems = false
            await sync.syncLocalListToFirebase(USER_ID, localLists, onyItems)

            assert.ok(firebaseSaveListStub.notCalled, 'Firebase Save List not called')
            assert.ok(firebaseSaveListItemStub.notCalled, 'Firebase Save List Item not called')
            assert.ok(firebaseDeleteListStub.calledOnce, 'Firebase Delete List called once')
            assert.ok(localSaveListStub.notCalled, 'Local Save List must not be called')
            assert.ok(localDeleteListStub.calledOnce, 'Delete List must be called once')
            assert.strictEqual(localDeleteListStub.firstCall.args[1], 300, 'Delete List should be called')
        })

        it('should synchronize local list to firebase wit only items', async () => {
            firebaseSaveListStub.reset()
            firebaseSaveListItemStub.reset()
            firebaseDeleteListStub.reset()
            firebaseDeleteListItemStub.reset()

            localSaveListStub.reset()
            localSaveListItemStub.reset()
            localDeleteListStub.reset()

            firebaseSaveListItemStub.returns(Promise.resolve(3001))

            const localLists = [
                new List({
                    id: 300,
                    syncStatus: Consts.changeStatus.changed,
                    firebaseId: 3000,
                    modifiedAt: context.timeMinus1,
                    listItems: [
                        new ListItem({
                            id: 301,
                            syncStatus: Consts.changeStatus.new
                        }),
                        new ListItem({
                            id: 302,
                            firebaseId: 3002,
                            syncStatus: Consts.changeStatus.deleted
                        }),
                        new ListItem({
                            id: 303,
                            firebaseId: 3003,
                            syncStatus: Consts.changeStatus.changed
                        })
                    ]
                })
            ]

            await sync.syncLocalListToFirebase(USER_ID, localLists)

            assert.ok(firebaseSaveListStub.calledOnce, 'Firebase Save List not called')
            assert.ok(firebaseSaveListItemStub.calledTwice, 'Firebase Save List Item called two times')
            assert.ok(firebaseDeleteListItemStub.calledOnce, 'Firebase Delete List Item called once')
            assert.ok(localSaveListItemStub.notCalled, 'Local Save List must not be called')
            assert.ok(localDeleteListStub.notCalled, 'Delete List must not be called')
            assert.strictEqual(localSaveListStub.lastCall.args[1].listItems[0].firebaseId, 3001, 'Assign firebase Item id to new item')
        })

        it('should synchronize new firebase lists to Local Lists', async () => {
            localSaveListStub.reset()
            localSaveListStub
                .onFirstCall().returns(Promise.resolve(true))
                .onSecondCall().returns(Promise.resolve(true))

            localSaveListItemStub.reset()

            const currentTime = context.currentTime
            const serverLists = [
                new List({
                    id: 'firebaseId100',
                    modifiedAt: currentTime
                }),
                new List({
                    id: 'firebaseId200',
                    modifiedAt: currentTime,
                    listItems: [
                        new ListItem({
                            id: 'firebaseId201',
                            modifiedAt: currentTime
                        }),
                        new ListItem({
                            id: 'firebaseId202',
                            modifiedAt: currentTime
                        })
                    ]
                })
            ]

            await sync.syncFirebaseListToLocal(USER_ID, serverLists)

            assert.ok(localSaveListStub.calledTwice, 'Save two lists')

            const firstCallList = localSaveListStub.firstCall.args[1]
            assert.ok(firstCallList instanceof List, 'List of type List')
            assert.ok(!firstCallList.id, 'Set local id must be removed')
            assert.strictEqual(firstCallList.firebaseId, 'firebaseId100', 'Set firebase id')

            const secondCallList = localSaveListStub.secondCall.args[1]
            assert.ok(secondCallList instanceof List, 'List of type List')
            assert.ok(!secondCallList.id, 'Set list local id must be removed')
            assert.strictEqual(secondCallList.firebaseId, 'firebaseId200', 'Set list firebase id')

            assert.ok(!secondCallList.listItems[0].id, 'Remove list item id for first item')
            assert.strictEqual(secondCallList.listItems[0].firebaseId, 'firebaseId201', 'Set firebase item is for first item')
            assert.ok(!secondCallList.listItems[1].id, 'Remove list item id for second item')
            assert.strictEqual(secondCallList.listItems[1].firebaseId, 'firebaseId202', 'Set firebase item is for first item')

            assert.ok(localSaveListItemStub.notCalled, 'SAve list should save list items')
        })

        it('should synchronize firebase lists with existent Local Lists', async () => {
            localSaveListStub.reset()
            localSaveListStub
                .onFirstCall().returns(Promise.resolve(true))
                .onSecondCall().returns(Promise.resolve(true))

            localSaveListItemStub.reset()

            const currentTime = context.currentTime
            const serverLists = [
                new List({
                    id: 'firebaseId100',
                    localId: 100,
                    modifiedAt: currentTime
                }),
                new List({
                    id: 'firebaseId200',
                    localId: 200,
                    modifiedAt: currentTime,
                    listItems: [
                        new ListItem({
                            id: 'firebaseId201',
                            localId: 201,
                            modifiedAt: currentTime
                        }),
                        new ListItem({
                            id: 'firebaseId202',
                            localId: 202,
                            modifiedAt: currentTime
                        })
                    ]
                })
            ]

            await sync.syncFirebaseListToLocal(USER_ID, serverLists)

            assert.ok(localSaveListStub.calledTwice, 'Save two lists')

            const firstCallList = localSaveListStub.firstCall.args[1]
            assert.ok(firstCallList instanceof List, 'List of type List')
            assert.strictEqual(firstCallList.id, 100, 'Set local id')
            assert.strictEqual(firstCallList.firebaseId, 'firebaseId100', 'Set firebase id')

            const secondCallList = localSaveListStub.secondCall.args[1]
            assert.ok(secondCallList instanceof List, 'List of type List')
            assert.strictEqual(secondCallList.id, 200, 'Set list local id')
            assert.strictEqual(secondCallList.firebaseId, 'firebaseId200', 'Set list firebase id')

            assert.strictEqual(secondCallList.listItems[0].id, 201, 'Set list item id for first item')
            assert.strictEqual(secondCallList.listItems[0].firebaseId, 'firebaseId201', 'Set firebase item is for first item')
            assert.strictEqual(secondCallList.listItems[1].id, 202, 'Set list item id for second item')
            assert.strictEqual(secondCallList.listItems[1].firebaseId, 'firebaseId202', 'Set firebase item is for first item')

            assert.ok(localSaveListItemStub.notCalled, 'SAve list should save list items')
        })

        it('should synchronize deleted firebase lists with Local Lists', async () => {
            localSaveListStub.reset()
            localSaveListStub
                .onFirstCall().returns(Promise.resolve(true))
                .onSecondCall().returns(Promise.resolve(true))

            localSaveListItemStub.reset()

            const currentTime = context.currentTime
            const serverLists = [
                new List({
                    id: 100,
                    localId: 100,
                    firebaseId: 'firebaseId100',
                    syncStatus: Consts.changeStatus.deleted,
                    modifiedAt: currentTime
                }),
                new List({
                    id: 200,
                    localId: 200,
                    firebaseId: 'firebaseId200',
                    syncStatus: Consts.changeStatus.deleted,
                    modifiedAt: currentTime,
                    listItems: [
                        new ListItem({
                            id: 201,
                            localId: 201,
                            firebaseId: 'firebaseId201',
                            syncStatus: Consts.changeStatus.deleted,
                            modifiedAt: currentTime
                        }),
                        new ListItem({
                            id: 202,
                            firebaseId: 'firebaseId202',
                            localId: 202,
                            syncStatus: Consts.changeStatus.deleted,
                            modifiedAt: currentTime
                        })
                    ]
                })
            ]

            await sync.syncFirebaseListToLocal(USER_ID, serverLists)

            assert.ok(localDeleteListStub.calledTwice, 'Delete two lists')

            const firstCallListId = localDeleteListStub.firstCall.args[1]
            assert.strictEqual(firstCallListId, 100, 'Set local id')

            const secondCallListId = localDeleteListStub.secondCall.args[1]
            assert.strictEqual(secondCallListId, 200, 'Set list local id')

            assert.ok(localSaveListItemStub.notCalled, 'SAve list should save list items')
        })

        it('should perform call to store sync computation', async () => {
            function findInArray (array, id) {
                return array.filter(object => object.id === id)[0]
            }

            const syncLocalListToFirebaseStub = sinon.stub(sync, 'syncLocalListToFirebase')
            const syncFirebaseListToLocalStub = sinon.stub(sync, 'syncFirebaseListToLocal')

            syncLocalListToFirebaseStub.returns(Promise.resolve(true))
            syncFirebaseListToLocalStub.returns(Promise.resolve(true))

            const computed = {
                lists: {
                    newLocal: [
                        new List({ id: 1 }),
                        new List({ id: 5 })
                    ],
                    changedLocal: [
                        new List({
                            id: 2,
                            localId: 2,
                            firebaseId: 200,
                            listItems: [
                                new ListItem({ id: -20 }),
                                new ListItem({ id: -21 }),
                                new ListItem({ id: -22 }),
                                new ListItem({ id: -23 })
                            ]
                        })
                    ],
                    deletedLocal: [
                        new List({ id: 4, localId: 4, firebaseId: 400 })
                    ],
                    newServer: [
                        new List({ id: 100 })
                    ],
                    changedServer: [
                        new List({
                            id: 200,
                            localId: 2,
                            firebaseId: 200,
                            listItems: [
                                new ListItem({ id: 200 }),
                                new ListItem({ id: 201 }),
                                new ListItem({ id: 202 }),
                                new ListItem({ id: 203 })
                            ]
                        })
                    ],
                    deletedServer: [
                        new List({ id: 3, localId: 3, firebaseId: 300 })
                    ]
                },
                items: {
                    newLocal: [
                        new ListItem({ id: 10, listId: 1 }),
                        new ListItem({ id: 11, listId: 1 }),
                        new ListItem({ id: 23, listId: 2 })
                    ],
                    changedLocal: [
                        new ListItem({ id: 20, listId: 2 })
                    ],
                    deletedLocal: [
                        new ListItem({ id: 40, listId: 4 }),
                        new ListItem({ id: 41, listId: 4 }),
                        new ListItem({ id: 42, listId: 4 })
                    ],
                    newServer: [
                        new ListItem({ id: 101, listId: 100 }),
                        new ListItem({ id: 102, listId: 100 }),
                        new ListItem({ id: 202, listId: 200 })
                    ],
                    changedServer: [
                        new ListItem({ id: 201, listId: 200 })
                    ],
                    deletedServer: [
                        new ListItem({ id: 30, listId: 3 }),
                        new ListItem({ id: 22, listId: 2 })
                    ]
                }
            }

            await sync.syncLocalChangesWithFirebase(USER_ID, computed)

            assert.ok(syncLocalListToFirebaseStub.calledOnce, 'Local to Firebase not called or more than once')
            assert.ok(syncFirebaseListToLocalStub.calledOnce, 'Firebase to Local not called or more than once')

            const localLists = syncLocalListToFirebaseStub.firstCall.args[1]
            assert.strictEqual(localLists.length, 4)
            assert.strictEqual(findInArray(localLists, 1).listItems.length, 2, 'Items for List 1')
            assert.strictEqual(findInArray(localLists, 2).listItems.length, 3, 'Items for List 2')
            assert.strictEqual(findInArray(localLists, 4).listItems.length, 3, 'Items for List 4')
            assert.strictEqual(findInArray(localLists, 5).listItems.length, 0, 'Items for List 5')

            const serverLists = syncFirebaseListToLocalStub.firstCall.args[1]
            assert.strictEqual(serverLists.length, 3)
            assert.strictEqual(findInArray(serverLists, 100).listItems.length, 2, 'Items for List 100')
            assert.strictEqual(findInArray(serverLists, 200).listItems.length, 2, 'Items for List 200')
            assert.strictEqual(findInArray(serverLists, 3).listItems.length, 1, 'Items for List 3')

            syncLocalListToFirebaseStub.restore()
            syncFirebaseListToLocalStub.restore()
        })
    })

    describe('Compute Synchronization Per Object Type', () => {
        function _assertTotalNumberOfObjects (type, result, expectedTotal) {
            const actualTotal = Object.keys(result[type]).reduce((sum, option) => {
                return sum + result[type][option].length
            }, 0)
            assert.strictEqual(actualTotal, expectedTotal)
        }

        function assertTotalNumberOfLists (result, expectedTotal) {
            _assertTotalNumberOfObjects('lists', result, expectedTotal)
        }

        function assertTotalNumberOfListItems (result, expectedTotal) {
            _assertTotalNumberOfObjects('items', result, expectedTotal)
        }

        function assertListObjectIds (list, localId, firebaseId) {
            assert.strictEqual(list.localId, localId)
            assert.strictEqual(list.firebaseId, firebaseId)
        }

        it('should create a structure at the begin of the app', () => {
            const result = sync.computeListsToSync([], [], context.timeMinus1)

            assert.strictEqual(result.lists.newLocal.length, 0, 'new Local Lists')
            assert.strictEqual(result.lists.changedLocal.length, 0, 'changed Local Lists')
            assert.strictEqual(result.lists.deletedLocal.length, 0, 'deleted Local Lists')
            assert.strictEqual(result.lists.newServer.length, 0, 'new Server Lists')
            assert.strictEqual(result.lists.changedServer.length, 0, 'changed Server Lists')
            assert.strictEqual(result.lists.deletedServer.length, 0, 'deleted Server Lists')

            assert.strictEqual(result.items.newLocal.length, 0, 'new Local Lists')
            assert.strictEqual(result.items.changedLocal.length, 0, 'changed Local Lists')
            assert.strictEqual(result.items.deletedLocal.length, 0, 'deleted Local Lists')
            assert.strictEqual(result.items.newServer.length, 0, 'new Server Lists')
            assert.strictEqual(result.items.changedServer.length, 0, 'changed Server Lists')
            assert.strictEqual(result.items.deletedServer.length, 0, 'deleted Server Lists')

            assertTotalNumberOfLists(result, 0)
        })

        it('should detect only new local lists to synchronize', () => {
            const LocalLists = [
                new List({ id: 1, modifiedAt: context.timeMinus1, syncStatus: Consts.changeStatus.new }),
                new List({ id: 3, modifiedAt: context.timeMinus5, syncStatus: Consts.changeStatus.new }),
                new List({ id: 2, modifiedAt: context.timePlus1, syncStatus: Consts.changeStatus.changed }),
                new List({ id: 4, modifiedAt: context.timeMinus6, firebaseId: 401 })
            ]
            const ServerLists = [
                new List({ id: 401, modifiedAt: context.timeMinus6 })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus5)

            assert.strictEqual(result.lists.newLocal.length, 3)
            assertListObjectIds(result.lists.newLocal[0], 1, undefined)
            assertListObjectIds(result.lists.newLocal[1], 3, undefined)
            assertListObjectIds(result.lists.newLocal[2], 2, undefined)
            assertTotalNumberOfLists(result, 3)
        })

        it('should detect only new server lists to synchronize', () => {
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timeMinus1 }),
                new List({ id: 301, modifiedAt: context.timeMinus5 }),
                new List({ id: 201, modifiedAt: context.timePlus1 })
            ]

            const result = sync.computeListsToSync([], ServerLists, context.timeMinus5)

            assert.strictEqual(result.lists.newServer.length, 3)
            assertListObjectIds(result.lists.newServer[0], undefined, 101)
            assertListObjectIds(result.lists.newServer[1], undefined, 301)
            assertListObjectIds(result.lists.newServer[2], undefined, 201)
            assertTotalNumberOfLists(result, 3)
        })

        it('should detect only new lists to synchronize', () => {
            const LocalLists = [
                new List({ id: 1, modifiedAt: context.timeMinus2, syncStatus: Consts.changeStatus.changed })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timeMinus1 })
            ]
            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus5)

            assert.strictEqual(result.lists.newLocal.length, 1)
            assertListObjectIds(result.lists.newLocal[0], 1, undefined)
            assert.strictEqual(result.lists.newServer.length, 1)
            assertListObjectIds(result.lists.newServer[0], undefined, 101)
            assertTotalNumberOfLists(result, 2)
        })

        it('should detect locally deleted list', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, syncStatus: Consts.changeStatus.deleted, modifiedAt: context.timePlus1 })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timeMinus6 })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus5)

            assert.strictEqual(result.lists.deletedLocal.length, 1)
            assertListObjectIds(result.lists.deletedLocal[0], 1, 101)
            assert.strictEqual(result.lists.deletedLocal[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfLists(result, 1)
        })

        it('should detect locally deleted List already deleted list at server side', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, syncStatus: Consts.changeStatus.deleted, modifiedAt: context.timePlus1 })
            ]

            const result = sync.computeListsToSync(LocalLists, [], context.timeMinus5)

            assert.strictEqual(result.lists.deletedLocal.length, 1)
            assertListObjectIds(result.lists.deletedLocal[0], 1, 101)
            assert.strictEqual(result.lists.deletedLocal[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfLists(result, 1)
        })

        it('should detect deleted list at server side', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, modifiedAt: context.timeMinus6 })
            ]

            const result = sync.computeListsToSync(LocalLists, [], context.timeMinus3)

            assert.strictEqual(result.lists.deletedServer.length, 1)
            assertListObjectIds(result.lists.deletedServer[0], 1, 101)
            assert.strictEqual(result.lists.deletedServer[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfLists(result, 1)
        })

        it('should detect local changes to unchanged server list', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, syncStatus: Consts.changeStatus.changed, modifiedAt: context.timeMinus1, name: 'test' })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timeMinus6 })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus2)

            assert.strictEqual(result.lists.changedLocal[0].name, 'test')
            assertListObjectIds(result.lists.changedLocal[0], 1, 101)
            assertTotalNumberOfLists(result, 1)
        })

        it('should detect server changes to unchanged local list', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, modifiedAt: context.timeMinus6 })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timePlus1, name: 'test' })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus2)

            assert.strictEqual(result.lists.changedServer[0].name, 'test')
            assertListObjectIds(result.lists.changedServer[0], 1, 101)
            assertTotalNumberOfLists(result, 1)
        })

        it('should take local change when changed before server change', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, modifiedAt: context.timeMinus1, name: 'local', syncStatus: Consts.changeStatus.changed })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timePlus1, name: 'server' })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus3)

            assert.strictEqual(result.lists.changedLocal[0].name, 'local')
            assertListObjectIds(result.lists.changedLocal[0], 1, 101)
            assertTotalNumberOfLists(result, 1)
        })

        it('should take server change when changed before local change', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, modifiedAt: context.timePlus3, name: 'local', syncStatus: Consts.changeStatus.changed })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timePlus1, name: 'server' })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus3)

            assert.strictEqual(result.lists.changedServer[0].name, 'server')
            assertListObjectIds(result.lists.changedServer[0], 1, 101)
            assertTotalNumberOfLists(result, 1)
        })

        it('should take local delete over server change even if server change was before', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, modifiedAt: context.timePlus3, syncStatus: Consts.changeStatus.deleted })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timeMinus1 })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus3)

            assert.strictEqual(result.lists.deletedLocal.length, 1)
            assertListObjectIds(result.lists.deletedLocal[0], 1, 101)
            assert.strictEqual(result.lists.deletedLocal[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfLists(result, 1)
        })

        it('should take server delete over local change even if local change was before', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, modifiedAt: context.timePlus3, syncStatus: Consts.changeStatus.changed })
            ]

            const result = sync.computeListsToSync(LocalLists, [], context.timeMinus3)

            assert.strictEqual(result.lists.deletedServer.length, 1)
            assertListObjectIds(result.lists.deletedServer[0], 1, 101)
            assert.strictEqual(result.lists.deletedServer[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfLists(result, 1)
        })

        it('should not take already synchronized lists', () => {
            const LocalLists = [
                new List({ id: 1, firebaseId: 101, modifiedAt: context.timeMinus3 })
            ]
            const ServerLists = [
                new List({ id: 101, modifiedAt: context.timeMinus1 })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timePlus3)

            assertTotalNumberOfLists(result, 0)
        })

        it('should add new local list items from new Lists', () => {
            const LocalLists = [
                new List({
                    id: 1,
                    syncStatus: Consts.changeStatus.new,
                    listItems: [
                        new ListItem({ id: 11, syncStatus: Consts.changeStatus.new, modifiedAt: context.timeMinus2 }),
                        new ListItem({ id: 12, syncStatus: Consts.changeStatus.changed, modifiedAt: context.timeMinus3 })
                    ]
                }),
                new List({
                    id: 2,
                    syncStatus: Consts.changeStatus.changed,
                    listItems: [
                        new ListItem({ id: 21, syncStatus: Consts.changeStatus.new, modifiedAt: context.timeMinus2 }),
                        new ListItem({ id: 22, syncStatus: Consts.changeStatus.changed, modifiedAt: context.timeMinus3 })
                    ]
                })
            ]

            const result = sync.computeListsToSync(LocalLists, [], context.timeMinus4)

            assert.strictEqual(result.items.newLocal.length, 4)
            assertListObjectIds(result.items.newLocal[0], 11, undefined)
            assertListObjectIds(result.items.newLocal[3], 22, undefined)
            assertTotalNumberOfListItems(result, 4)
        })

        it('should add new local list items from already synchronized changed Lists', () => {
            const LocalLists = [
                new List({
                    id: 1,
                    firebaseId: 100,
                    syncStatus: Consts.changeStatus.changed,
                    modifiedAt: context.timeMinus2,
                    listItems: [
                        new ListItem({ id: 11, listId: 1, syncStatus: Consts.changeStatus.new, modifiedAt: context.timeMinus2 }),
                        new ListItem({ id: 12, listId: 1, syncStatus: Consts.changeStatus.changed, modifiedAt: context.timeMinus3 })
                    ]
                })
            ]

            const ServerLists = [
                new List({ id: 100 })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus4)

            assert.strictEqual(result.items.newLocal.length, 2)
            assertListObjectIds(result.items.newLocal[0], 11, undefined)
            assertListObjectIds(result.items.newLocal[1], 12, undefined)
            assertTotalNumberOfLists(result, 1)
            assertTotalNumberOfListItems(result, 2)
        })

        it('should add new local list items from already synchronized unchanged Lists', () => {
            const LocalLists = [
                new List({
                    id: 1,
                    firebaseId: 100,
                    listItems: [
                        new ListItem({ id: 11, listId: 1, syncStatus: Consts.changeStatus.new, modifiedAt: context.timeMinus2 }),
                        new ListItem({ id: 12, listId: 1, syncStatus: Consts.changeStatus.changed, modifiedAt: context.timeMinus3 })
                    ]
                })
            ]

            const ServerLists = [
                new List({ id: 100 })
            ]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus4)

            assert.strictEqual(result.items.newLocal.length, 2)
            assertListObjectIds(result.items.newLocal[0], 11, undefined)
            assertListObjectIds(result.items.newLocal[1], 12, undefined)
            assertTotalNumberOfLists(result, 1)
            assertTotalNumberOfListItems(result, 2)
        })

        it('should add deleted local list items from deleted lists', () => {
            const LocalLists = [
                new List({
                    id: 1,
                    firebaseId: 100,
                    syncStatus: Consts.changeStatus.deleted,
                    listItems: [
                        new ListItem({ id: 11, syncStatus: Consts.changeStatus.new, modifiedAt: context.timeMinus2 })
                    ]
                }),
                new List({
                    id: 2,
                    firebaseId: 200,
                    syncStatus: Consts.changeStatus.deleted,
                    listItems: [
                        new ListItem({ id: 21, firebaseId: 200, syncStatus: Consts.changeStatus.deleted, modifiedAt: context.timeMinus3 })
                    ]
                })
            ]

            const result = sync.computeListsToSync(LocalLists, [], context.timeMinus4)

            assert.strictEqual(result.items.deletedLocal.length, 2)
            assertListObjectIds(result.items.deletedLocal[0], 11, undefined)
            assertListObjectIds(result.items.deletedLocal[1], 21, 200)
            assert.strictEqual(result.items.deletedLocal[0].syncStatus, Consts.changeStatus.deleted)
            assert.strictEqual(result.items.deletedLocal[1].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfListItems(result, 2)
        })

        it('should add new server list items from new lists', () => {
            const ServerLists = [
                new List({
                    id: 100,
                    modifiedAt: context.timeMinus3,
                    listItems: [
                        new ListItem({ id: 101, modifiedAt: context.timeMinus2 })
                    ]
                }),
                new List({
                    id: 200,
                    modifiedAt: context.timePlus1,
                    listItems: [
                        new ListItem({ id: 201, modifiedAt: context.timePlus1 })
                    ]
                })
            ]

            const result = sync.computeListsToSync([], ServerLists, context.timeMinus4)

            assert.strictEqual(result.items.newServer.length, 2)
            assertListObjectIds(result.items.newServer[0], undefined, 101)
            assertListObjectIds(result.items.newServer[1], undefined, 201)
            assertTotalNumberOfListItems(result, 2)
        })

        it('should add deleted server list items from deleted lists', () => {
            const LocalLists = [
                new List({
                    id: 1,
                    firebaseId: 100,
                    listItems: [
                        new ListItem({ id: 11, firebaseId: 101 })
                    ]
                }),
                new List({
                    id: 2,
                    firebaseId: 200,
                    listItems: [
                        new ListItem({ id: 21, firebaseId: 201 })
                    ]
                })
            ]

            const result = sync.computeListsToSync(LocalLists, [], context.timeMinus4)

            assert.strictEqual(result.items.deletedServer.length, 2)
            assertListObjectIds(result.items.deletedServer[0], 11, 101)
            assertListObjectIds(result.items.deletedServer[1], 21, 201)
            assert.strictEqual(result.items.deletedServer[0].syncStatus, Consts.changeStatus.deleted)
            assert.strictEqual(result.items.deletedServer[1].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfListItems(result, 2)
        })

        it('should compute list items from locally changed lists', () => {
            const LocalLists = [new List({
                id: 1,
                firebaseId: 100,
                modifiedAt: context.timeMinus2,
                syncStatus: Consts.changeStatus.changed,
                listItems: [
                    new ListItem({ id: 11, firebaseId: 101, modifiedAt: context.timeMinus3, syncStatus: Consts.changeStatus.changed }),
                    new ListItem({ id: 12, firebaseId: 102, modifiedAt: context.timeMinus2, syncStatus: Consts.changeStatus.deleted }),
                    new ListItem({ id: 13, firebaseId: 103, name: 'unchanged' }),
                    new ListItem({ id: 14, modifiedAt: context.timePlus4, syncStatus: Consts.changeStatus.new })
                ]
            })]

            const ServerLists = [new List({
                id: 100,
                modifiedAt: context.timeMinus6,
                listItems: [
                    new ListItem({ id: 101, modifiedAt: context.timeMinus6 }),
                    new ListItem({ id: 102, modifiedAt: context.timeMinus6 }),
                    new ListItem({ id: 103, name: 'unchanged' })
                ]
            })]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus5)

            assert.strictEqual(result.items.newLocal.length, 1, 'New local not added')
            assert.strictEqual(result.items.changedLocal.length, 1, 'Changed local not added')
            assert.strictEqual(result.items.deletedLocal.length, 1, 'Deleted local not added')
            assertListObjectIds(result.items.newLocal[0], 14, undefined)
            assertListObjectIds(result.items.changedLocal[0], 11, 101)
            assertListObjectIds(result.items.deletedLocal[0], 12, 102)
            assert.strictEqual(result.items.deletedLocal[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfListItems(result, 3)
        })

        it('should compute list items from serverside changed lists', () => {
            const LocalLists = [new List({
                id: 1,
                firebaseId: 100,
                modifiedAt: context.timeMinus6,
                listItems: [
                    new ListItem({ id: 11, firebaseId: 101, modifiedAt: context.timeMinus6 }),
                    new ListItem({ id: 12, firebaseId: 102, modifiedAt: context.timeMinus6 }),
                    new ListItem({ id: 13, firebaseId: 103, modifiedAt: context.timeMinus6 })
                ]
            })]

            const ServerLists = [new List({
                id: 100,
                modifiedAt: context.timePlus1,
                listItems: [
                    new ListItem({ id: 101, modifiedAt: context.timeMinus1 }),
                    new ListItem({ id: 102, name: 'unchanged' }),
                    new ListItem({ id: 104, name: 'new', modifiedAt: context.timePlus2 })
                ]
            })]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus5)

            assert.strictEqual(result.items.newServer.length, 1, 'New server not added')
            assert.strictEqual(result.items.changedServer.length, 1, 'Changed server not added')
            assert.strictEqual(result.items.deletedServer.length, 1, 'Deleted server not added')
            assertListObjectIds(result.items.newServer[0], undefined, 104)
            assertListObjectIds(result.items.changedServer[0], 11, 101)
            assertListObjectIds(result.items.deletedServer[0], 13, 103)
            assert.strictEqual(result.items.deletedServer[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfListItems(result, 3)
        })

        it('should compute list items from local and serverside changed lists', () => {
            const LocalLists = [new List({
                id: 1,
                firebaseId: 100,
                modifiedAt: context.timePlus4,
                listItems: [
                    new ListItem({ id: 10, firebaseId: 100, modifiedAt: context.timePlus3, name: 'server changes first', syncStatus: Consts.changeStatus.changed }),
                    new ListItem({ id: 11, firebaseId: 101, modifiedAt: context.timeMinus1, name: 'first changed wins', syncStatus: Consts.changeStatus.changed }),
                    new ListItem({ id: 12, firebaseId: 102, modifiedAt: context.timeMinus6 }),
                    new ListItem({ id: 13, firebaseId: 103, modifiedAt: context.timeMinus2, name: 'deleted server side has preference', syncStatus: Consts.changeStatus.changed }),
                    new ListItem({ id: 14, firebaseId: 104, modifiedAt: context.timeMinus4, name: 'local delete takes preference', syncStatus: Consts.changeStatus.deleted }),
                    new ListItem({ id: 15, modifiedAt: context.timePlus1, name: 'new Local', syncStatus: Consts.changeStatus.new })
                ]
            })]

            const ServerLists = [new List({
                id: 100,
                modifiedAt: context.timePlus1,
                listItems: [
                    new ListItem({ id: 100, modifiedAt: context.timeMinus4 }),
                    new ListItem({ id: 101, modifiedAt: context.timePlus4 }),
                    new ListItem({ id: 102, name: 'unchanged', modifiedAt: context.timeMinus6 }),
                    new ListItem({ id: 104, name: 'changed', modifiedAt: context.timePlus2 }),
                    new ListItem({ id: 106, name: 'new server', modifiedAt: context.timePlus5 })
                ]
            })]

            const result = sync.computeListsToSync(LocalLists, ServerLists, context.timeMinus5)

            assert.strictEqual(result.items.newLocal.length, 1, 'New local not added')
            assert.strictEqual(result.items.newServer.length, 1, 'New server not added')
            assert.strictEqual(result.items.changedLocal.length, 1, 'Changed local not added')
            assert.strictEqual(result.items.changedServer.length, 1, 'Changed server not added')
            assert.strictEqual(result.items.deletedLocal.length, 1, 'Deleted local not added')
            assert.strictEqual(result.items.deletedServer.length, 1, 'Deleted server not added')
            assertListObjectIds(result.items.newLocal[0], 15, undefined)
            assertListObjectIds(result.items.newServer[0], undefined, 106)
            assertListObjectIds(result.items.changedLocal[0], 11, 101)
            assertListObjectIds(result.items.changedServer[0], 10, 100)
            assertListObjectIds(result.items.deletedLocal[0], 14, 104)
            assertListObjectIds(result.items.deletedServer[0], 13, 103)
            assert.strictEqual(result.items.deletedLocal[0].syncStatus, Consts.changeStatus.deleted)
            assert.strictEqual(result.items.deletedServer[0].syncStatus, Consts.changeStatus.deleted)
            assertTotalNumberOfListItems(result, 6)
        })

        it('should add server side lists in new database', () => {
            const ServerLists = [new List({
                id: 'LIST100',
                modifiedAt: context.timePlus1,
                listItems: [
                    new ListItem({ id: 'ITEM110', listId: 'LIST100', modifiedAt: context.timeMinus4 })
                ]
            }), new List({
                id: 'LIST200',
                modifiedAt: context.timePlus2,
                listItems: [
                    new ListItem({ id: 'ITEM210', listId: 'LIST200', modifiedAt: context.timeMinus2 }),
                    new ListItem({ id: 'ITEM220', listId: 'LIST200', modifiedAt: context.timeMinus1 })
                ]
            })]

            const result = sync.computeListsToSync([], ServerLists, 0)

            assertListObjectIds(result.lists.newServer[0], undefined, 'LIST100')
            assertListObjectIds(result.lists.newServer[1], undefined, 'LIST200')
            assertListObjectIds(result.items.newServer[0], undefined, 'ITEM110')
            assertListObjectIds(result.items.newServer[1], undefined, 'ITEM210')
            assertListObjectIds(result.items.newServer[2], undefined, 'ITEM220')
            assertTotalNumberOfLists(result, 2)
            assertTotalNumberOfListItems(result, 3)
        })
    })
})
