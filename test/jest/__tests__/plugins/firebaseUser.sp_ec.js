/* eslint-disable jest/expect-expect */
import { mountFactory } from '@quasar/quasar-app-extension-testing-unit-jest'
// import { shallowMount } from '@vue/test-utils'
import { defaultOptions } from '../pages/routerVueSetup'
import sinon from 'sinon'
import assert from 'assert'

import App from 'src/App'
import Firebase from 'firebase'
import Const from 'src/util/constants'

const factory = mountFactory(App, {
    mount: defaultOptions
})

describe('Firebase User Authentication', () => {
    let wrapper

    beforeEach(() => {
        wrapper = factory()
        // wrapper = mountQuasar(App, { localVue })
    })

    it('should recognize firebase user plugin', () => {
        assert.ok(wrapper.vm.$auth)
    })

    it('should hook up firebase authentication on Vue App create', async () => {
        const firebaseAuthSpy = sinon.spy(Firebase, 'auth')

        wrapper.vm.$auth.listenToFirebaseUserChanges()

        assert.ok(firebaseAuthSpy.called)
        firebaseAuthSpy.restore()
    })

    it('should set anonymous user when firebase not confiugred or error', async () => {
        const firebaseAuthStub = sinon.stub(Firebase, 'auth').throws()

        await wrapper.vm.$auth.listenToFirebaseUserChanges()

        const user = wrapper.vm.$auth.user
        assert.ok(user, 'user object set')
        assert.strictEqual(user.uid, Const.user.anonymous, 'Anonymous user set')

        firebaseAuthStub.restore()
    })

    it('should set anonymous user when firebase does not authenticate user or upon user logout', async () => {
        wrapper.vm.$auth.user = { uid: 'Christian' }
        wrapper.vm.$auth.onAuthStateChanged(null)

        const user = wrapper.vm.$auth.user
        assert.ok(user, 'user object set')
        assert.strictEqual(user.uid, Const.user.anonymous, 'Anonymous user set')
    })

    it('should set valid user upon successful authentication', () => {
        wrapper.vm.$auth.user = null
        wrapper.vm.$auth.onAuthStateChanged({ uid: 'Christian' })

        const user = wrapper.vm.$auth.user
        assert.ok(user, 'user object set')
        assert.strictEqual(user.uid, 'Christian', 'User Id set')
    })

    it('should set user to anonymous after logout', async () => {
        wrapper.vm.$auth.user = { uid: 'Christian' }
        await wrapper.vm.$auth.signOut()

        const user = wrapper.vm.$auth.user
        assert.ok(user, 'user object set')
        assert.strictEqual(user.uid, Const.user.anonymous, 'Anonymous user set')
    })
})
