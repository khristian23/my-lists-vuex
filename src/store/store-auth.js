import Firebase from 'firebase'
import { firebaseAuth } from 'boot/firebase'
import Constants from 'src/util/constants'
import Storage from 'src/storage/Firestore/storage-fire'

function createAnonymousUser () {
    return {
        uid: Constants.user.anonymous,
        name: Constants.user.anonymous,
        isAnonymous: true
    }
}

export default {
    namespaced: true,
    state: {
        user: {},
        users: []
    },
    mutations: {
        setUser (state, user) {
            state.user = user
        },

        updatePhotoURL (state, photoURL) {
            state.user.photoURL = photoURL
        },

        setUsers (state, users) {
            state.users = users
        },

        setUserLocation (state, location) {
            state.user.location = location
        }
    },
    actions: {
        async loadUsersList ({ commit }) {
            const users = await Storage.getUsersList()
            commit('setUsers', users)
        },

        async registerUser ({ dispatch }, payload) {
            await firebaseAuth.createUserWithEmailAndPassword(payload.email, payload.password)
            await firebaseAuth.currentUser.updateProfile({
                displayName: payload.name
            })
        },

        async loginUser (state, { email, password }) {
            return firebaseAuth.signInWithEmailAndPassword(email, password)
        },

        listenToFirebaseUserChanges ({ commit, dispatch }) {
            try {
                firebaseAuth.onAuthStateChanged(user => {
                    if (user) {
                        // User was authenticated or is anonymous (isAnonimous = true)
                        // Firebase can pull this info from local IndexedDB is no network found
                        commit('setUser', {
                            name: user.displayName,
                            email: user.email,
                            uid: user.uid,
                            photoURL: user.photoURL,
                            isAnonymous: user.isAnonymous,
                            location: ''
                        })

                        dispatch('onUserLoggedIn')
                    } else {
                        // No network found and no local firebase storage
                        commit('setUser', createAnonymousUser())
                        dispatch('onUserLoggedOut')
                    }
                })
            } catch (error) {
                commit('setUser', createAnonymousUser())
                dispatch('onUserLoggedOut')
            }
        },
        logoutUser () {
            firebaseAuth.signOut()
        },

        async signInWithGoogleRedirect () {
            const provider = new Firebase.auth.GoogleAuthProvider()
            try {
                return Firebase.auth().signInWithRedirect(provider)
            } catch (e) {
                throw new Error(e.message)
            }
        },

        async checkForRedirectAfterAuth () {
            const loginResult = await Firebase.auth().getRedirectResult()
            if (loginResult.user) {
                this.$router.replace({ name: Constants.routes.lists })
            }
        },

        async onUserLoggedIn ({ state, commit }) {
            const photoURL = await Storage.getUserPhotoURLFromStorage(state.user.uid)

            if (!photoURL) {
                await Storage.validateRegisteredUser(state.user)
            } else {
                commit('updatePhotoURL', photoURL)
            }
        },

        async onUserLoggedOut ({ state }) {
            this.$router.replace({ name: Constants.routes.login })
        },

        async updatePhotoProfile ({ state, commit }, photo) {
            const photoURL = await Storage.updatePhotoProfile(state.user.uid, photo)
            commit('updatePhotoURL', photoURL)
        }
    }
}
