<template>
    <q-page class="flex">
        <q-form class="full-width q-pa-md" ref="myForm">
            <div class="text-h6 q-mb-sm">List Details</div>
            <q-input :disable="disable" outlined v-model="list.name" label="Name" class="q-mb-sm" :rules="[ val => val && val.length > 0 || 'Please enter a name']" />
            <q-input :disable="disable" outlined v-model="list.description" label="Description" class="q-mb-md" />
            <q-select :disable="disable" outlined v-model="selectedType" :options="$Const.lists.types" class="q-mb-md" @input="onTypeSelection" label="Type">
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
            <q-select :disable="disable" outlined v-model="selectedSubType" :options="selectedType.subTypes" v-if="selectedType.subTypes.length" class="q-mb-md" label="Sub Type">
                <template v-slot:prepend>
                    <q-icon :name="selectedType.icon" />
                </template>
            </q-select>

            <div class="text-h6 q-mt-md">Shared With</div>
            <div class="q-pa-md q-mx-auto" style="max-width: 400px">
                <q-list bordered>
                    <q-item v-for="user in shareableUsers" :key="user.id" class="q-mb-sm">
                        <q-item-section avatar>
                            <q-avatar color="primary" text-color="white">
                                <img :src="user.photoURL">
                            </q-avatar>
                        </q-item-section>

                        <q-item-section>
                            <q-item-label>{{ user.name }}</q-item-label>
                            <q-item-label caption lines="1">{{ user.email }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <q-chip color="green" text-color="white" v-if="user.id === list.owner">Owner</q-chip>
                            <q-toggle :disable="disable" color="green" v-model="list.sharedWith" v-else :val="user.id" />
                        </q-item-section>
                    </q-item>
                </q-list>
            </div>
        </q-form>
        <TheFooter>
            <q-btn unelevated icon="save" @click="onSave" label="Save" v-if="!disable" />
        </TheFooter>
    </q-page>
</template>

<script>
import List from 'src/storage/List'
import { mapState, mapMutations, mapActions } from 'vuex'

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
    mounted () {
        this.loadUsersList()
    },
    computed: {
        ...mapState('auth', ['user', 'users']),

        disable () {
            return this.list.isShared
        },

        editMode () {
            return this.$route.params.id !== 'new'
        },

        editList () {
            const listId = this.$route.params.id
            return this.$store.getters['lists/getListById'](listId)
        },

        shareableUsers () {
            return [].concat(this.users)
                .filter(user => user.id !== this.user.uid)
                .map(user => {
                    user.isSharedWith = this.list.sharedWith.includes(user.id)
                    return user
                })
        }
    },
    methods: {
        ...mapMutations('app', ['setTitle']),
        ...mapActions('lists', ['saveList']),
        ...mapActions('auth', ['loadUsersList']),

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
