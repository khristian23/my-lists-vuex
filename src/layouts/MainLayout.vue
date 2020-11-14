<template>
    <q-layout view="hHh lpR lFf">
        <q-header elevated class="bg-primary">
            <TheHeader @toggle-drawer="leftDrawerOpen = !leftDrawerOpen" />
        </q-header>

        <q-drawer v-model="leftDrawerOpen" side="left" show-if-above bordered content-class="bg-grey-1">
            <q-list>
                <q-item-label header class="text-grey-8">
                    <q-chip>
                        <q-avatar color="blue" text-color="white">{{ initials }}</q-avatar>
                        {{ user.name }}
                    </q-chip>
                </q-item-label>
                <MenuLink v-for="link in menuLinks" :key="link.title" v-bind="link" />
            </q-list>
        </q-drawer>

        <q-page-container>
            <router-view
                @showError="showError"
                @showToast="showToast" />
        </q-page-container>
    </q-layout>
</template>

<script>
import { mapState } from 'vuex'

const linksData = [
    {
        title: 'My Lists',
        caption: '',
        icon: 'list',
        link: '/'
    },
    {
        title: 'Settings',
        caption: '',
        icon: 'settings',
        link: '/settings'
    }
]

export default {
    name: 'MainLayout',
    components: {
        MenuLink: require('components/TheMenuLink.vue').default,
        TheHeader: require('components/TheHeader').default
    },
    data () {
        return {
            leftDrawerOpen: false,
            menuLinks: linksData
        }
    },
    computed: {
        ...mapState('auth', ['user']),
        initials () {
            const name = this.user.name || this.user.email
            if (name) {
                return name.substr(0, 1).toUpperCase()
            }
            return ''
        }
    },
    methods: {
        showError (message) {
            this.$q.notify({
                message: message,
                type: 'negative'
            })
        },
        showToast (message) {
            this.$q.notify({
                message: message,
                color: 'gray'
            })
        }
    }
}
</script>
