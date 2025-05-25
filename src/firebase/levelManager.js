import { db } from './config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { Level } from '../models';

const COLLECTION_NAME = 'levels';

/**
 * Get all levels
 * @param {boolean} activeOnly - If true, only return active levels
 * @returns {Promise<Level[]>}
 */
export const getAllLevels = async (activeOnly = false) => {
  try {
    let q;
    if (activeOnly) {
      q = query(collection(db, COLLECTION_NAME), 
        where('isActive', '==', true),
        orderBy('order', 'asc'));
    } else {
      q = query(collection(db, COLLECTION_NAME), 
        orderBy('order', 'asc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => Level.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting levels:', error);
    throw error;
  }
};

/**
 * Get levels by workout type ID
 * @param {string} workoutTypeId - Workout Type ID
 * @param {boolean} activeOnly - If true, only return active levels
 * @returns {Promise<Level[]>}
 */
export const getLevelsByWorkoutType = async (workoutTypeId, activeOnly = false) => {
  try {
    let q;
    if (activeOnly) {
      q = query(collection(db, COLLECTION_NAME), 
        where('workoutTypeId', '==', workoutTypeId),
        where('isActive', '==', true),
        orderBy('order', 'asc'));
    } else {
      q = query(collection(db, COLLECTION_NAME), 
        where('workoutTypeId', '==', workoutTypeId),
        orderBy('order', 'asc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => Level.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting levels for workout type ${workoutTypeId}:`, error);
    throw error;
  }
};

/**
 * Get a level by ID
 * @param {string} levelId - Level ID
 * @returns {Promise<Level|null>}
 */
export const getLevelById = async (levelId) => {
  try {
    const levelDoc = await getDoc(doc(db, COLLECTION_NAME, levelId));
    if (!levelDoc.exists()) {
      return null;
    }
    return Level.fromFirestore(levelDoc);
  } catch (error) {
    console.error(`Error getting level with ID ${levelId}:`, error);
    throw error;
  }
};

/**
 * Create a new level
 * @param {Level} levelData - Level data
 * @returns {Promise<string>} - New level ID
 */
export const createLevel = async (levelData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), levelData.toFirestore());
    return docRef.id;
  } catch (error) {
    console.error('Error creating level:', error);
    throw error;
  }
};

/**
 * Update a level
 * @param {string} levelId - Level ID
 * @param {Level} levelData - Updated level data
 */
export const updateLevel = async (levelId, levelData) => {
  try {
    const levelDocRef = doc(db, COLLECTION_NAME, levelId);
    await updateDoc(levelDocRef, levelData.toFirestore());
  } catch (error) {
    console.error(`Error updating level with ID ${levelId}:`, error);
    throw error;
  }
};

/**
 * Delete a level
 * @param {string} levelId - Level ID
 */
export const deleteLevel = async (levelId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, levelId));
  } catch (error) {
    console.error(`Error deleting level with ID ${levelId}:`, error);
    throw error;
  }
};

/**
 * Activate or deactivate a level
 * @param {string} levelId - Level ID
 * @param {boolean} isActive - Whether to activate or deactivate the level
 */
export const toggleLevelActive = async (levelId, isActive) => {
  try {
    const levelDocRef = doc(db, COLLECTION_NAME, levelId);
    await updateDoc(levelDocRef, { isActive });
  } catch (error) {
    console.error(`Error toggling active state for level with ID ${levelId}:`, error);
    throw error;
  }
}; 