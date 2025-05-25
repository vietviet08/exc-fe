import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, createUserWithRole, checkUserRole, db } from './config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { User } from '../models';

const COLLECTION_NAME = 'users';

// Function to register a new user with a role
export const registerUser = async (email, password, role = 'user') => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the user in Firestore with role
    await createUserWithRole(user.uid, { email, role });
    
    return { success: true, user };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: error.message };
  }
};

// Function to verify if a user has admin privileges
export const verifyAdminAccess = async (user) => {
  if (!user) {
    console.log('No user provided to verifyAdminAccess');
    return false;
  }
  
  console.log(`Verifying admin access for user: ${user.email}`);
  
  try {
    // Check the role in Firestore
    const isAdmin = await checkUserRole(user.uid);
    console.log(`Firestore role check for ${user.email}: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error('Error in verifyAdminAccess:', error);
    return false;
  }
};

/**
 * Get all users
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<User[]>}
 */
export const getAllUsers = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => User.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

/**
 * Get users by role
 * @param {string} role - User role ('user', 'admin', etc.)
 * @returns {Promise<User[]>}
 */
export const getUsersByRole = async (role) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => User.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting users with role ${role}:`, error);
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<User|null>}
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTION_NAME, userId));
    if (!userDoc.exists()) {
      return null;
    }
    return User.fromFirestore(userDoc);
  } catch (error) {
    console.error(`Error getting user with ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Get a user by email
 * @param {string} email - User email
 * @returns {Promise<User|null>}
 */
export const getUserByEmail = async (email) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('email', '==', email),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return User.fromFirestore(querySnapshot.docs[0]);
  } catch (error) {
    console.error(`Error getting user with email ${email}:`, error);
    throw error;
  }
};

/**
 * Create a new user
 * @param {User} userData - User data
 * @returns {Promise<string>} - User ID
 */
export const createUser = async (userData) => {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userData.id);
    await setDoc(userDocRef, userData.toFirestore());
    return userData.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update a user
 * @param {string} userId - User ID
 * @param {User} userData - Updated user data
 */
export const updateUser = async (userId, userData) => {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(userDocRef, userData.toFirestore());
  } catch (error) {
    console.error(`Error updating user with ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete a user
 * @param {string} userId - User ID
 */
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, userId));
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}:`, error);
    throw error;
  }
}; 