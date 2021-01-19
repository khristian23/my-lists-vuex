<template>
    <q-page class="flex">
        <q-form class="full-width q-pa-md">
            <q-input outlined v-model="user.name" label="Name" readonly class="q-mb-md" />
            <q-input outlined v-model="user.email" label="Email" readonly class="q-mb-md" />
        </q-form>
        <TheFooter>
            <q-btn unelevated @click="onLogout">Logout</q-btn>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
    components: {
        TheFooter: require('components/TheFooter').default
    },
    computed: {
        ...mapState('auth', ['user'])
    },
    methods: {
        ...mapActions('auth', ['logoutUser']),

        async onLogout () {
            try {
                await this.logoutUser()
                this.$emit('showToast', 'User Logged out')
                this.$router.replace({ name: this.$Const.routes.login })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        }
    },
    mounted () {
        if (this.user.isAnonymous) {
            this.$router.replace({ name: this.$Const.routes.login })
        }
    }
}
</script>
