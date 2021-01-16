import { shallowMount } from '@vue/test-utils'
import { localVue, router } from './routerVueSetup'
import assert from 'assert'
import sinon from 'sinon'

import App from '@/App.vue'
import Const from '@/util/constants'
import Sync from '@/storage/Sync'

describe('Synchronize on Loading App', () => {
    let wrapper
    let synchronizeStub

    before(() => {
        synchronizeStub = sinon.stub(Sync, 'synchronize').returns(true)
    })

    after(() => {
        synchronizeStub.restore()
    })

    beforeEach(() => {
        wrapper = shallowMount(App, { localVue, router })
    })

    it('should get anonymous user on auth error', async () => {
        await wrapper.vm.$auth.onAuthStateChanged(null)

        assert.strictEqual(wrapper.vm.user.uid, Const.user.anonymous)
    })

    it('should get user uid when user is authenticated', async () => {
        await wrapper.vm.$auth.onAuthStateChanged({ uid: 'Christian' })

        assert.strictEqual(wrapper.vm.user.uid, 'Christian')
    })

    it('should synchronize to firebase when not anonymoys user authenticated', async () => {
        synchronizeStub.reset()

        await wrapper.vm.$auth.onAuthStateChanged({ uid: 'LoginUser'})

        assert.ok(synchronizeStub.called)
    })

    it('should not call synchronize when user is not athenticated', async () => {
        synchronizeStub.reset()

        await wrapper.vm.$auth.onAuthStateChanged(null)

        assert.ok(synchronizeStub.notCalled)
    })

    it('should refresh current page if sync finished successfully', async () => {
        const currentRoute = wrapper.vm.$router.currentRoute
        const routerReplaceSpy = sinon.spy(router, 'replace')

        synchronizeStub.returns(Promise.resolve(true))

        await wrapper.vm.triggerSynchronization()

        assert.ok(routerReplaceSpy.calledOnceWith({ name: currentRoute.name, params: currentRoute.params }))

        routerReplaceSpy.restore()
    })

    it('should not refresh page if synchronize did not update entries', async () => {
        const currentRoute = wrapper.vm.$router.currentRoute
        const routerReplaceSpy = sinon.spy(router, 'replace')

        synchronizeStub.returns(Promise.resolve(false))

        await wrapper.vm.triggerSynchronization()

        assert.ok(routerReplaceSpy.notCalled)

        routerReplaceSpy.restore()
    })

    it('should show error toast on synchronization exception', async () => {
        const routerReplaceSpy = sinon.spy(router, 'replace')
        const showToastSpy = sinon.spy(wrapper.vm, 'showToast')

        synchronizeStub.throws()

        await wrapper.vm.triggerSynchronization()

        assert.ok(routerReplaceSpy.notCalled)
        assert.ok(showToastSpy.called)

        routerReplaceSpy.restore()
        showToastSpy.restore()
    })
})