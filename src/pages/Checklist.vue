<template>
    <q-page class="flex">
        <TheList :items="checklistItems" class="lists"
            @itemPress="onItemPress" @itemAction="onToggleItem" @itemDelete="onItemDelete"
            @orderUpdated="onOrderUpdated" />
        <TheFooter>
            <q-btn unelevated @click="onClearList" label="UnCheck All" />
            <TheQuickCreate @quickCreate="onQuickCreate" @create="onCreate" />
        </TheFooter>
    </q-page>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import ListItem from 'src/storage/ListItem'

export default {
    name: 'checklist',
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
        ...mapGetters('lists', ['allListItems']),

        list () {
            const listId = this.$route.params.id
            return this.$store.getters['lists/getListById'](listId)
        },
        checklistItems () {
            return this.allListItems.map(item => {
                const renderItem = item.toObject()
                const isPending = item.status === this.$Const.itemStatus.pending
                renderItem.actionIcon = isPending ? 'check_box_outline_blank' : 'check_box'
                return renderItem
            })
        }
    },
    methods: {
        ...mapMutations('app', ['setTitle']),

        ...mapGetters('lists', ['getListItemById']),

        ...mapActions('lists', ['getListItems', 'getListItemById', 'setItemToDone', 'setItemToPending', 'updateItemsOrder',
            'deleteItem', 'saveItem', 'setListItemsToPending']),

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
                priority: this.checklistItems.length + 1
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

        async onToggleItem (itemId) {
            try {
                const item = this.checklistItems.find(item => item.id === itemId)

                if (item.status === this.$Const.itemStatus.pending) {
                    await this.setItemToDone(itemId)
                } else {
                    await this.setItemToPending(itemId)
                }
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },

        onClearList () {
            try {
                this.setListItemsToPending(this.list.id)
            } catch (e) {
                this.$emit('showError', e.message)
            }
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
