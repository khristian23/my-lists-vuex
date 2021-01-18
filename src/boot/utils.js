import Vue from 'vue'

const Utils = {
    getUserInitials (user) {
        const name = user.name || user.email
        if (name) {
            return name.substr(0, 1).toUpperCase()
        }
        return ''
    }
}

Vue.prototype.$Utils = Utils

export default Utils
