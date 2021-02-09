<template>
    <div class="full-width">
        <q-banner inline-actions>
            <div v-if="header" class="text-h6">{{ header }}</div>
            <template v-slot:action v-if="!scratched">
                <q-toggle v-model="prioritize" color="green" label="Prioritize" />
            </template>
            <template v-slot:action v-else>
                <q-btn flat round color="black" :icon="toggleHideIcon" @click="hide=!hide" />
            </template>
        </q-banner>

        <draggable tag="q-list" v-model="localItems" @end="onDrop" v-if="!hide" handle=".handle">
            <q-item v-for="item in localItems" :key="item.id" clickable @click="onItemClick(item.id)">
                <q-item-section>
                    <div class="row">
                        <q-btn flat icon="drag_indicator" class="handle" v-if="prioritize" />
                        <q-btn flat round color="primary" :icon="item.actionIcon || iconAction" size="12px" @click.stop="onItemAction(item.id)" v-else />
                        <div class="column justify-center item-label">
                            <q-item-label :class="classes">{{ item.name }}</q-item-label>
                            <q-item-label :class="classes" caption lines="2" v-if="item.description">{{ item.description }}</q-item-label>
                        </div>
                    </div>
                </q-item-section>

                <q-item-section side>
                    <div class="column">
                        <q-btn flat round color="primary" icon="delete" size="10px" @click.stop="onItemDelete(item.id)" v-if="item.canBeDeleted === undefined || item.canBeDeleted" />
                        <q-item-label v-if="item.numberOfItems !== undefined" class="vertical-middle">{{ item.numberOfItems }} items</q-item-label>
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
            prioritize: false,
            hide: false
        }
    },
    watch: {
        items: {
            immediate: true,
            handler () {
                this.localItems = this.items.map(item => item.toObject ? item.toObject() : Object.assign({}, item))
            }
        }
    },
    computed: {
        itemIcon () {
            return this.iconAction || 'create'
        },
        classes () {
            return this.scratched ? 'scratched' : ''
        },
        toggleHideIcon () {
            return this.hide ? 'expand_less' : 'expand_more'
        }
    },
    methods: {
        getScratchedClass (baseClass) {
            return this.scratched !== undefined ? baseClass + ' scratched' : baseClass
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
