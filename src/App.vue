<template>
    <div id="q-app">
        <router-view />
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
    computed: {
        ...mapState('auth', ['user'])
    },
    watch: {
        user () {
            this.loadUserLists(this.user.uid)
        }
    },
    created () {
        this.checkForRedirectAfterAuth()
    },
    mounted () {
        this.listenToFirebaseUserChanges()
    },
    methods: {
        ...mapActions('auth', ['listenToFirebaseUserChanges', 'checkForRedirectAfterAuth']),
        ...mapActions('lists', ['loadUserLists'])
    }
}
</script>
