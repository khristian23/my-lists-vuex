import { createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import * as All from 'quasar'
import Constants from 'src/util/constants'

import Lists from 'src/pages/Lists.vue'
import List from 'src/pages/List.vue'
import ListItem from 'src/pages/ListItem.vue'
import ListItems from 'src/pages/ListItems.vue'

const { Quasar } = All

const components = Object.keys(All).reduce((object, key) => {
    const val = All[key]
    if (val && val.component && val.component.name != null) {
        object[key] = val
    }
    return object
}, {})

const localVue = createLocalVue()
localVue.use(Quasar, { components })
localVue.use(Vuex)
localVue.use(VueRouter)

const routes = [
    { path: '/', name: Constants.routes.lists, component: Lists },
    { path: '/list/:id', name: Constants.routes.list, component: List },
    { path: '/list/:list/item/:id', name: Constants.routes.listItem, component: ListItem },
    { path: '/list/:id/items', name: Constants.routes.listItems, component: ListItems }
]

const router = new VueRouter({
    routes
})

import auth from 'src/store/store-auth.js'
import lists from 'src/store/store-lists.js'
import app from 'src/store/store-app.js'

const defaultOptions = {
    localVue,
    store: new Vuex.Store({
        modules: {
            app,
            auth,
            lists
        }
    })
}

export { localVue, router, defaultOptions }
