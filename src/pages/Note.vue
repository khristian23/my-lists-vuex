<template>
    <q-page class="flex">
        <q-editor
            v-model="content"
            class="full-width editor-height"
            ref="editor"/>
        <TheFooter>
            <q-btn unelevated icon="save" @click="onSave" label="Save" />
        </TheFooter>
    </q-page>
</template>

<script>
import { mapMutations, mapActions } from 'vuex'

export default {
    name: 'notes-editor',
    components: {
        TheFooter: require('components/TheFooter').default
    },
    data () {
        return {
            content: '',
            saveTimeout: 0,
            editor: null
        }
    },
    watch: {
        note: {
            immediate: true,
            handler () {
                this._intializeNote()
            }
        }
    },
    computed: {
        note () {
            const noteId = this.$route.params.id
            return this.$store.getters['lists/getListById'](noteId)
        }
    },
    created () {
        this.$nextTick(() => {
            const contenteditable = this.$refs.editor.$el.querySelector('[contenteditable]')
            contenteditable.addEventListener('input', this.onContentChanged)
        })
    },
    methods: {
        ...mapMutations('app', ['setTitle']),
        ...mapActions('lists', ['saveNoteContent']),

        async _intializeNote () {
            this.$q.loading.show()

            if (this.note) {
                this.content = this.note.noteContent
                this.setTitle(this.note.name)
            }

            this.$q.loading.hide()
        },

        async onSave () {
            try {
                await this.saveNoteContent({ noteId: this.note.id, content: this.content })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },

        async onContentChanged (value) {
            clearTimeout(this.saveTimeout)
            this.saveTimeout = setTimeout(() => {
                this.onSave()
            }, 1000)
        }
    }
}
</script>

<style>
.editor-height>div[contenteditable] {
    min-height: 60% !important;
    height: calc(100vh - 137px);
}

</style>
