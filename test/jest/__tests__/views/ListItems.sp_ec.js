import { shallowMount } from '@vue/test-utils'
import { localVue, router } from './routerVueSetup'
import dateMocker from './dateMocker'
import Consts from '@/util/constants'
import assert from 'assert'
import flushPromises from 'flush-promises'
import ListItemsView from '@/views/ListItems'
import sinon from 'sinon'
import storage from '@/storage/storage'
import List from '@/storage/List'
import ListItem from '@/storage/ListItem'

const USER_ID = 'Christian'

describe('List Items View', () => {
    let wrapper
    let quickCreateStub
    let currentDate
    let getListStub
    let saveListStub

    before(() => {
        quickCreateStub = sinon.stub(ListItemsView.methods, 'hookQuickCreateListeners').returns(true)
        getListStub = sinon.stub(storage, 'getList')
        saveListStub = sinon.stub(storage, 'saveList')

        dateMocker.mock()
        currentDate = dateMocker.getCurrentDate()
    })

    after(() => {
        quickCreateStub.restore()
        getListStub.restore()
        saveListStub.restore()
        
        dateMocker.restore()
    })

    beforeEach(() => {
        wrapper = shallowMount(ListItemsView, {
            localVue,
            router
        })
    })

    async function navigateToListAndWait (listId) {
        router.push({ name: Consts.routes.listItems, params: { id: listId } })
        await wrapper.setProps({ user: { uid: USER_ID} })
        await flushPromises()
    }

    function getList () {
        return new List({
            id: 300,
            name: 'Christian List Name',
            listItems: [new ListItem({
                id: 301,
                name: 'A done item',
                status: Consts.itemStatus.done
            }), new ListItem({
                id: 302,
                name: 'A pending item',
                status: Consts.itemStatus.pending
            })]
        })
    }

    function getListItemById (list, listItemId) {
        return list.listItems.filter(item => item.id === listItemId)[0]
    }

    it('should navigate back to Lists view if invalid List Id', async () => {
        getListStub.withArgs(USER_ID, 999).throws()
        const routerReplaceSpy = sinon.spy(router, 'replace')

        await navigateToListAndWait(999)
        
        assert.ok(wrapper.emitted().showError, 'Show error not emitted')
        assert.ok(routerReplaceSpy.calledWith({ name: Consts.routes.lists }))

        routerReplaceSpy.restore()
    })

    it('should show no data message on empty existent list', async () => {
        getListStub.returns(new List({
            name: 'Christian List Name'
        }))
        await navigateToListAndWait(100)

        assert.equal(wrapper.vm.title, 'Christian List Name', 'wrong title')
        assert.equal(wrapper.find('h4').element.textContent, 'No data found')
    })

    it('should populate list of pending items and done items', async () => {
        getListStub.returns(getList())
        await navigateToListAndWait(200)

        assert.ok(!wrapper.find('h4').exists())
        assert.ok(wrapper.vm.hasPendingItems)
        assert.ok(wrapper.vm.hasDoneItems)
        assert.equal(wrapper.vm.pendingItems.length, 1)
        assert.equal(wrapper.vm.doneItems.length, 1)
    })

    it('should be able to logically delete pending items', async () => {
        getListStub.returns(getList())
        saveListStub.reset()

        await navigateToListAndWait(300)

        wrapper.vm.onItemDelete(302)
        await wrapper.vm.$nextTick()

        const expectedList = getList()
        expectedList.modifiedAt = currentDate.getTime()
        expectedList.syncStatus = Consts.changeStatus.changed
        const expectedListItem = getListItemById(expectedList, 302)
        expectedListItem.modifiedAt = currentDate.getTime()
        expectedListItem.syncStatus = Consts.changeStatus.deleted

        assert.equal(wrapper.vm.pendingItems.length, 0, 'More pending items than expected')
        assert.ok(!wrapper.vm.hasPendingItems, 'Has pending items should be false')
        assert.ok(saveListStub.calledOnce, 'Called once')
        
        const calledWith = saveListStub.lastCall.args[1]
        assert.deepEqual(calledWith.toObject(), expectedList.toObject(), 'Called with wrong list')
        expectedList.listItems.forEach((item, index) => {
            assert.deepEqual(calledWith.listItems[index].toObject(), item.toObject(), 'Wrong List Item at ' + index)
        })
    })

    it('should be able to logically delete done item', async () => {
        getListStub.returns(getList())
        saveListStub.reset()

        await navigateToListAndWait(310)

        wrapper.vm.onItemDelete(301)
        await wrapper.vm.$nextTick()

        const expectedList = getList()
        expectedList.modifiedAt = currentDate.getTime()
        expectedList.syncStatus = Consts.changeStatus.changed
        const expectedListItem = getListItemById(expectedList, 301)
        expectedListItem.modifiedAt = currentDate.getTime()
        expectedListItem.syncStatus = Consts.changeStatus.deleted

        assert.equal(wrapper.vm.doneItems.length, 0, 'More done items than expected')
        assert.ok(!wrapper.vm.hasDoneItems, 'Has done items should be false')
        assert.ok(saveListStub.calledOnce, 'Called once')

        const calledWith = saveListStub.lastCall.args[1]
        assert.deepEqual(calledWith.toObject(), expectedList.toObject(), 'Called with wrong list')
        expectedList.listItems.forEach((item, index) => {
            assert.deepEqual(calledWith.listItems[index].toObject(), item.toObject(), 'Wrong List Item at ' + index)
        })
    })

    it('should be able to set pending item to done', async () => {
        getListStub.returns(getList())
        saveListStub.reset()

        await navigateToListAndWait(320)

        wrapper.vm.onItemDone(302)
        await wrapper.vm.$nextTick()

        const expectedList = getList()
        expectedList.modifiedAt = currentDate.getTime()
        expectedList.syncStatus = Consts.changeStatus.changed
        const expectedListItem = getListItemById(expectedList, 302)
        expectedListItem.modifiedAt = currentDate.getTime()
        expectedListItem.status = Consts.itemStatus.done
        expectedListItem.syncStatus = Consts.changeStatus.changed

        assert.equal(wrapper.vm.pendingItems.length, 0, 'More pending items than expected')
        assert.equal(wrapper.vm.doneItems.length, 2, 'More done items than expected')
        assert.ok(wrapper.vm.hasDoneItems, 'Has done items should be true')
        assert.ok(!wrapper.vm.hasPendingItems, 'Has pending items should be false')
        assert.ok(saveListStub.calledOnce, 'Called once')
        const calledWith = saveListStub.lastCall.args[1]
        assert.deepEqual(calledWith.toObject(), expectedList.toObject(), 'Called with wrong list')
        expectedList.listItems.forEach((item, index) => {
            assert.deepEqual(calledWith.listItems[index].toObject(), item.toObject(), 'Wrong List Item at ' + index)
        })
    })

    it('should be able to set done item to undone', async () => {
        getListStub.returns(getList())
        saveListStub.reset()

        await navigateToListAndWait(330)

        wrapper.vm.onItemUndone(301)
        await wrapper.vm.$nextTick()

        const expectedList = getList()
        expectedList.modifiedAt = currentDate.getTime()
        expectedList.syncStatus = Consts.changeStatus.changed
        const expectedListItem = getListItemById(expectedList, 301)
        expectedListItem.modifiedAt = currentDate.getTime()
        expectedListItem.status = Consts.itemStatus.pending
        expectedListItem.syncStatus = Consts.changeStatus.changed

        assert.equal(wrapper.vm.pendingItems.length, 2, 'More pending items than expected')
        assert.equal(wrapper.vm.doneItems.length, 0, 'More done items than expected')
        assert.ok(!wrapper.vm.hasDoneItems, 'Has done items should be true')
        assert.ok(wrapper.vm.hasPendingItems, 'Has pending items should be false')
        assert.ok(saveListStub.calledOnce, 'Called once')
        const calledWith = saveListStub.lastCall.args[1]
        assert.deepEqual(calledWith.toObject(), expectedList.toObject(), 'Called with wrong list')
        expectedList.listItems.forEach((item, index) => {
            assert.deepEqual(calledWith.listItems[index].toObject(), item.toObject(), 'Wrong List Item at ' + index)
        })
    })

    it('should be able to quick create a list item', async () => {
        getListStub.returns(getList())
        saveListStub.reset()

        await navigateToListAndWait(340)

        wrapper.vm.onTriggerQuickCreate('Quick create item')
        await wrapper.vm.$nextTick()

        const expectedList = getList()
        expectedList.modifiedAt = currentDate.getTime()
        expectedList.syncStatus = Consts.changeStatus.changed
        expectedList.listItems.push(new ListItem({
            name: 'Quick create item',
            status: Consts.itemStatus.pending,
            listId: 340,
            modifiedAt: currentDate.getTime(),
            syncStatus: Consts.changeStatus.new
        }))

        assert.equal(wrapper.vm.pendingItems.length, 2, 'More pending items than expected')
        assert.equal(wrapper.vm.doneItems.length, 1, 'More done items than expected')
        assert.ok(wrapper.vm.hasDoneItems, 'Has done items should be true')
        assert.ok(wrapper.vm.hasPendingItems, 'Has pending items should be false')
        assert.ok(saveListStub.calledOnce, 'Called once')
        const calledWith = saveListStub.lastCall.args[1]
        assert.deepEqual(calledWith.toObject(), expectedList.toObject(), 'Called with wrong list')
        expectedList.listItems.forEach((item, index) => {
            assert.deepEqual(calledWith.listItems[index].toObject(), item.toObject(), 'Wrong List Item at ' + index)
        })
    })

    it('should be able to reorder the items', async () => {     
        getListStub.returns(getList())                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
        saveListStub.reset()

        await navigateToListAndWait(350)

        const orderedListItems = getList().listItems.reverse()
        orderedListItems.forEach((item, index) => {
            item.priority = index + 1
            item.status = Consts.itemStatus.pending
        })

        wrapper.vm.onOrderUpdated(orderedListItems)
        await wrapper.vm.$nextTick()

        const expectedList = getList()
        expectedList.modifiedAt = currentDate.getTime()
        expectedList.syncStatus = Consts.changeStatus.changed
        expectedList.listItems = orderedListItems.map(item => new ListItem(item))
        expectedList.listItems.forEach(item => {
            item.syncStatus = Consts.changeStatus.changed
            item.modifiedAt = currentDate.getTime()
        })

        assert.ok(saveListStub.calledOnce, 'Called once')
        const calledWith = saveListStub.lastCall.args[1]
        assert.deepEqual(calledWith.toObject(), expectedList.toObject(), 'Called with wrong list')
        expectedList.listItems.forEach((item, index) => {
            assert.deepEqual(calledWith.listItems[index].toObject(), item.toObject(), 'Wrong List Item at ' + index)
        })
    })
})