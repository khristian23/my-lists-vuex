<template>
    <q-page class="flex">
        <TheList header="Pending" :items="pendingItems" iconAction="done" class="lists"
            @itemPress="onItemPress" @itemAction="setItemToDone" @itemDelete="onItemDelete" v-if="hasPendingItems"
            @orderUpdated="onOrderUpdated" />

        <TheList header="Done" :items="doneItems" iconAction="redo" class="lists"
            @itemPress="onItemPress" @itemAction="setItemToPending" @itemDelete="onItemDelete" v-if="hasDoneItems"
            scratched="true" />

        <TheFooter>
            <q-input v-model="newItem" ref="quick" bg-color="white" outlined rounded placeholder="Quick create" dense class="full-width"
                @focus="showCreateButton = false" @blur="onQuickCreateBlur" @keyup="onQuickCreateKeyup" >
                <template v-slot:after>
                    <q-btn round dense flat @click="onCreate" color="white" icon="add" label="Create" v-if="showCreateButton" />
                </template>
            </q-input>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import ListItem from 'src/storage/ListItem'

const ENTER_KEY = 13

export default {
    name: 'list-items',
    components: {
        TheFooter: require('components/TheFooter').default,
        TheList: require('components/TheList').default
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
            const listId = parseInt(this.$route.params.id, 10)
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

        ...mapActions('lists', ['getListItems', 'setItemToDone', 'setItemToPending', 'updateItemsOrder', 'processDeleteItem', 'saveItem']),

        async _intializeListItems () {
            this.$q.loading.show()

            if (this.list) {
                await this.getListItems(this.list.id)
                this.setTitle(this.list.name)
                this.$q.loading.hide()
            }
        },

        onQuickCreateBlur () {
            if (!this.newItem) {
                this.showCreateButton = true
            }
        },

        onQuickCreateKeyup (event) {
            if (event.keyCode === ENTER_KEY) {
                event.preventDefault()
                this.onTriggerQuickCreate()
                this.newItem = ''
                this.$refs.quick.focus()
            }
        },

        async onTriggerQuickCreate () {
            const listItem = new ListItem({
                name: this.newItem,
                status: this.$Const.itemStatus.pending,
                listId: this.list.id,
                syncStatus: this.$Const.changeStatus.new,
                modifiedAt: new Date().getTime()
            })
            await this.saveItem(listItem)
        },

        onCreate () {
            this.$router.push({ name: this.$Const.routes.listItem, params: { list: this.list.id, id: 'new' } })
        },

        onItemPress (itemId) {
            this.$router.push({ name: this.$Const.routes.listItem, params: { list: this.list.id, id: itemId } })
        },

        async onItemDelete (itemId) {
            await this.processDeleteItem(itemId)
        },

        async onOrderUpdated (listItems) {
            await this.updateItemsOrder({ listId: this.list.id, listItems })
        }
    }
}
</script>