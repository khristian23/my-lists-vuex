<template>
    <q-footer bordered class="primary text-white">
        <q-toolbar>
            <div v-if="isSynchronizing">Synchronizing...</div>
            <q-space />
            <slot></slot>
        </q-toolbar>
    </q-footer>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'the-footer',
    computed: {
        ...mapState('app', ['isSynchronizing'])
    }
}
</script>

<style>
</style>
