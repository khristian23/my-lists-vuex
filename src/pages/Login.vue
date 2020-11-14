<template>
    <q-page class="flex">
        <q-card class="full-width q-pa-md">
            <q-tabs
                v-model="tab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
            >
                <q-tab name="email" label="Email" />
                <q-tab name="google" label="Google" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="email">
                    <q-form @submit="onLogin">
                        <q-input
                            outlined
                            v-model="formData.email"
                            type="email"
                            label="Email"
                            lazy-rules
                            :rules="[ val => val && val.length > 0 || 'Please enter an email']"
                        />
                        <q-input
                            outlined
                            v-model="formData.password"
                            :type="protectPassword ? 'password' : 'text'"
                            label="Password"
                            lazy-rules
                            :rules="[ val => val && val.length > 0 || 'Please enter password']">
                            <template v-slot:append>
                                <q-icon
                                    :name="protectPassword ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer"
                                    @click="protectPassword = !protectPassword" />
                            </template>
                        </q-input>
                        <div class="row">
                            <q-space />
                            <q-btn elevated color="primary" type="submit">Login</q-btn>
                        </div>
                    </q-form>
                </q-tab-panel>

                <q-tab-panel name="google">
                    <div class="fixed-center">
                        <a @click="onGoogle" style="cursor: pointer">
                            <q-img src="~assets/google.png" style="height: 180px; width: 180px" />
                        </a>
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </q-card>
        <TheFooter>
            <q-btn unelevated to="/register">Register</q-btn>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapActions } from 'vuex'

export default {
    name: 'login',
    components: {
        TheFooter: require('components/TheFooter').default
    },
    data () {
        return {
            tab: 'email',
            protectPassword: true,
            formData: {
                email: '',
                password: ''
            }
        }
    },
    methods: {
        ...mapActions('auth', ['loginUser', 'signInWithGoogleRedirect', 'checkForRedirectAfterAuth']),
        async onLogin () {
            try {
                await this.loginUser(this.formData)
                this.$emit('showToast', 'User logged in')
                this.$router.replace({ name: this.$Const.routes.lists })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },
        async onGoogle () {
            try {
                await this.signInWithGoogleRedirect()
                this.checkForRedirectAfterAuth()
            } catch (e) {
                this.error = e.message
            }
        }
    }
}
</script>

<style>
</style>
