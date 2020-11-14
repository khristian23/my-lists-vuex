export default {
    namespaced: true,
    state: {
        title: '',
        isSynchronizing: false
    },
    getters: {
        title: state => state.title
    },
    mutations: {
        setTitle (state, title) {
            state.title = title
        },

        isSynchronizing (state, value) {
            state.isSynchronizing = value
        }
    }
}
