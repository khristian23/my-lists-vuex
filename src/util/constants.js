export default {
    user: {
        anonymous: 'Anonymous'
    },
    listTypes: {
        toDoList: 'todo',
        shoppingCart: 'shop',
        whishlist: 'wish',
        checklist: 'check'
    },
    lists: {
        types: [{
            value: 'todo',
            label: 'To Do List',
            icon: 'list',
            subTypes: [{
                value: 'personal',
                label: 'Personal'
            }, {
                value: 'work',
                label: 'Work'
            }]
        }, {
            value: 'shop',
            label: 'Shopping List',
            icon: 'shopping_cart',
            subTypes: [{
                value: 'groceries',
                label: 'Groceries'
            }, {
                value: 'house',
                label: 'House'
            }]
        }, {
            value: 'wish',
            label: 'Whishlist',
            icon: 'star_rate',
            subTypes: []
        }, {
            value: 'check',
            label: 'Checklist',
            icon: 'library_add_check',
            subTypes: [{
                value: 'personal',
                label: 'Personal'
            }, {
                value: 'work',
                label: 'Work'
            }]
        }]
    },
    itemStatus: {
        done: 'Done',
        pending: 'Pending'
    },
    changeStatus: {
        none: '',
        new: 'N',
        changed: 'C',
        deleted: 'D'
    },
    routes: {
        lists: 'lists',
        list: 'list',
        listItems: 'list-items',
        listItem: 'list-item',
        checklist: 'checklist',
        login: 'login',
        register: 'register',
        profile: 'profile',
        camera: 'profile-picture'
    }
}
