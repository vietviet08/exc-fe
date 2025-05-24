// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJDtddcvZEvnEOcLi02YkVVdkqD2w4gaA",
  authDomain: "exc-app-b1b1a.firebaseapp.com",
  projectId: "exc-app-b1b1a",
  storageBucket: "exc-app-b1b1a.firebasestorage.app",
  messagingSenderId: "1026435770130",
  appId: "1:1026435770130:web:13a564e1a011fabe0275cb",
  measurementId: "G-1RZFGCTHSF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage }; 