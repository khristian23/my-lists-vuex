<template>
    <q-page class="flex">
        <TheList :items="validLists" iconAction="edit"
            @itemPress="onListPress" @itemAction="onListEdit" @itemDelete="onListDelete"
            @orderUpdated="onOrderUpdated" />

        <TheConfirmation ref="confirmation" />

        <TheFooter>
            <q-btn unelevated icon="add" @click="onCreate">Create</q-btn>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
    components: {
        TheList: require('components/TheList').default,
        TheConfirmation: require('components/TheConfirmation').default,
        TheFooter: require('components/TheFooter').default
    },
    computed: {
        ...mapGetters('lists', ['validLists'])
    },
    methods: {
        ...mapActions('lists', ['getLists', 'saveList', 'saveLists', 'processDeleteList']),
        onListPress (listId) {
            this.$router.push({ name: this.$Const.routes.listItems, params: { id: listId } })
        },
        _getListById (listId) {
            return this.validLists.find(list => list.id === listId)
        },
        async onListDelete (listId) {
            const list = this._getListById(listId)
            const message = 'Are you sure to delete list "' + list.name + '"?'
            const confirmationAnswer = await this.$refs.confirmation.showDialog(message)

            if (confirmationAnswer) {
                await this.processDeleteList(listId)
                this.$emit('showToast', 'List deleted')
            }
        },
        onListEdit (listId) {
            this.$router.push({ name: this.$Const.routes.list, params: { id: listId } })
        },
        onCreate () {
            this.$router.push({ name: this.$Const.routes.list, params: { id: 'new' } })
        },
        async onOrderUpdated (lists) {
            try {
                await this.saveLists(lists)
            } catch (e) {
                this.$emit('showError', 'Error trying to save list priorities')
            }
        }
    }
}
</script>