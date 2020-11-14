<template>
    <q-dialog v-model="open" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="contact_support" color="primary" style="font-size: 2rem;" />
          <span class="q-ml-sm">{{ message }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="No" color="primary" @click="onNo" v-close-popup></q-btn>
          <q-btn flat label="Yes" color="primary" @click="onYes" v-close-popup></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script>
export default {
    name: 'confirmation-dialog',
    data () {
        return {
            open: false,
            message: ''
        }
    },
    methods: {
        onYes () {
            this.resolveConfirm(true)
        },
        onNo () {
            this.resolveConfirm(false)
        },
        showDialog (message) {
            this.message = message
            return new Promise((resolve) => {
                this.resolveConfirm = resolve
                this.open = true
            })
        }
    }
}
</script>
