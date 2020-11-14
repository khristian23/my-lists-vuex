import firebase from 'firebase'

import 'firebase/auth'
import 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyA2EfzkNysLCoZ9KcUgJ8Rb7HT-j_XWbMk',
    authDomain: 'my-lists-2c9dd.firebaseapp.com',
    databaseURL: 'https://my-lists-2c9dd.firebaseio.com',
    projectId: 'my-lists-2c9dd',
    storageBucket: 'my-lists-2c9dd.appspot.com',
    messagingSenderId: '108046000528',
    appId: '1:108046000528:web:fab76349e86d51ad74d315'
}

// Initialize Firebase
const firebaseApp = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app()
const firebaseAuth = firebaseApp.auth()
const firebaseStore = firebaseApp.firestore()

export { firebaseAuth, firebaseStore }
