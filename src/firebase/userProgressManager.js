import { db } from './config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { UserProgress } from '../models';

const COLLECTION_NAME = 'userProgress';

/**
 * Get all user progress entries
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<UserProgress[]>}
 */
export const getAllUserProgress = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('completionDate', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => UserProgress.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting user progress entries:', error);
    throw error;
  }
};

/**
 * Get user progress entries by user ID
 * @param {string} userId - User ID
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<UserProgress[]>}
 */
export const getUserProgressByUser = async (userId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('completionDate', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => UserProgress.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting progress entries for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get user progress entries by level ID
 * @param {string} levelId - Level ID
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<UserProgress[]>}
 */
export const getUserProgressByLevel = async (levelId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('levelId', '==', levelId),
      orderBy('completionDate', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => UserProgress.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting progress entries for level ${levelId}:`, error);
    throw error;
  }
};

/**
 * Get user progress entries by exercise ID
 * @param {string} exerciseId - Exercise ID
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<UserProgress[]>}
 */
export const getUserProgressByExercise = async (exerciseId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('exerciseId', '==', exerciseId),
      orderBy('completionDate', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => UserProgress.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting progress entries for exercise ${exerciseId}:`, error);
    throw error;
  }
};

/**
 * Get a user progress entry by ID
 * @param {string} progressId - User progress ID
 * @returns {Promise<UserProgress|null>}
 */
export const getUserProgressById = async (progressId) => {
  try {
    const progressDoc = await getDoc(doc(db, COLLECTION_NAME, progressId));
    if (!progressDoc.exists()) {
      return null;
    }
    return UserProgress.fromFirestore(progressDoc);
  } catch (error) {
    console.error(`Error getting user progress with ID ${progressId}:`, error);
    throw error;
  }
};

/**
 * Create a new user progress entry
 * @param {UserProgress} progressData - User progress data
 * @returns {Promise<string>} - New user progress ID
 */
export const createUserProgress = async (progressData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), progressData.toFirestore());
    return docRef.id;
  } catch (error) {
    console.error('Error creating user progress entry:', error);
    throw error;
  }
};

/**
 * Update a user progress entry
 * @param {string} progressId - User progress ID
 * @param {UserProgress} progressData - Updated user progress data
 */
export const updateUserProgress = async (progressId, progressData) => {
  try {
    const progressDocRef = doc(db, COLLECTION_NAME, progressId);
    await updateDoc(progressDocRef, progressData.toFirestore());
  } catch (error) {
    console.error(`Error updating user progress with ID ${progressId}:`, error);
    throw error;
  }
};

/**
 * Delete a user progress entry
 * @param {string} progressId - User progress ID
 */
export const deleteUserProgress = async (progressId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, progressId));
  } catch (error) {
    console.error(`Error deleting user progress with ID ${progressId}:`, error);
    throw error;
  }
}; 