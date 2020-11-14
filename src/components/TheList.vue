<template>
    <div class="full-width">
        <q-banner inline-actions>
            <div v-if="header" class="text-h6">{{ header }}</div>
            <template v-slot:action v-if="!scratched">
                <q-toggle v-model="prioritize" color="green" label="Prioritize" />
            </template>
        </q-banner>

        <draggable tag="q-list" v-model="localItems" @end="onDrop" handle=".handle">
            <q-item v-for="item in localItems" :key="item.id" clickable v-ripple @click="onItemClick(item.id)">
                <q-item-section>
                    <div class="row">
                        <q-btn flat icon="drag_indicator" class="handle" v-if="prioritize" />
                        <q-btn flat round color="primary" :icon="itemIcon" v-else size="12px" @click.stop="onItemAction(item.id)" />
                        <div class="column justify-center item-label">
                            <q-item-label :class="classes">{{ item.name }}</q-item-label>
                            <q-item-label :class="classes" caption lines="2" v-if="item.description">{{ item.description }}</q-item-label>
                        </div>
                    </div>
                </q-item-section>

                <q-item-section side top>
                    <div class="column">
                        <q-btn flat round color="primary" icon="delete" size="10px" @click.stop="onItemDelete(item.id)" />
                        <q-item-label v-if="item.listItems">{{ getItemsCount(item.listItems) }} items</q-item-label>
                    </div>
                </q-item-section>
            </q-item>
        </draggable>
    </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
    name: 'the-list',
    props: ['header', 'items', 'iconAction', 'scratched'],
    components: {
        draggable
    },
    data () {
        return {
            localItems: [],
            prioritize: false
        }
    },
    watch: {
        items: {
            immediate: true,
            handler () {
                this.localItems = this.items.map(item => item.clone())
            }
        }
    },
    computed: {
        itemIcon () {
            return this.iconAction || 'create'
        },
        classes () {
            return this.scratched ? 'scratched' : ''
        }
    },
    methods: {
        getScratchedClass (baseClass) {
            return this.scratched !== undefined ? baseClass + ' scratched' : baseClass
        },
        getItemsCount (listItems) {
            return listItems.filter(item => item.status === this.$Const.itemStatus.pending && item.syncStatus !== this.$Const.changeStatus.deleted).length
        },
        onDrop () {
            this.localItems.forEach((item, index) => {
                item.priority = index + 1
            })
            this.$emit('orderUpdated', this.localItems)
        },
        onItemAction (id) {
            this.$emit('itemAction', id)
        },
        onItemClick (id) {
            this.$emit('itemPress', id)
        },
        onItemDelete (id) {
            this.$emit('itemDelete', id)
        }
    }
}
</script>

<style>
    .scratched {
        text-decoration: line-through;
    }

    .item-label {
        max-width: 85%;
    }
</style>
