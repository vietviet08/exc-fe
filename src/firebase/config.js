// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
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


console.log("Firebase configuration loaded:", { 
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Check if a user with the specified email exists in Firestore
const checkUserByEmail = async (email) => {
  try {
    console.log(`Checking if user exists with email: ${email}`);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking user by email ${email}:`, error);
    return false;
  }
};

// Check if any admin user exists
const checkIfAdminExists = async () => {
  try {
    console.log('Checking if any admin users exist');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("role", "==", "admin"));
    const querySnapshot = await getDocs(q);
    
    const adminExists = !querySnapshot.empty;
    console.log(`Admin user exists: ${adminExists}`);
    return adminExists;
  } catch (error) {
    console.error('Error checking if admin exists:', error);
    return false;
  }
};

// Function to check if a user is an admin
const checkUserRole = async (userId) => {
  if (!userId) {
    console.error('No userId provided to checkUserRole');
    return false;
  }

  try {
    console.log(`Checking user role for userId: ${userId}`);
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`User document found for ${userId}:`, userData);
      const isAdmin = userData.role === 'admin';
      console.log(`User ${userId} is admin: ${isAdmin}`);
      return isAdmin;
    } else {
      console.log(`No user document found for userId: ${userId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking user role for ${userId}:`, error);
    return false;
  }
};

// Function to create a user with role in Firestore
const createUserWithRole = async (userId, userData) => {
  if (!userId) {
    console.error('No userId provided to createUserWithRole');
    return false;
  }

  try {
    console.log(`Creating user role for userId: ${userId}`, userData);
    
    const userDocRef = doc(db, 'users', userId);
    
    // Create user document with role
    await setDoc(userDocRef, {
      email: userData.email,
      role: userData.role || 'user',
      createdAt: new Date().toISOString()
    });
    
    console.log(`Successfully created user document for ${userId} with role: ${userData.role}`);
    return true;
  } catch (error) {
    console.error(`Error creating user with role for ${userId}:`, error);
    return false;
  }
};

export { auth, db, storage, checkUserRole, createUserWithRole, checkUserByEmail, checkIfAdminExists }; 