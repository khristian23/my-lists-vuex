import { shallowMount } from '@vue/test-utils'
import { localVue, router } from './routerVueSetup'
import dateMocker from './dateMocker'
import ListsView from '@/views/Lists.vue'
import List from '@/storage/List'
import Storage from '@/storage/storage'
import Consts from '@/util/constants'
import flushPromises from 'flush-promises'
import assert from 'assert'
import sinon from 'sinon'

const USER_ID = 'ChristianUserId'

describe('Lists View', () => {
    let wrapper
    let getListsStub
    let saveListsSpy
    let deleteListSpy
    let currentDate

    before(() => {
        getListsStub = sinon.stub(Storage, 'getLists')
        saveListsSpy = sinon.spy(Storage, 'saveList')
        deleteListSpy = sinon.spy(Storage, 'deleteList')

        dateMocker.mock()
        currentDate = dateMocker.getCurrentDate()
    })

    after(() => {
        getListsStub.restore()
        saveListsSpy.restore()
        deleteListSpy.restore()

        dateMocker.restore()
    })

    beforeEach(() => {
        const confirmationStub = {
            name: 'confirmation',
            template: '<div />',
            methods: {
                showDialog () {
                    return Promise.resolve(true)
                }
            }
        }
        wrapper = shallowMount(ListsView, {
            localVue,
            router,
            stubs: {Confirmation: confirmationStub}
        })
    })

    async function setUserAndWait () {
        await wrapper.setProps({ user: { uid: USER_ID } })
        return flushPromises()
    }

    it('should render lists view', async () => {
        await setUserAndWait()

        assert.strictEqual(wrapper.vm.user.uid, USER_ID)
    })

    it('should physically delete a list not synced', async () => {
        getListsStub.returns([
            new List({ id: 100, name: 'List1', firebaseId: 1000 }),
            new List({ id: 200, name: 'List2' })
        ])

        await setUserAndWait()

        await wrapper.vm.onListDelete(200)

        assert.strictEqual(wrapper.vm.lists.length, 1)
        assert.ok(!wrapper.vm.lists.some(list => list.id === 200, 'List deleted from array'))
        assert.ok(deleteListSpy.calledOnce, 'Delete called')
        assert.ok(saveListsSpy.notCalled, 'Save not called')
        assert.strictEqual(wrapper.emitted().showToast[0][0], 'List deleted')
    })

    it('should logically flag synced list as deleted', async () => {
        getListsStub.returns([
            new List({ id: 100, name: 'List1', firebaseId: 1000 }),
            new List({ id: 200, name: 'List2' })
        ])
        deleteListSpy.resetHistory()
        saveListsSpy.resetHistory()

        await setUserAndWait()

        await wrapper.vm.onListDelete(100)

        assert.strictEqual(wrapper.vm.lists.length, 1)
        assert.ok(!wrapper.vm.lists.some(list => list.id === 100, 'List deleted from array'))
        assert.ok(deleteListSpy.notCalled, 'Delete called')
        assert.ok(saveListsSpy.calledOnce, 'Save called')
        
        const actualListDeleted = saveListsSpy.firstCall.args[1]
        const expectedListDeleted = new List({
            id: 100, 
            name: 'List1', 
            firebaseId: 1000, 
            syncStatus: Consts.changeStatus.deleted,
            modifiedAt: currentDate.getTime(),
            userId: USER_ID
        })
        assert.deepStrictEqual(actualListDeleted.toObject(), expectedListDeleted.toObject())
        assert.strictEqual(wrapper.emitted().showToast[0][0], 'List deleted')      
    })
})