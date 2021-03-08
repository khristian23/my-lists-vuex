<template>
    <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="$emit('toggle-drawer')" :show-if-above="false" />
        <q-btn
            flat dense round
            icon="arrow_back_ios"
            aria-label="Back"
            class="q-ml-sm"
            v-if="showBackButton"
            v-go-back.single />

        <q-toolbar-title class="absolute-center" style="max-width: 60%">
            {{ title }}
        </q-toolbar-title>

        <q-space />

        <q-btn
            v-if="!isLoggedIn"
            to="/login"
            flat dense icon="account_circle"
            no-caps />
        <q-btn
            round dense
            v-if="isLoggedIn"
            to="/profile">
            <q-avatar size="38px">
                <img v-if="user.photoURL" :src="user.photoURL">
                <span v-else>{{ initials }}</span>
            </q-avatar>
        </q-btn>
    </q-toolbar>
</template>

<script>
import Consts from 'src/util/constants'
import { format } from 'quasar'
import { mapState } from 'vuex'

export default {
    props: ['customTitle'],
    computed: {
        ...mapState('auth', ['user']),

        isLoggedIn () {
            return this.user && !this.user.isAnonymous
        },

        initials () {
            if (this.isLoggedIn) {
                const name = this.user.name || this.user.email
                if (name) {
                    return format.capitalize(name.substr(0, 1))
                }
            }
            return ''
        },

        title () {
            let title = this.$store.getters['app/title']

            if (!title) {
                title = this.$route.name.replace(/-/g, ' ')
            }

            return format.capitalize(title)
        },

        showBackButton () {
            return this.$route.name !== Consts.routes.lists
        }
    }
}
</script>

<style>
</style>
