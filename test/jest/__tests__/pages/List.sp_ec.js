import { shallowMount } from '@vue/test-utils'
import { localVue, router } from './routerVueSetup'
import dateMocker from './dateMocker'
import Consts from '@/util/constants'
import assert from 'assert'
import flushPromises from 'flush-promises'
import List from '@/views/List.vue'
import ListClass from '@/storage/List'
import sinon from 'sinon'
import storage from '@/storage/storage'

describe('List View', () => {
    let wrapper
    let getListStub
    let currentDate

    before(() => {
        dateMocker.mock()
        currentDate = dateMocker.getCurrentDate()

        getListStub = sinon.stub(storage, 'getList').returns(Promise.resolve(new ListClass({
            name: 'Christian',
            description: 'List description',
            type: 'shop',
            subtype: 'groceries',
            firebaseId: 'ABC-DEF-111-000'
        })))
    })

    after(() => {
        getListStub.restore()
        dateMocker.restore()
    })

    beforeEach(() => {
        wrapper = shallowMount(List, {
            localVue,
            router
        })
    })

    it('should populate an initial set of values on new Lists', async () => {
        router.push({ name: 'list', params: { id: 'new' } })
        await wrapper.setProps({ user: { uid: 'Christian'} })

        await flushPromises()
        assert.strictEqual(wrapper.vm.listId, null)
        assert.strictEqual(wrapper.vm.name, '')
        assert.strictEqual(wrapper.vm.description, '') 
        assert.strictEqual(wrapper.vm.type, Consts.lists.types[0].id)
        assert.strictEqual(wrapper.vm.subtype, Consts.lists.types[0].subTypes[0].id)
        assert.strictEqual(wrapper.vm.title, 'Create List')
    })

    it('should be able to populate list values of existent list', async () => {
        assert.ok(wrapper.vm.$route instanceof Object)
        await wrapper.setProps({ user: { uid: 'Christian'} })

        router.push({ name: 'list', params: { id: 200 } })

        await flushPromises()
        assert.strictEqual(wrapper.vm.listId, 200)
        assert.strictEqual(wrapper.vm.name, 'Christian')
        assert.strictEqual(wrapper.vm.description, 'List description')
        assert.strictEqual(wrapper.vm.type, 'shop')
        assert.strictEqual(wrapper.vm.subtype, 'groceries')
        assert.strictEqual(wrapper.vm.title, 'Christian')
    })

    it('should change the subtype based on type changes', () => {
        Consts.lists.types.forEach(type => {
            wrapper.vm.type = type.id
            wrapper.vm.onTypeSelection()
            if (type.subTypes.length) {
                assert.strictEqual(wrapper.vm.subtype, type.subTypes[0].id)
            } else {
                assert.strictEqual(wrapper.vm.subtype, null)
            }
        })
    })

    it('should emit save list event with proper list values', async () => {
        const validate = sinon.stub(wrapper.vm, 'validate').returns(true)

        router.push({ name: 'list', params: { id: '400' } })
        await wrapper.setProps({ user: { uid: 'Christian'} })

        await flushPromises()

        wrapper.vm.name = 'Christian List Name'
        wrapper.vm.type = 'wish'
        wrapper.vm.subtype = null

        wrapper.vm.onSave()

        const listToSave = wrapper.emitted('saveList')[0][0]
        assert.ok(listToSave instanceof ListClass, 'Wrong object type')
        assert.strictEqual(listToSave.name, 'Christian List Name', 'Set new name')
        assert.strictEqual(listToSave.description, 'List description', 'Retain description')
        assert.strictEqual(listToSave.type, 'wish', 'Set new type')
        assert.strictEqual(listToSave.subtype, null, 'Set new subtype')
        assert.strictEqual(listToSave.modifiedAt, currentDate.getTime(), 'Sets modification time')
        assert.strictEqual(listToSave.syncStatus, Consts.changeStatus.changed, 'Sets changed flag')
        assert.strictEqual(listToSave.firebaseId, 'ABC-DEF-111-000', 'Retains firebase Id')
    })

    it('should try to retrieve the right list', async () => {
        router.push({ name: 'list', params: { id: 300 } })

        await wrapper.setProps({ user: { uid: 'ChristianUser' } })
        await flushPromises()

        assert.ok(getListStub.lastCall.calledWith('ChristianUser', 300))
    })

})