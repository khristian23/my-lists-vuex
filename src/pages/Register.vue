<template>
    <q-page>
        <q-form ref="myForm" class="q-pa-md">
            <q-input
                outlined
                lazy-rules
                v-model="formData.name"
                label="Name"
                :rules="[ val => val && val.length > 0 || 'Please enter a name']"
                class="q-mb-sm" />
            <q-input
                outlined
                lazy-rules
                v-model="formData.email"
                label="Email"
                type="email"
                :rules="[ isValidEmail ]"
                class="q-mb-sm" />
            <q-input outlined label="Password" v-model="formData.password" lazy-rules
                :type="protectPassword ? 'password' : 'text'"
                :rules="[ isValidPassword ]"
                class="q-mb-sm">
                <template v-slot:append>
                    <q-icon
                        :name="protectPassword ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="protectPassword = !protectPassword" />
                </template>
            </q-input>
            <q-input outlined label="Confirm Password" v-model="formData.confirmation" lazy-rules
                :type="protectConfirmation ? 'password' : 'text'"
                :rules="[ val => val && val.length > 0 || 'Please confirm password', isEqualToPassword]">
                <template v-slot:append>
                    <q-icon
                        :name="protectConfirmation ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="protectConfirmation = !protectConfirmation" />
                </template>
            </q-input>
        </q-form>
        <TheFooter>
            <q-btn unelevated to="/login">Back to Login</q-btn>
            <q-btn unelevated @click="onRegister">sign Up</q-btn>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapActions } from 'vuex'

export default {
    name: 'register',
    components: {
        TheFooter: require('components/TheFooter').default
    },
    data () {
        return {
            protectPassword: true,
            protectConfirmation: true,
            formData: {
                name: '',
                email: '',
                password: '',
                confirmation: ''
            }
        }
    },
    methods: {
        ...mapActions('auth', ['registerUser']),
        isValidEmail (value) {
            if (!value || value.length === 0) return 'Please enter an email'

            const emailPattern = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/
            return emailPattern.test(value) || 'Invalid email'
        },
        isEqualToPassword (value) {
            return this.formData.password === value || 'Password confirmation does not match'
        },
        isValidPassword (value) {
            if (!value && value.length === 0) return 'Please enter a password'
            return value.length >= 6 || 'Password should be at least 6 characters'
        },
        onLogin () {
            this.$router.replace({ name: 'login' })
        },
        async onRegister () {
            const isValid = await this.$refs.myForm.validate()
            if (!isValid) {
                return
            }

            try {
                await this.registerUser(this.formData)
                this.$emit('showToast', 'User registered')
                this.$router.replace({ name: this.$Const.routes.lists })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        }
    }
}
</script>
