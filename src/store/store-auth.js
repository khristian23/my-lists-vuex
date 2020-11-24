import Firebase from 'firebase'
import { firebaseAuth } from 'boot/firebase'
import Constants from 'src/util/constants'
import Sync from 'src/storage/Sync'
import Storage from 'src/storage/IndexedDB/storage-idb'
import Profile from 'src/storage/Profile'

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
        profile: {}
    },
    mutations: {
        setUser (state, user) {
            state.user = user
        },

        setProfile (state, profile) {
            state.profile = profile
        },

        setLastSyncTime (state, lastSyncTime) {
            state.profile.lastSyncTime = lastSyncTime
        },

        setSyncOnStartup (state, syncOnStartup) {
            state.profile.syncOnStartup = syncOnStartup
        }
    },
    actions: {
        async registerUser (state, payload) {
            await firebaseAuth.createUserWithEmailAndPassword(payload.email, payload.password)
            firebaseAuth.currentUser.updateProfile({
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
                            isAnonymous: false
                        })

                        dispatch('onUserLoggedIn')
                    } else {
                        // No network found and no local firebase storage
                        commit('setUser', createAnonymousUser())
                    }
                })
            } catch (error) {
                commit('setUser', createAnonymousUser())
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

        async createProfile ({ state, dispatch }) {
            const profile = new Profile({
                userId: state.user.uid,
                name: state.user.name,
                email: state.user.email,
                syncOnStartup: true,
                lastSyncTime: 0
            })

            dispatch('saveProfile')
            return profile
        },

        async saveProfile ({ state }) {
            await Storage.saveProfile(state.user.uid, state.profile)
        },

        async onUserLoggedIn ({ state, commit, dispatch }) {
            let profile = await Storage.getProfile(state.user.uid)
            if (!profile) {
                profile = await dispatch('createProfile')
            }
            commit('setProfile', profile)

            if (profile.syncOnStartup) {
                dispatch('synchronize')
            }
        },

        setSyncOnStartup ({ state, commit }, syncOnStartup) {
            commit('setSyncOnStartup', syncOnStartup)
        },

        async synchronize ({ state, commit }) {
            commit('app/isSynchronizing', true, { root: true })
            if (!state.user.isAnonymous) {
                const lastSyncTime = await Sync.synchronize(state.user)
                if (lastSyncTime) {
                    commit('setLastSyncTime', lastSyncTime)
                }
            }
            commit('app/isSynchronizing', false, { root: true })
        }
    }
}
