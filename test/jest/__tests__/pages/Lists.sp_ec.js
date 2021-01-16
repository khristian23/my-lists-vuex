/* eslint-disable jest/expect-expect */
import { mountFactory } from '@quasar/quasar-app-extension-testing-unit-jest'
import { localVue } from './routerVueSetup'
// import { shallowMount } from '@vue/test-utils'
// import { localVue, router } from './routerVueSetup'
import dateMocker from './dateMocker'
import ListsPage from 'src/pages/Lists.vue'
import List from 'src/storage/List'
import Storage from 'src/storage/storage'
import Consts from 'src/util/constants'
// import flushPromises from 'flush-promises'
import assert from 'assert'
import sinon from 'sinon'
import Vuex from 'vuex'

const confirmationStub = {
    name: 'confirmation',
    template: '<div />',
    methods: {
        showDialog () {
            return Promise.resolve(true)
        }
    }
}

const factory = mountFactory(ListsPage, {
    mount: {
        localVue,
        store: new Vuex.Store({
            modules: {
                lists: {
                    namespaced: true,
                    getters: {
                        validLists: () => [
                            new List({ id: 100, name: 'List1', firebaseId: 1000 }),
                            new List({ id: 200, name: 'List2' })
                        ]
                    }
                }
            }
        }),
        stubs: { TheConfirmation: confirmationStub }
    }
})

const USER_ID = 'ChristianUserId'

describe('Lists View', () => {
    let wrapper
    let getListsStub
    let saveListsSpy
    let deleteListSpy
    let currentDate

    beforeAll(() => {
        getListsStub = sinon.stub(Storage, 'getLists')
        saveListsSpy = sinon.spy(Storage, 'saveList')
        deleteListSpy = sinon.spy(Storage, 'deleteList')

        dateMocker.mock()
        currentDate = dateMocker.getCurrentDate()
    })

    afterAll(() => {
        getListsStub.restore()
        saveListsSpy.restore()
        deleteListSpy.restore()

        dateMocker.restore()
    })

    beforeEach(() => {
        wrapper = factory()
    })

    it('should physically delete a list not synced', async () => {
        await wrapper.vm.onListDelete(200)

        assert.strictEqual(wrapper.vm.lists.length, 1)
        assert.ok(!wrapper.vm.lists.some(list => list.id === 200, 'List deleted from array'))
        assert.ok(deleteListSpy.calledOnce, 'Delete called')
        assert.ok(saveListsSpy.notCalled, 'Save not called')
        assert.strictEqual(wrapper.emitted().showToast[0][0], 'List deleted')
    })

    it('should logically flag synced list as deleted', async () => {
        deleteListSpy.resetHistory()
        saveListsSpy.resetHistory()

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
