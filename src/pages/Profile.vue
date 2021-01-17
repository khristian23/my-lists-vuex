<template>
    <q-page class="flex">
        <q-form class="full-width q-pa-md">
            <q-input outlined v-model="user.name" label="Name" readonly class="q-mb-md" />
            <q-input outlined v-model="user.email" label="Email" readonly class="q-mb-md" />
            <q-input outlined v-model="lastSyncTime" label="Last Synchronization Time" readonly class="q-mb-md" />
            <q-toggle v-model="syncOnStartup" icon="sync" label="Synchronize on Login " />
        </q-form>
        <TheFooter>
            <q-btn unelevated @click="onSynchronize">Synchronize</q-btn>
            <q-btn unelevated @click="onLogout">Logout</q-btn>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'

export default {
    components: {
        TheFooter: require('components/TheFooter').default
    },
    computed: {
        ...mapState('auth', ['user', 'profile']),

        syncOnStartup: {
            get () {
                return this.profile.syncOnStartup
            },

            set (value) {
                this.setSyncOnStartup(value)
                this.saveProfile()
            }
        },

        lastSyncTime () {
            return this.profile.lastSyncTime ? new Date(this.profile.lastSyncTime).toLocaleString() : 'Never'
        }
    },
    methods: {
        ...mapActions('auth', ['logoutUser', 'synchronize', 'saveProfile']),
        ...mapMutations('auth', ['setSyncOnStartup']),

        async onLogout () {
            try {
                await this.logoutUser()
                this.$emit('showToast', 'User Logged out')
                this.$router.replace({ name: this.$Const.routes.login })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },

        onSynchronize () {
            // try {
            //     this.synchronize()
            // } catch (e) {
            //     this.$emit('showErrow', e.message)
            // }
        }
    },
    mounted () {
        if (this.user.isAnonymous) {
            this.$router.replace({ name: this.$Const.routes.login })
        }
    }
}
</script>
