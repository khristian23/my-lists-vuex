<template>
    <q-page class="flex">
        <q-form class="full-width q-pa-md" ref="myForm">
            <q-input outlined v-model="list.name" label="Name" class="q-mb-sm" :rules="[ val => val && val.length > 0 || 'Please enter a name']" />
            <q-input outlined v-model="list.description" label="Description" class="q-mb-md" />
            <q-select outlined v-model="selectedType" :options="$Const.lists.types" class="q-mb-md" @input="onTypeSelection" label="Type">
                <template v-slot:prepend>
                    <q-icon :name="selectedType.icon" />
                </template>
                <template v-slot:option="scope">
                    <q-item
                        v-bind="scope.itemProps"
                        v-on="scope.itemEvents">
                        <q-item-section avatar>
                            <q-icon :name="scope.opt.icon" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label v-html="scope.opt.label" />
                        </q-item-section>
                    </q-item>
                    </template>
            </q-select>
            <q-select outlined v-model="selectedSubType" :options="selectedType.subTypes" v-if="selectedType.subTypes.length" class="q-mb-md" label="Sub Type">
                <template v-slot:prepend>
                    <q-icon :name="selectedType.icon" />
                </template>
            </q-select>
        </q-form>
        <TheFooter>
            <q-btn unelevated icon="save" @click="onSave" label="Save" />
        </TheFooter>
    </q-page>
</template>

<script>
import List from 'src/storage/List'
import { mapMutations, mapActions } from 'vuex'

export default {
    name: 'List',
    data () {
        return {
            list: new List({}),
            selectedType: null,
            selectedSubType: null
        }
    },
    components: {
        TheFooter: require('components/TheFooter').default
    },
    watch: {
        editList: {
            immediate: true,
            handler () {
                this._initializeList()
            }
        },
        'list.name': {
            immediate: true,
            handler () {
                if (this.list.name) {
                    this.setTitle(this.list.name)
                } else if (this.$route.params.id === 'new') {
                    this.setTitle('Create List')
                } else {
                    this.setTitle('Edit List')
                }
            }
        }
    },
    computed: {
        editMode () {
            return this.$route.params.id !== 'new'
        },

        editList () {
            const listId = this.$route.params.id
            return this.$store.getters['lists/getListById'](listId)
        }
    },
    methods: {
        ...mapMutations('app', ['setTitle']),
        ...mapActions('lists', ['saveList']),

        async _initializeList () {
            this.$q.loading.show()

            if (this.editMode && this.editList) {
                this.list = this.editList.clone()

                this.selectedType = this.$Const.lists.types.find(type => this.list.type === type.value)
                this.selectedSubType = this.selectedType.subTypes.find(subtype => this.list.subtype === subtype.value) || []
                this.$q.loading.hide()
            } else {
                this.selectedType = this.$Const.lists.types[0]
                this.selectedSubType = this.selectedType.subTypes[0]
            }

            if (!this.editMode) {
                this.$q.loading.hide()
            }
        },

        onTypeSelection () {
            this.selectedSubType = null
            const subTypes = this.selectedType.subTypes

            if (subTypes.length) {
                this.selectedSubType = subTypes[0]
            } else {
                this.selectedSubType = null
            }
        },

        async onSave () {
            const isValid = await this.$refs.myForm.validate()
            if (!isValid) {
                return
            }

            this.list.type = this.selectedType.value
            this.list.subtype = this.selectedSubType.value

            this.list.modifiedAt = new Date().getTime()
            if (this.list.id) {
                this.list.syncStatus = this.$Const.changeStatus.changed
            } else {
                this.list.syncStatus = this.$Const.changeStatus.new
            }

            try {
                await this.saveList(this.list)
                this.$emit('showToast', 'List saved')
                this.$router.push({ name: this.$Const.routes.lists })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        }
    }
}
</script>
