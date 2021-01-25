<template>
    <q-input v-model="newItem" ref="quick" bg-color="white" outlined rounded placeholder="Quick create" dense class="full-width"
        @focus="showCreateButton = false" @blur="onQuickCreateBlur" @keyup="onQuickCreateKeyup" >
        <template v-slot:after>
            <q-btn round dense flat @click="onCreate" color="white" icon="add" label="Create" v-if="showCreateButton" />
        </template>
    </q-input>
</template>

<script>
const ENTER_KEY = 13

export default {
    name: 'quick-create',
    data () {
        return {
            newItem: '',
            showCreateButton: true
        }
    },
    methods: {
        onQuickCreateBlur () {
            if (!this.newItem) {
                this.showCreateButton = true
            }
        },

        onQuickCreateKeyup (event) {
            if (event.keyCode === ENTER_KEY) {
                event.preventDefault()

                this.$emit('quickCreate', this.newItem)

                this.newItem = ''
                this.$refs.quick.focus()
            }
        },

        onCreate () {
            this.$emit('create')
        }
    }
}
</script>

<style>
</style>
