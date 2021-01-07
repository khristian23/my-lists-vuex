/* eslint-disable jest/expect-expect */
import storage from 'src/storage/IndexedDB/storage-idb'
import idb from 'src/storage/IndexedDB/indexed-db'
import List from 'src/storage/List'
import ListItem from 'src/storage/ListItem'
import Profile from 'src/storage/Profile'
import Const from 'src/util/constants'
import assert from 'assert'
import sinon from 'sinon'
import { assertThrowsAsync } from '../util/helpers'

const USER_ID = 'Christian'
const LIST_TABLE = 'list'
const LIST_ITEM_TABLE = 'item'

describe('Indexed DB Storage', () => {
    let idbGetObjectsByStub
    let idbAddObjectStub
    let idbUpdateObjectStub
    let idbDeleteObjectStub

    beforeAll(() => {
        idbGetObjectsByStub = sinon.stub(idb, 'getObjectsBy')
        idbAddObjectStub = sinon.stub(idb, 'addObject')
        idbUpdateObjectStub = sinon.stub(idb, 'updateObject')
        idbDeleteObjectStub = sinon.stub(idb, 'deleteObjectsBy')
    })

    afterAll(() => {
        idbGetObjectsByStub.restore()
        idbAddObjectStub.restore()
        idbUpdateObjectStub.restore()
        idbDeleteObjectStub.restore()
    })

    it('should not return lists for unknown user', async () => {
        idbGetObjectsByStub
            .withArgs(LIST_TABLE, { userId: 'Unknown' })
            .returns(Promise.resolve([]))

        const lists = await storage.getLists('Unknown')
        assert.strictEqual(lists.length, 0, 'Wrong number of lists')
    })

    it('should retrieve lists of type List', async () => {
        idbGetObjectsByStub
            .withArgs(LIST_TABLE, { userId: USER_ID })
            .returns(Promise.resolve([{
                name: 'list1'
            }, {
                name: 'list2'
            }]))

        const lists = await storage.getLists(USER_ID)
        assert.strictEqual(lists.length, 2, 'Wrong number of lists')
        assert.ok(lists.every(list => list instanceof List), 'Wrong object type')
    })

    it('should retrieve a list of type List', async () => {
        idbGetObjectsByStub
            .withArgs(LIST_TABLE, { id: 100 })
            .returns(Promise.resolve([{ id: 100, name: 'list1', userId: USER_ID }]))

        const list = await storage.getList(USER_ID, 100)
        assert.ok(list instanceof List, 'wrong data type')
        assert.ok(list.name, 'list1', 'not the right list name')
    })

    it('should not retrieve a list of a different user', async () => {
        idbGetObjectsByStub
            .withArgs(LIST_TABLE, { id: 200 })
            .returns(Promise.resolve([{ id: 200, name: 'list1', user: 'OtroUsuario' }]))

        await assertThrowsAsync(async () => { await storage.getList(USER_ID, 200) }, /^Error: List ID:200 not found for user Christian$/)
    })

    it('should retriebe a list and without items', async () => {
        idbGetObjectsByStub
            .withArgs(LIST_ITEM_TABLE, { listId: 300 })
            .returns(Promise.resolve([]))
        idbGetObjectsByStub
            .withArgs(LIST_TABLE, { id: 300 })
            .returns(Promise.resolve([{ id: 300, name: 'list1', userId: USER_ID }]))

        const list = await storage.getList(USER_ID, 300)
        assert.ok(list instanceof List, 'Wrong List ype')
        assert.strictEqual(list.listItems.length, 0, 'Wrong number of items')
    })

    it('should retrieve a list and its items', async () => {
        idbGetObjectsByStub
            .withArgs(LIST_ITEM_TABLE, { listId: 400 })
            .returns(Promise.resolve([{
                id: 401, listId: 400, name: 'item1'
            }, {
                id: 401, listId: 400, name: 'item2'
            }]))
        idbGetObjectsByStub
            .withArgs(LIST_TABLE, { id: 400 })
            .returns(Promise.resolve([{ id: 300, name: 'list1', userId: USER_ID }]))

        const list = await storage.getList(USER_ID, 400)
        assert.ok(list instanceof List, 'Wrong List ype')
        assert.strictEqual(list.listItems.length, 2, 'Wrong number of items')
        assert.ok(list.listItems.every(item => item instanceof ListItem), 'Wrong list item type')
        assert.strictEqual(list.listItems[1].name, 'item2', 'Wrong name in List')
    })

    it('should retrieve lists and their list items', async () => {
        idbGetObjectsByStub
            .withArgs(LIST_TABLE, { userId: USER_ID })
            .returns(Promise.resolve([
                { id: 100 },
                { id: 200 }
            ]))

        idbGetObjectsByStub
            .withArgs(LIST_ITEM_TABLE, { listId: 100 })
            .returns(Promise.resolve([
                { id: 101 }
            ]))
            .withArgs(LIST_ITEM_TABLE, { listId: 200 })
            .returns(Promise.resolve([
                { id: 201 },
                { id: 202 }
            ]))

        const lists = await storage.getLists(USER_ID)
        assert.strictEqual(lists.length, 2)
        assert.strictEqual(lists[0].listItems.length, 1)
        assert.strictEqual(lists[1].listItems.length, 2)
    })

    it('should throw error when no specified list with ID is found', async () => {
        idbGetObjectsByStub.withArgs(LIST_TABLE, { id: 999 }).returns(Promise.resolve([undefined]))
        await assertThrowsAsync(async () => { await storage.getList(USER_ID, 999) }, /^Error: List ID:999 not found for user Christian$/)
    })

    it('should throw error when trying to save other than a List instance', async () => {
        await assertThrowsAsync(async () => { await storage.saveList(USER_ID, {}) }, /^Error: Wrong list object type$/)
    })

    it('should save a new list without items', async () => {
        const generatedListId = 100

        idbAddObjectStub.reset()
        idbAddObjectStub.returns(Promise.resolve(generatedListId))

        const list = new List({
            name: 'test list',
            syncStatus: Const.changeStatus.new,
            modifiedAt: new Date().getTime()
        })
        const expectedObjectToSave = list.clone().toObject()
        expectedObjectToSave.userId = USER_ID
        delete expectedObjectToSave.id

        await storage.saveList(USER_ID, list)
        assert.ok(idbAddObjectStub.calledOnceWith(LIST_TABLE), 'called once to save list')
        assert.strictEqual(list.id, generatedListId, 'retrieve generated id')

        const objectToSave = idbAddObjectStub.lastCall.args[1]
        assert.deepEqual(objectToSave, expectedObjectToSave, 'objects to save not match')
    })

    it('should save a new list with items', async () => {
        const generatedListId = 200

        idbAddObjectStub.reset()
        idbAddObjectStub.withArgs(LIST_TABLE).returns(Promise.resolve(generatedListId))
        idbAddObjectStub.withArgs(LIST_ITEM_TABLE)
            .onFirstCall().returns(Promise.resolve(generatedListId + 1))
            .onSecondCall().returns(Promise.resolve(generatedListId + 2))

        const list = new List({
            name: 'test list with items',
            syncStatus: Const.changeStatus.new,
            modifiedAt: new Date().getTime(),
            listItems: [new ListItem({
                name: 'item 1',
                status: Const.itemStatus.pending,
                syncStatus: Const.changeStatus.new,
                modifiedAt: new Date().getTime()
            }), new ListItem({
                nane: 'item 2',
                status: Const.itemStatus.pending,
                syncStatus: Const.changeStatus.new,
                modifiedAt: new Date().getTime()
            })]
        })

        const expectedObjectAsArg = list.toObject()
        expectedObjectAsArg.userId = USER_ID
        delete expectedObjectAsArg.id

        const expectedItemsAsArgs = list.listItems.map(item => {
            const objectItem = item.toObject()
            objectItem.userId = USER_ID
            objectItem.listId = generatedListId
            delete objectItem.id
            return objectItem
        })

        await storage.saveList(USER_ID, list)
        assert.strictEqual(idbAddObjectStub.withArgs(LIST_TABLE).callCount, 1, 'List not called once')
        assert.strictEqual(idbAddObjectStub.withArgs(LIST_ITEM_TABLE).callCount, 2, 'List Item not called twice')

        let objectToSave = idbAddObjectStub.firstCall.args[1]
        assert.deepStrictEqual(objectToSave, expectedObjectAsArg, 'List save called with the right argument')
        objectToSave = idbAddObjectStub.secondCall.args[1]
        assert.deepStrictEqual(objectToSave, expectedItemsAsArgs[0], 'First List Item save called with the right argument')
        objectToSave = idbAddObjectStub.thirdCall.args[1]
        assert.deepStrictEqual(objectToSave, expectedItemsAsArgs[1], 'Second List Item save called with the right argument')

        assert.strictEqual(list.id, generatedListId, 'List retrieved generated id')
        assert.strictEqual(list.listItems[0].id, generatedListId + 1, 'First List Item retrieved generated id')
        assert.strictEqual(list.listItems[0].listId, generatedListId, 'First List Item must have list id')
        assert.strictEqual(list.listItems[1].id, generatedListId + 2, 'Second List Item retrieved generated id')
        assert.strictEqual(list.listItems[1].listId, generatedListId, 'Second List Item must have list id')
    })

    it('should save an existent list without items', async () => {
        idbUpdateObjectStub.reset()
        idbUpdateObjectStub.returns(Promise.resolve({}))

        const list = new List({
            id: 123,
            name: 'existent test list',
            syncStatus: Const.changeStatus.changed,
            modifiedAt: new Date().getTime()
        })
        const expectedObjectToSave = list.toObject()
        expectedObjectToSave.userId = USER_ID

        await storage.saveList(USER_ID, list)
        assert.ok(idbUpdateObjectStub.calledOnceWith(LIST_TABLE), 'called once to save list')

        const objectToSave = idbUpdateObjectStub.lastCall.args[1]
        assert.deepEqual(objectToSave, expectedObjectToSave, 'objects to save not match')
    })

    it('should save an existent list with items', async () => {
        const generatedListId = 300

        idbAddObjectStub.reset()
        idbUpdateObjectStub.reset()
        idbUpdateObjectStub.withArgs(LIST_TABLE).returns(Promise.resolve({}))
        idbUpdateObjectStub.withArgs(LIST_ITEM_TABLE).returns(Promise.resolve({}))
        idbAddObjectStub.withArgs(LIST_ITEM_TABLE).returns(Promise.resolve(generatedListId + 2))

        const list = new List({
            id: 300,
            name: 'test list with items',
            syncStatus: Const.changeStatus.changed,
            modifiedAt: new Date().getTime(),
            listItems: [new ListItem({
                id: 301,
                name: 'item 1',
                status: Const.itemStatus.pending,
                syncStatus: Const.changeStatus.changed
            }), new ListItem({
                nane: 'item 2',
                status: Const.itemStatus.pending,
                syncStatus: Const.changeStatus.new,
                modifiedAt: new Date().getTime()
            })]
        })

        const expectedObjectAsArg = list.toObject()
        expectedObjectAsArg.userId = USER_ID

        const expectedItemsAsArgs = list.listItems.map(item => {
            const objectItem = item.toObject()
            objectItem.userId = USER_ID
            objectItem.listId = generatedListId
            if (!objectItem.id) {
                delete objectItem.id
            }
            return objectItem
        })

        await storage.saveList(USER_ID, list)
        assert.strictEqual(idbUpdateObjectStub.withArgs(LIST_TABLE).callCount, 1, 'List not called once')
        assert.strictEqual(idbUpdateObjectStub.withArgs(LIST_ITEM_TABLE).callCount, 1, 'Update List Item not called once')
        assert.strictEqual(idbAddObjectStub.withArgs(LIST_ITEM_TABLE).callCount, 1, 'New List Item not called once')

        let objectToSave = idbUpdateObjectStub.firstCall.args[1]
        assert.deepEqual(objectToSave, expectedObjectAsArg, 'List save called with the right argument')
        objectToSave = idbUpdateObjectStub.secondCall.args[1]
        assert.deepEqual(objectToSave, expectedItemsAsArgs[0], 'Update List Item save called with the right argument')
        objectToSave = idbAddObjectStub.firstCall.args[1]
        assert.deepEqual(objectToSave, expectedItemsAsArgs[1], 'New List Item save called with the right argument')

        assert.strictEqual(list.id, generatedListId, 'List retrieved generated id')
        assert.strictEqual(list.listItems[0].id, generatedListId + 1, 'First List Item retrieved generated id')
        assert.strictEqual(list.listItems[0].listId, generatedListId, 'First List Item must have list id')
        assert.strictEqual(list.listItems[1].id, generatedListId + 2, 'Second List Item retrieved generated id')
        assert.strictEqual(list.listItems[1].listId, generatedListId, 'Second List Item must have list id')
    })

    it('should save an array of lists', async () => {
        idbAddObjectStub.reset()
        idbUpdateObjectStub.reset()

        idbAddObjectStub
            .onFirstCall().returns(Promise.resolve(100))
            .onSecondCall().returns(Promise.resolve(200))
        idbUpdateObjectStub.returns(Promise.resolve({}))

        const lists = [
            new List({ id: 50, name: 'test list 1' }),
            new List({ name: 'test list 2' }),
            new List({ id: 150, name: 'test list 3' }),
            new List({ name: 'test list 4' })
        ]

        await storage.saveLists(USER_ID, lists)

        assert.strictEqual(idbAddObjectStub.callCount, 2, 'Add list  not called twice')
        assert.strictEqual(idbUpdateObjectStub.callCount, 2, 'Update list not called twice')

        assert.strictEqual(lists[1].id, 100, 'First Id properly retrieved')
        assert.strictEqual(lists[3].id, 200, 'Second Id properly retrieved')
    })

    it('should throw exception is not List Item type of object', async () => {
        await assertThrowsAsync(async () => { await storage.saveListItem(USER_ID, {}) }, /^Error: Wrong List Item object type$/)
    })

    it('should throw exception is no ListId is provided in List Item', async () => {
        await assertThrowsAsync(async () => { await storage.saveListItem(USER_ID, new ListItem({})) }, /^Error: List Item must have a listId$/)
    })

    it('should be able to directly save a list item', async () => {
        idbAddObjectStub.reset()

        idbAddObjectStub.returns(Promise.resolve(123))

        const listItem = new ListItem({
            name: 'List Item test A',
            listId: 100
        })

        await storage.saveListItem(USER_ID, listItem)

        assert.ok(idbAddObjectStub.calledOnceWith(LIST_ITEM_TABLE), 'Called once for list item')
        assert.strictEqual(listItem.id, 123, 'Retrieves generated Id')
        assert.strictEqual(listItem.userId, USER_ID, 'Sets the proper User Id')
    })

    it('should be able to direcly save an array of list items', async () => {
        idbAddObjectStub.reset()
        idbUpdateObjectStub.reset()

        idbAddObjectStub
            .onFirstCall().returns(Promise.resolve(100))
            .onSecondCall().returns(Promise.resolve(200))

        const listItems = [
            new ListItem({ id: 50, name: 'My List Item 1', listId: 10 }),
            new ListItem({ id: 70, name: 'My List Item 2', listId: 10 }),
            new ListItem({ name: 'My List Item 3', listId: 10 }),
            new ListItem({ name: 'My List Item 4', listId: 10 })
        ]

        await storage.saveListItems(USER_ID, listItems)

        assert.strictEqual(idbAddObjectStub.callCount, 2, 'Add list items not called twice')
        assert.strictEqual(idbUpdateObjectStub.callCount, 2, 'Update list items not called twice')

        assert.strictEqual(listItems[2].id, 100, 'First Id properly retrieved')
        assert.strictEqual(listItems[3].id, 200, 'Second Id properly retrieved')
    })

    it('should delete a list', async () => {
        const listId = 200

        idbDeleteObjectStub.reset()
        idbDeleteObjectStub.returns(Promise.resolve({}))

        await storage.deleteList(USER_ID, listId)

        assert.ok(idbDeleteObjectStub.calledWithExactly(LIST_ITEM_TABLE, { listId: listId }), 'Delete List Items')
        assert.ok(idbDeleteObjectStub.calledWithExactly(LIST_TABLE, { id: listId }), 'Delete List')
    })

    it('should handle list Items from a changed Saved List', async () => {
        idbDeleteObjectStub.reset()
        idbDeleteObjectStub.returns(Promise.resolve({}))
        idbUpdateObjectStub.reset()
        idbUpdateObjectStub.returns(Promise.resolve({}))
        idbAddObjectStub.reset()
        idbAddObjectStub.returns(Promise.resolve({}))

        const list = new List({
            id: 300,
            syncStatus: Const.changeStatus.changed,
            listItems: [
                new ListItem({ id: 30, name: 'Item1', firebaseId: 3001, syncStatus: Const.changeStatus.deleted }),
                new ListItem({ id: 31, name: 'Item2', firebaseId: 3002 }),
                new ListItem({ id: 32, name: 'Item3', firebaseId: 3003, syncStatus: Const.changeStatus.changed }),
                new ListItem({ name: 'Item4', syncStatus: Const.changeStatus.new }),
                new ListItem({ id: 34, name: 'Item5', syncStatus: Const.changeStatus.deleted })
            ]
        })

        await storage.saveList(USER_ID, list)

        const items = list.listItems
        const newItem = items[3].toObject()
        delete newItem.id
        assert.ok(idbUpdateObjectStub.calledWithExactly(LIST_ITEM_TABLE, items[0].toObject()), 'Flag Deleted List Item')
        assert.ok(idbUpdateObjectStub.calledWithExactly(LIST_ITEM_TABLE, items[1].toObject()), 'Unchanged List Item also updated')
        assert.ok(idbUpdateObjectStub.calledWithExactly(LIST_ITEM_TABLE, items[2].toObject()), 'Change List Item')
        assert.ok(idbAddObjectStub.calledWithExactly(LIST_ITEM_TABLE, newItem), 'New List Item')
        assert.ok(idbDeleteObjectStub.calledWithExactly(LIST_ITEM_TABLE, { id: 34 }), 'Unsync List Item')
        assert.ok(idbUpdateObjectStub.calledWith(LIST_TABLE, list.toObject()))
    })

    it('should throw an exception if wrong profile type is used', async () => {
        await assertThrowsAsync(async () => {
            await storage.saveProfile(USER_ID, {})
        }, 'Error: Wrong Profile type')
    })

    it('should create a profile for the first time', async () => {
        idbGetObjectsByStub.reset()
        idbGetObjectsByStub.withArgs('profile').returns(Promise.resolve([]))
        idbAddObjectStub.reset()

        const profile = new Profile({
            name: 'Christian',
            email: 'christian@test.com',
            lastSyncTime: null,
            userId: USER_ID
        })

        await storage.saveProfile(USER_ID, profile)

        assert.ok(idbAddObjectStub.calledOnceWith('profile', profile.toObject()))
    })

    it('should update a profile', async () => {
        idbGetObjectsByStub.reset()
        idbGetObjectsByStub.withArgs('profile')
            .returns(Promise.resolve([{
                userId: USER_ID
            }]))
        idbUpdateObjectStub.reset()

        const profile = new Profile({
            name: 'Christian',
            email: 'christian@test.com',
            lastSyncTime: null,
            userId: USER_ID
        })

        await storage.saveProfile(USER_ID, profile)

        assert.ok(idbUpdateObjectStub.calledOnceWith('profile', profile.toObject()))
    })

    it('should retrieve a profile', async () => {
        idbGetObjectsByStub.reset()
        idbGetObjectsByStub.returns([{
            userId: USER_ID,
            name: 'Christian'
        }])

        const profile = await storage.getProfile(USER_ID)

        assert.ok(profile instanceof Profile, 'instance of Profile')
        assert.strictEqual(profile.name, 'Christian')
    })

    it('should retrieve an empty profile if one no exists', async () => {
        idbGetObjectsByStub.reset()
        idbGetObjectsByStub.returns(Promise.resolve([]))

        const profile = await storage.getProfile('Non-Existent-User')

        assert.ok(!profile)
    })
})
