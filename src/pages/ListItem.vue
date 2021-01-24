<template>
    <q-page class="flex">
        <q-form ref="myForm" class="full-width q-pa-md">
            <q-input outlined v-model="listItem.name" label="Name" :rules="[ val => val && val.length > 0 || 'Please enter a name']" @keydown.enter.prevent="" />
            <q-select outlined v-model="listItem.status" :options="statusList" label="Status" :readonly="!editMode" :emit-value="true" class="q-pb-md" />
            <q-input outlined v-model="listItem.notes" label="Notes" type="textarea" class="q-pb-md" />
        </q-form>
        <TheFooter>
            <q-btn unelevated icon="save" @click="onSave" label="Save" />
        </TheFooter>
    </q-page>
</template>

<script>
import { mapMutations, mapActions } from 'vuex'
import ListItem from 'src/storage/ListItem'

export default {
    name: 'list-item',
    data () {
        return {
            listItem: new ListItem({
                status: this.$Const.itemStatus.pending
            })
        }
    },
    components: {
        TheFooter: require('components/TheFooter').default
    },
    watch: {
        editList: {
            immediate: true,
            handler () {
                this.initializeView()
            }
        },
        'listItem.name': {
            immediate: true,
            handler () {
                if (this.listItem.name) {
                    this.setTitle(this.listItem.name)
                } else if (this.$route.params.id === 'new') {
                    this.setTitle('Create List Item')
                } else {
                    this.setTitle('Edit List Item')
                }
            }
        }
    },
    computed: {
        statusList () {
            return Object.keys(this.$Const.itemStatus).map(key => {
                return {
                    value: this.$Const.itemStatus[key],
                    label: this.$Const.itemStatus[key]
                }
            })
        },

        listId () {
            return this.$route.params.list
        },

        editMode () {
            return this.$route.params.id !== 'new'
        },

        editList () {
            const listId = this.$route.params.list
            return this.$store.getters['lists/getListById'](listId)
        }
    },
    async mounted () {
        await this.getListItems(this.listId)
    },
    methods: {
        ...mapMutations('app', ['setTitle']),
        ...mapActions('lists', ['getListItems', 'saveItem']),

        async initializeView () {
            this.$q.loading.show()

            if (this.editMode && this.editList) {
                this.list = this.editList.clone()
                this._loadExistentItem()
                this.$q.loading.hide()
            }

            if (!this.editMode) {
                this.$q.loading.hide()
            }
        },
        async _loadExistentItem () {
            const listItemId = this.$route.params.id
            const editListItem = this.editList.listItems.find(item => item.id === listItemId)

            if (editListItem) {
                this.listItem = editListItem.clone()
            } else {
                this.$emit('showError', `List Item Id ${listItemId} not found`)
                this.$router.replace({
                    name: this.$Const.routes.listItem,
                    params: { list: this.listId, id: 'new' }
                })
            }
        },
        async onSave () {
            if (!this.$refs.myForm.validate()) {
                return
            }

            if (!this.editMode) {
                this.listItem.listId = this.listId
            }

            await this.saveItem(this.listItem)
            this.$emit('showToast', 'List Item saved')
            this.$router.replace({ name: this.$Const.routes.listItems, params: { id: this.editList.id } })
        }
    }
}
</script>

<style>
</style>
