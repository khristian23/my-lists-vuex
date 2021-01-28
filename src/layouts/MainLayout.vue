<template>
    <q-layout view="hHh lpR lFf">
        <q-header elevated class="bg-primary">
            <TheHeader @toggle-drawer="leftDrawerOpen = !leftDrawerOpen" />
        </q-header>

        <q-drawer v-model="leftDrawerOpen" side="left" show-if-above bordered content-class="bg-grey-1">
            <q-list>
                <q-item-label header class="text-grey-8">
                    <q-chip clickable @click="onUserNameClicked">
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
        title: 'All Lists',
        caption: '',
        icon: 'select_all',
        link: '/'
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
            leftDrawerOpen: false
        }
    },
    computed: {
        ...mapState('auth', ['user']),

        initials () {
            return this.$Utils.getUserInitials(this.user)
        },

        menuLinks () {
            const filters = this.$Const.lists.types.map(type => {
                return {
                    title: type.label,
                    icon: type.icon,
                    link: `/?type=${type.value}`
                }
            })
            return linksData.concat(filters)
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
        },

        onUserNameClicked () {
            this.$router.push({ name: 'profile' })
        }
    }
}
</script>
