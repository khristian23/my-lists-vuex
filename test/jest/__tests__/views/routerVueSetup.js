import { createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ConstantsPlugin from '@/plugins/constants'
import FirebaseUserPlugin from '@/plugins/firebaseUser'
import { strings } from '@/mixins/strings'
import Constants from '@/util/constants'

import Lists from '@/views/Lists.vue'
import List from '@/views/List.vue'
import ListItem from '@/views/ListItem.vue'
import ListItems from '@/views/ListItems.vue'

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(ConstantsPlugin)
localVue.use(FirebaseUserPlugin)
localVue.mixin(strings)

const routes = [
    { path: '/', name: Constants.routes.lists, component: Lists },
    { path: '/list/:id', name: Constants.routes.list, component: List },
    { path: '/list/:list/item/:id', name: Constants.routes.listItem, component: ListItem },
    { path: '/list/:id/items', name: Constants.routes.listItems, component: ListItems }
]

const router = new VueRouter({ 
    routes
 })

export { localVue, router }