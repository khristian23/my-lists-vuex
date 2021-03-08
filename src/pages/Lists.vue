<template>
    <q-page class="flex">
        <TheListLoader v-if="isLoadingLists" />
        <TheList :items="listsToRender" iconAction="edit"
            @itemPress="onListPress" @itemAction="onListEdit" @itemDelete="onListDelete"
            @orderUpdated="onOrderUpdated"
            v-else-if="!isLoadingLists && listsToRender.length" />

        <TheConfirmation ref="confirmation" />

        <TheFooter>
            <q-btn unelevated icon="add" @click="onCreate">Create</q-btn>
        </TheFooter>
    </q-page>
</template>

<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'

export default {
    name: 'lists',
    components: {
        TheList: require('components/TheList').default,
        TheConfirmation: require('components/TheConfirmation').default,
        TheFooter: require('components/TheFooter').default,
        TheListLoader: require('components/TheListLoader').default
    },
    data () {
        return {
            filterBy: ''
        }
    },
    mounted () {
        this.filterBy = this.$route.query.type
    },
    watch: {
        $route () {
            this.filterBy = this.$route.query.type
        },
        filterBy () {
            let title = 'All List'

            if (this.filterBy) {
                title = this.$Const.lists.types.find(({ value }) => value === this.filterBy).label
            }

            this.setTitle(`${title}s`)
        }
    },
    computed: {
        ...mapGetters('lists', ['isLoadingLists', 'validLists', 'getListById']),

        listsToRender () {
            return this.validLists
                .filter(({ type }) => {
                    if (this.filterBy) {
                        return type === this.filterBy
                    }
                    return true
                })
                .map(list => {
                    const renderList = list.toObject()
                    renderList.numberOfItems = list.listItems.filter(item => item.status === this.$Const.itemStatus.pending).length
                    renderList.actionIcon = list.isShared ? 'share' : 'edit'
                    renderList.canBeDeleted = !list.isShared
                    return renderList
                })
        }
    },
    methods: {
        ...mapMutations('app', ['setTitle']),
        ...mapActions('lists', ['saveLists', 'deleteList', 'updateListsOrder']),

        onListPress (listId) {
            const list = this._getListById(listId)
            let routeName = this.$Const.routes.listItems

            if (list.type === this.$Const.listTypes.checklist) {
                routeName = this.$Const.routes.checklist
            }

            this.$router.push({ name: routeName, params: { id: listId } })
        },
        _getListById (listId) {
            return this.validLists.find(list => list.id === listId)
        },
        async onListDelete (listId) {
            const list = this._getListById(listId)
            const message = 'Are you sure to delete list "' + list.name + '"?'
            const confirmationAnswer = await this.$refs.confirmation.showDialog(message)

            if (confirmationAnswer) {
                await this.deleteList(listId)
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
                await this.updateListsOrder(lists)
            } catch (e) {
                this.$emit('showError', e.message)
            }
        }
    }
}
</script>
