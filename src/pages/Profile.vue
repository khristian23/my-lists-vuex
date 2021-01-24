<template>
    <q-page class="flex">
        <q-form class="full-width q-pa-md">
            <q-input outlined v-model="user.name" label="Name" readonly class="q-mb-md" />
            <q-input outlined v-model="user.email" label="Email" readonly class="q-mb-md" />
            <q-input outlined v-model="user.location" label="Location" class="q-mb-md" :loading="loadingLocation">
                <template v-slot:append>
                    <q-btn round dense flat icon="near_me" @click="getLocation()" v-if="!loadingLocation && isLocationSupported" />
                </template>
            </q-input>
        </q-form>
        <TheFooter>
            <q-btn unelevated :to="$Const.routes.camera">Change Picture</q-btn>
            <q-btn unelevated @click="onLogout">Logout</q-btn>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'

export default {
    data () {
        return {
            loadingLocation: false
        }
    },
    components: {
        TheFooter: require('components/TheFooter').default
    },
    computed: {
        ...mapState('auth', ['user']),

        isLocationSupported () {
            return ('geolocation' in navigator)
        }
    },
    methods: {
        ...mapMutations('auth', ['setUserLocation']),
        ...mapActions('auth', ['logoutUser']),

        async onLogout () {
            try {
                await this.logoutUser()
                this.$emit('showToast', 'User Logged out')
                this.$router.replace({ name: this.$Const.routes.login })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },

        getLocation () {
            navigator.geolocation.getCurrentPosition(position => {
                this.getCityAndCountryFromPosition(position)
            }, error => {
                this.$emit('showError', error.message)
            }, { timeout: 5000 })
        },

        async getCityAndCountryFromPosition (position) {
            const apiUrl = `https://geocode.xyz/${position.coords.latitude},${position.coords.longitude}?json=1`

            try {
                this.loadingLocation = true

                const response = await fetch(apiUrl)
                const data = await response.json()

                let location = data.city
                if (data.country) {
                    location += `, ${data.country}`
                }

                this.setUserLocation(location)
            } catch (e) {
                this.$emit('showError', e.message)
            } finally {
                this.loadingLocation = false
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
