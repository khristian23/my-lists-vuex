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

            <q-banner bordered inline-actions rounded class="bg-primary text-white q-ma-sm" v-if="showAppInstallBanner">
                <b>Install?</b>
                <template v-slot:action>
                    <q-btn flat color="white" class="q-px-sm" label="Yes" dense @click="installApp" />
                    <q-btn flat color="white" class="q-px-sm" label="Later" dense @click="showAppInstallBanner = false" />
                    <q-btn flat color="white" class="q-px-sm" label="Never" dense @click="neverShowAppInstallBanner" />
                </template>
            </q-banner>
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

let deferredPrompt

export default {
    name: 'MainLayout',
    components: {
        MenuLink: require('components/TheMenuLink.vue').default,
        TheHeader: require('components/TheHeader').default
    },
    data () {
        return {
            leftDrawerOpen: false,
            showAppInstallBanner: false
        }
    },
    mounted () {
        const neverShowAppInstallBanner = this.$q.localStorage.getItem('neverShowAppInstallBanner')

        if (!neverShowAppInstallBanner) {
            this.hookupBeforePWAInstallEvent()
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
        hookupBeforePWAInstallEvent () {
            window.addEventListener('beforeinstallprompt', e => {
                // Prevent the mini-infobar from appearing on mobile
                e.preventDefault()
                // Stash the event so it can be triggered later
                deferredPrompt = e
                // Update UI notify the user they can install the PWA
                this.showAppInstallBanner = true
            })
        },
        async installApp () {
            this.showAppInstallBanner = false
            // Show the install prompt
            deferredPrompt.prompt()
            // Wait for the user to respond to the prompt
            const choiceResult = await deferredPrompt.userChoice
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt')
                this.neverShowAppInstallBanner()
            } else {
                console.log('User dismissed the install prompt')
            }
        },
        neverShowAppInstallBanner () {
            this.showAppInstallBanner = false

            this.$q.localStorage.set('neverShowAppInstallBanner', true)
        },
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
