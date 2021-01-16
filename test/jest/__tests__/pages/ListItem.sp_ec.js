import { shallowMount } from '@vue/test-utils'
import { localVue, router } from './routerVueSetup'
import dateMocker from './dateMocker'
import ListItemView from '@/views/ListItem'
import Consts from '@/util/constants'
import assert from 'assert'
import sinon from 'sinon'
import flushPromises from 'flush-promises'
import storage from '@/storage/storage'
import List from '@/storage/List'
import ListItem from '@/storage/ListItem'

const USER_ID = 'Christian'

describe('List Item View', () => {
    let wrapper
    let getListStub
    let saveListStub
    let validateStub
    let routerReplaceSpy
    let currentDate

    before(() => {
        getListStub = sinon.stub(storage, 'getList')
        saveListStub = sinon.stub(storage, 'saveList').returns(true)
        validateStub = sinon.stub(ListItemView.methods, 'validate').returns(true)
        routerReplaceSpy = sinon.spy(router, 'replace')

        dateMocker.mock()
        currentDate = dateMocker.getCurrentDate()
    })

    after(() => {
        getListStub.restore()
        saveListStub.restore()
        validateStub.restore()
        routerReplaceSpy.restore()

        dateMocker.restore()
    })

    beforeEach(() => {
        wrapper = shallowMount(ListItemView, {
            localVue,
            router
        })
    })

    async function navigateToListItemAndWait (listId, listItemId) {
        router.push({ name: Consts.routes.listItem, params: { list: listId, id: listItemId } })
        await wrapper.setProps({ user: { uid: USER_ID} })
        return flushPromises()
    }

    it('should throw an exception when no List is found', async () => {
        getListStub.withArgs(USER_ID, 456).throws()
        routerReplaceSpy.resetHistory()

        await navigateToListItemAndWait(456, 'new')

        assert.ok(wrapper.emitted().showError, 'Show error not emitted')
        assert.ok(routerReplaceSpy.calledOnceWith({ name: Consts.routes.lists }), 'navigate to lists')
    })

    it('should be able to create a new item', async () => {
        getListStub.resetHistory()
        await navigateToListItemAndWait(100, 'new')

        assert.strictEqual(wrapper.vm.itemId, null, 'initial item id')
        assert.strictEqual(wrapper.vm.listId, 100, 'get list id from router')
        assert.strictEqual(wrapper.vm.item, null, 'initial list object')
        assert.strictEqual(wrapper.vm.name, '', 'Initial name field')
        assert.strictEqual(wrapper.vm.title, 'New Item', 'Title set')

        assert.ok(getListStub.calledWith(USER_ID, 100))
    })

    it('should be able to read existent item', async () => {
        getListStub.withArgs(USER_ID, 321)
            .returns(new List({
                listItems: [new ListItem({
                    id: 123,
                    name: 'My List Item name'
                })]
            }))
        await navigateToListItemAndWait(321, 123)

        assert.strictEqual(wrapper.vm.name, 'My List Item name')
        assert.strictEqual(wrapper.vm.listId, 321)
        assert.strictEqual(wrapper.vm.itemId, 123)
        assert.ok(!!wrapper.vm.list)
        assert.ok(!!wrapper.vm.item)
    })

    it('should intent create new item when lits item id not found', async () => {
        routerReplaceSpy.resetHistory()
        getListStub.withArgs(USER_ID, 987).returns(new List({
            listItems: []
        }))

        await navigateToListItemAndWait(987, 999)

        assert.ok(routerReplaceSpy.calledWith({ name: Consts.routes.listItem, params: {list: 987, id: 'new'}}))
        assert.strictEqual(wrapper.vm.itemId, null, 'initial item id')
        assert.strictEqual(wrapper.vm.listId, 987, 'get list id from router')
        assert.strictEqual(wrapper.vm.item, null, 'initial list object')
    })

    it('should save a new List Item', async () => {
        saveListStub.reset()

        getListStub.withArgs(USER_ID, 654).returns(new List({
            id: 654,
            listItems: [ new ListItem({ id: 123, name: 'Existent List Item' }) ]
        }))
        await navigateToListItemAndWait(654, 'new')
        
        wrapper.vm.name = 'New Item Name'
        wrapper.vm.onSave()

        assert.ok(saveListStub.calledOnce, 'SaveList called once')
        
        const list = saveListStub.firstCall.lastArg
        assert.ok(list instanceof List, 'It is of type List')
        assert.strictEqual(list.id, 654, 'List Id set')
        assert.strictEqual(list.syncStatus, Consts.changeStatus.changed, 'List flagged as changed')
        assert.strictEqual(list.modifiedAt, currentDate.getTime(), 'List flagged as item modified')

        const addedListItem = list.listItems[1]
        assert.strictEqual(addedListItem.id, null, 'List item Id is null')
        assert.strictEqual(addedListItem.name, 'New Item Name', 'Name is set')
        assert.strictEqual(addedListItem.listId, 654, 'List Id is set at item level')
        assert.strictEqual(addedListItem.syncStatus, Consts.changeStatus.new, 'List item as new')
        assert.strictEqual(addedListItem.modifiedAt, currentDate.getTime(), 'Modification date')

        assert.ok(wrapper.emitted().showToast, 'Show Toast not emitted')
        assert.ok(routerReplaceSpy.calledWith({ name: Consts.routes.listItems, params: { id: 654 }}))
    })

    it('should update existent List Item', async () => {
        saveListStub.reset()

        getListStub.withArgs(USER_ID, 159).returns(new List({
            id: 159,
            listItems: [ new ListItem({ id: 123, name: 'Existent List Item' }) ]
        }))
        await navigateToListItemAndWait(159, 123)
        
        wrapper.vm.name = 'Updated Item Name'
        wrapper.vm.onSave()

        assert.ok(saveListStub.calledOnce, 'SaveList called once')
        
        const list = saveListStub.firstCall.lastArg
        assert.ok(list instanceof List, 'It is of type List')
        assert.strictEqual(list.id, 159, 'List Id set')
        assert.strictEqual(list.syncStatus, Consts.changeStatus.changed, 'List flagged as changed')
        assert.strictEqual(list.modifiedAt, currentDate.getTime(), 'List flagged as item modified')

        const addedListItem = list.listItems[0]
        assert.strictEqual(addedListItem.id, 123, 'List item Id is null')
        assert.strictEqual(addedListItem.name, 'Updated Item Name', 'Name is set')
        assert.strictEqual(addedListItem.listId, 159, 'List Id is set at item level')
        assert.strictEqual(addedListItem.syncStatus, Consts.changeStatus.changed, 'List item as new')
        assert.strictEqual(addedListItem.modifiedAt, currentDate.getTime(), 'Modification date')

        assert.ok(wrapper.emitted().showToast, 'Show Toast not emitted')
        assert.ok(routerReplaceSpy.calledWith({ name: Consts.routes.listItems, params: { id: 159 }}))
    })
})