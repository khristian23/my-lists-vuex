<template>
    <q-page class="flex">
        <TheList header="Pending" :items="pendingItems" iconAction="done" class="lists"
            @itemPress="onItemPress" @itemAction="setItemToDone" @itemDelete="onItemDelete" v-if="hasPendingItems"
            @orderUpdated="onOrderUpdated" />
        <TheList header="Done" :items="doneItems" iconAction="redo" class="lists self-end"
            @itemPress="onItemPress" @itemAction="setItemToPending" @itemDelete="onItemDelete" v-if="hasDoneItems"
            scratched="true" />
        <TheFooter>
            <TheQuickCreate @quickCreate="onQuickCreate" @create="onCreate" />
        </TheFooter>
    </q-page>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import ListItem from 'src/storage/ListItem'

export default {
    name: 'list-items',
    components: {
        TheFooter: require('components/TheFooter').default,
        TheList: require('components/TheList').default,
        TheQuickCreate: require('components/TheQuickItemCreate').default
    },
    data () {
        return {
            newItem: '',
            showCreateButton: true
        }
    },
    watch: {
        list: {
            immediate: true,
            handler () {
                this._intializeListItems()
            }
        }
    },
    computed: {
        ...mapGetters('lists', ['pendingItems', 'doneItems']),

        list () {
            const listId = this.$route.params.id
            return this.$store.getters['lists/getListById'](listId)
        },

        noItems () {
            return !(this.hasPendingItems || this.hasDoneItems)
        },
        hasPendingItems () {
            return !!this.pendingItems.length
        },
        hasDoneItems () {
            return !!this.doneItems.length
        }
    },
    methods: {
        ...mapMutations('app', ['setTitle']),

        ...mapActions('lists', ['getListItems', 'setItemToDone', 'setItemToPending', 'updateItemsOrder', 'deleteItem', 'saveItem']),

        async _intializeListItems () {
            this.$q.loading.show()

            if (this.list) {
                await this.getListItems(this.list.id)
                this.setTitle(this.list.name)
                this.$q.loading.hide()
            }
        },

        async onQuickCreate (name) {
            const listItem = new ListItem({
                name: name,
                status: this.$Const.itemStatus.pending,
                listId: this.list.id,
                priority: this.pendingItems.length + 1
            })
            try {
                await this.saveItem(listItem)
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },

        onCreate () {
            this.$router.push({ name: this.$Const.routes.listItem, params: { list: this.list.id, id: 'new' } })
        },

        onItemPress (itemId) {
            this.$router.push({ name: this.$Const.routes.listItem, params: { list: this.list.id, id: itemId } })
        },

        async onItemDelete (itemId) {
            try {
                await this.deleteItem({ listId: this.list.id, itemId })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },

        async onOrderUpdated (listItems) {
            try {
                await this.updateItemsOrder({ listId: this.list.id, listItems })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        }
    }
}
</script>
