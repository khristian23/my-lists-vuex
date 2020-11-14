import Vue from 'vue'
import Vuex from 'vuex'

import lists from './store-lists'
import app from './store-app'
import auth from './store-auth'

Vue.use(Vuex)

export default function () {
    const Store = new Vuex.Store({
        modules: {
            app,
            auth,
            lists
        },

        strict: process.env.DEV
    })

    return Store
}
