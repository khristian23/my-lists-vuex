/* eslint-disable jest/expect-expect */
import storage from 'src/storage/localStorage/storage-local'
import List from 'src/storage/List'
import ListItem from 'src/storage/ListItem'

const assert = require('assert')

describe('Local Storage', () => {
    beforeAll(() => {
        storage.reset()
    })

    function createListWithId (id) {
        return new List({
            id: id,
            name: 'List' + id
        })
    }

    function createListItemWithId (id) {
        return new ListItem({
            id: id,
            name: 'ListItem' + id
        })
    }

    async function createAndSaveList (userId, listId) {
        return storage.saveList(userId, createListWithId(listId))
    }

    async function createListWithIdAndAssertAllListsCount (userId, id, listCount) {
        await createAndSaveList(userId, id)
        const lists = await storage.getAllLists()
        assert.strictEqual(lists.length, listCount, 'wrong number of lists')
    }

    async function assertListProperties (userId, listId, name) {
        const list = await storage.getList(userId, listId)
        assert.ok(list instanceof List, 'not an instance of List')
        if (listId) {
            assert.ok(Number.isInteger(list.id), 'Id is NaN')
        } else {
            assert.strictEqual(list.id, listId, 'wrong list Id')
        }
        assert.strictEqual(list.name, name, 'wrong list name')
        assert.strictEqual(list.userId, userId, 'User Id is set')
        assert.ok(/^\d+$/.test(list.id), 'List ID created')
    }

    async function assertUserListCount (userId, listCount) {
        const lists = await storage.getLists(userId)
        assert.strictEqual(lists.length, listCount, 'wrong number of lists')
        lists.forEach(list => assert.ok(list instanceof List))
    }

    function assertListItems (newLists, savedLists) {
        assert.strictEqual(newLists.length, savedLists.length, 'wrong number of list items')
        newLists.forEach((newList, index) => {
            const savedList = savedLists[index]
            assert.strictEqual(newList.id, savedList.id, 'wrong item id')
            assert.strictEqual(newList.name, savedList.name, 'wrong item name')
        })
    }

    describe('Initial assessments', () => {
        it('initially retrieves zero lists', async () => {
            const lists = await storage.getAllLists()
            assert.strictEqual(lists.length, 0)
        })
    })

    describe('Specific User Id', () => {
        const userId = 'Christian'

        it('should not retrieve lists for the user', async () => {
            assertUserListCount(userId, 0)
        })

        it('should add a list', async () => {
            createListWithIdAndAssertAllListsCount(userId, 100, 1)
        })

        it('should retrieve the created list', async () => {
            assertListProperties(userId, 100, 'List100')
        })

        it('should create a second list', async () => {
            createListWithIdAndAssertAllListsCount(userId, 200, 2)
        })

        it('should retrieve the second created list', async () => {
            assertListProperties(userId, 200, 'List200')
        })

        it('should update an existent list', async () => {
            const list = await storage.getList(userId, 100)
            list.name = 'new name'
            await storage.saveList(userId, list)
            assertListProperties(userId, 100, 'new name')
        })

        it('should retrieve all lists for the user', async () => {
            assertUserListCount(userId, 2)
        })

        it('should delete a list', async () => {
            await storage.deleteList(userId, 100)
            assertUserListCount(userId, 1)
        })

        it('should throw an error if saving other than List', () => {
            assert.throws(() => { storage.saveList({}) }, /^Error: Wrong list object type$/)
        })

        it('should throw exception if list is not found', () => {
            assert.throws(() => { storage.getList('uid', 123) }, /^Error: List id:123 not found$/)
        })
    })

    describe('A second user', () => {
        const userId = 'AnotherUser'

        it('should add a list for Another User', async () => {
            createListWithIdAndAssertAllListsCount(userId, 300, 2)
        })

        it('should retrieve the created list', async () => {
            await assertListProperties(userId, 300, 'List300')
        })

        it('should create list with ramdom id', async () => {
            createListWithIdAndAssertAllListsCount(userId, undefined, 3)
        })

        it('should retrieve the created list with undefined id', async () => {
            const lists = await storage.getLists(userId)
            lists.forEach(list => assert.ok(Number.isInteger(list.id)))
        })
        it('should retrieve all lists for another user', async () => {
            assertUserListCount(userId, 2)
        })
    })

    describe('List Items', () => {
        const userId = 'listItemUser'

        it('should create a list with no items', async () => {
            createAndSaveList(userId, 400)
            const list = await storage.getList(userId, 400)
            assert.strictEqual(list.listItems.length, 0)
        })

        it('should create a list with items', async () => {
            const newList = createListWithId(500)
            newList.addListItem(createListItemWithId(501))
            await storage.saveList(userId, newList)

            const savedList = await storage.getList(userId, 500)
            assertListItems(newList.listItems, savedList.listItems)
        })

        it('should throw an error if list item type is not instance of ListItem', async () => {
            assert.throws(() => { storage.saveListItem(userId, {}) }, /^Error: Wrong List Item object type$/)
        })

        it('should throw an error if listId is not present on save', async () => {
            assert.throws(() => { storage.saveListItem(userId, new ListItem({})) }, /^Error: List Item must have a listId$/)
        })

        it('should directly save a new list item', async () => {
            const currentListItemCount = storage.getList(userId, 500).listItems.length

            const listItem = new ListItem({
                name: 'Christian List item',
                listId: 500
            })

            await storage.saveListItem(userId, listItem)

            const savedList = await storage.getList(userId, 500)
            const savedListItem = savedList.listItems.filter(item => item.name === listItem.name)[0]
            assert.ok(savedListItem)
            assert.strictEqual(savedListItem.userId, userId, 'User ID is set')
            assert.ok(/^\d+$/.test(savedListItem.id), 'List Item ID is set')
            assert.strictEqual(savedList.listItems.length, currentListItemCount + 1, 'A new item added')
        })

        it('should be able to edit existent list item', async () => {
            const existentList = storage.getList(userId, 500)

            const listItem = new ListItem({
                id: existentList.listItems[0].id,
                name: 'Replaced name',
                listId: existentList.id
            })

            await storage.saveListItem(userId, listItem)

            const savedList = await storage.getList(userId, existentList.id)
            assert.strictEqual(savedList.listItems.length, existentList.listItems.length, 'No added items')
            assert.strictEqual(savedList.listItems[0].name, 'Replaced name', 'name changed')
        })

        it('should direcly save an array of list items', async () => {
            const listItems = [
                new ListItem({ id: 501, name: 'item 1 of array', listId: 500 }),
                new ListItem({ name: 'item 2 of array', listId: 500 }),
                new ListItem({ name: 'item 3 of array', listId: 500 })
            ]

            await storage.saveListItems(userId, listItems)

            const savedList = await storage.getList(userId, 500)
            assert.ok(listItems.every(newItem => savedList.listItems.some(item => item.name === newItem.name)))
        })
    })
})
