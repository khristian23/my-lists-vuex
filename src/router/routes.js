import Consts from 'src/util/constants'

const routes = [{
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{
        path: '',
        name: Consts.routes.lists,
        component: () => import('pages/Lists.vue')
    }, {
        path: '/list/:id/items',
        name: Consts.routes.listItems,
        component: () => import(/* webpackChunkName: "ListDetails" */ 'pages/ListItems')
    }, {
        path: '/list/:list/item/:id',
        name: Consts.routes.listItem,
        component: () => import(/* webpackChunkName: "ListItem" */ 'pages/ListItem')
    }, {
        path: '/list/:id',
        name: Consts.routes.list,
        component: () => import(/* webpackChunkName: "EditList" */ 'pages/List')
    }, {
        path: '/login',
        name: Consts.routes.login,
        component: () => import(/* webpackChunkName: "Login" */ 'pages/Login')
    }, {
        path: '/register',
        name: Consts.routes.register,
        component: () => import(/* webpackChunkName: "Register" */ 'pages/Register')
    }, {
        path: '/profile',
        name: Consts.routes.profile,
        component: () => import(/* webpackChunkName: "Profile" */ 'pages/Profile')
    }]
},

// Always leave this as last one,
// but you can also remove it
{
    path: '*',
    component: () => import('pages/Error404.vue')
}]

export default routes
