<template>
    <q-page class="flex align-center">
        <q-form class="full-width q-pa-md camera-form">
            <div class="camera-frame q-pa-md">
                <video ref="video" class="full-width" autoplay v-show="!imageCaptured" />
                <canvas ref="canvas" class="full-width" height="240" v-show="imageCaptured" />
            </div>
            <div class="text-center q-pa-md">
                <q-btn icon="photo_camera" color="primary" size="lg" round unelevated @click="captureImage" v-show="!imageCaptured" v-if="hasCameraSupport" />
                <q-btn icon="replay" color="primary" size="lg" round unelevated @click="imageCaptured = false" v-show="imageCaptured" v-if="hasCameraSupport" />

                <q-file v-if="!hasCameraSupport" outlined v-model="imageUpload" label="Choose an image" accept="image/*" @input="onImageSelected">
                    <template v-slot:prepend>
                        <q-icon name="attach_file" />
                    </template>
                </q-file>
            </div>
        </q-form>
        <TheFooter>
            <q-btn unelevated @click="onSave" icon="save" label="Save" />
        </TheFooter>
    </q-page>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { uid } from 'quasar'

export default {
    name: 'picture-profile',
    components: {
        TheFooter: require('components/TheFooter').default
    },
    data () {
        return {
            post: {
                id: uid(),
                photo: null,
                date: Date.now()
            },
            imageCaptured: false,
            imageUpload: [],
            hasCameraSupport: true
        }
    },
    computed: {
        ...mapState('auth', ['user'])
    },
    methods: {
        ...mapActions('auth', ['updatePhotoProfile']),

        async initCamera () {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: true
                })
                this.$refs.video.srcObject = stream
            } catch (e) {
                this.hasCameraSupport = false
            }
        },

        captureImage () {
            const video = this.$refs.video
            const canvas = this.$refs.canvas

            canvas.width = video.getBoundingClientRect().width
            canvas.height = video.getBoundingClientRect().height

            const context = canvas.getContext('2d')
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            this.imageCaptured = true
        },

        async onSave () {
            if (!this.imageCaptured) {
                this.$emit('showError', 'Please take a picture before saving')
                return
            }

            try {
                this.post.photo = this.dataURItoBlob(this.$refs.canvas.toDataURL())
                await this.updatePhotoProfile(this.post.photo)

                this.$emit('showToast', 'Photo Profile updated')
                this.$router.replace({ name: this.$Const.routes.profile })
            } catch (e) {
                this.$emit('showError', e.message)
            }
        },

        dataURItoBlob (dataURI) {
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
            var byteString = atob(dataURI.split(',')[1])

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

            // write the bytes of the string to an ArrayBuffer
            var ab = new ArrayBuffer(byteString.length)

            // create a view into the buffer
            var ia = new Uint8Array(ab)

            // set the bytes of the buffer to the correct values
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
            }

            // write the ArrayBuffer to a blob, and you're done
            var blob = new Blob([ab], { type: mimeString })
            return blob
        },

        onImageSelected (file) {
            const canvas = this.$refs.canvas
            const context = canvas.getContext('2d')

            this.post.photo = file

            const reader = new FileReader()
            reader.onload = event => {
                const img = new Image()
                img.onload = () => {
                    canvas.width = img.width
                    canvas.height = img.height
                    context.drawImage(img, 0, 0)
                    this.imageCaptured = true
                }
                img.src = event.target.result
            }
            reader.readAsDataURL(file)
        },

        async disableCamera () {
            const stream = this.$refs.video.srcObject

            stream.getTracks().forEach(track => track.stop())

            this.$refs.video.srcObject = null
        }
    },
    mounted () {
        if (this.user.isAnonymous) {
            this.$router.replace({ name: this.$Const.routes.login })
        }

        this.initCamera()
    },

    beforeDestroy () {
        if (this.hasCameraSupport) {
            this.disableCamera()
        }
    }
}
</script>

<style lang="scss">
    .align-center {
        justify-content: center;
    }

    .camera-form {
        max-width: 500px;
        margin: 0 auto;
    }

    .camera-frame {
        border: 2px solid $primary;
        border-radius: 10px;
    }
</style>
