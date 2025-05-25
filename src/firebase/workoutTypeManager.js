import { db } from './config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { WorkoutType } from '../models';

const COLLECTION_NAME = 'workoutTypes';

/**
 * Get all workout types
 * @param {boolean} activeOnly - If true, only return active workout types
 * @returns {Promise<WorkoutType[]>}
 */
export const getAllWorkoutTypes = async (activeOnly = false) => {
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
    return querySnapshot.docs.map(doc => WorkoutType.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting workout types:', error);
    throw error;
  }
};

/**
 * Get workout types by category ID
 * @param {string} categoryId - Category ID
 * @param {boolean} activeOnly - If true, only return active workout types
 * @returns {Promise<WorkoutType[]>}
 */
export const getWorkoutTypesByCategory = async (categoryId, activeOnly = false) => {
  try {
    let q;
    if (activeOnly) {
      q = query(collection(db, COLLECTION_NAME), 
        where('categoryId', '==', categoryId),
        where('isActive', '==', true),
        orderBy('order', 'asc'));
    } else {
      q = query(collection(db, COLLECTION_NAME), 
        where('categoryId', '==', categoryId),
        orderBy('order', 'asc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => WorkoutType.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting workout types for category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Get a workout type by ID
 * @param {string} workoutTypeId - Workout type ID
 * @returns {Promise<WorkoutType|null>}
 */
export const getWorkoutTypeById = async (workoutTypeId) => {
  try {
    const workoutTypeDoc = await getDoc(doc(db, COLLECTION_NAME, workoutTypeId));
    if (!workoutTypeDoc.exists()) {
      return null;
    }
    return WorkoutType.fromFirestore(workoutTypeDoc);
  } catch (error) {
    console.error(`Error getting workout type with ID ${workoutTypeId}:`, error);
    throw error;
  }
};

/**
 * Create a new workout type
 * @param {WorkoutType} workoutTypeData - Workout type data
 * @returns {Promise<string>} - New workout type ID
 */
export const createWorkoutType = async (workoutTypeData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), workoutTypeData.toFirestore());
    return docRef.id;
  } catch (error) {
    console.error('Error creating workout type:', error);
    throw error;
  }
};

/**
 * Update a workout type
 * @param {string} workoutTypeId - Workout type ID
 * @param {WorkoutType} workoutTypeData - Updated workout type data
 */
export const updateWorkoutType = async (workoutTypeId, workoutTypeData) => {
  try {
    const workoutTypeDocRef = doc(db, COLLECTION_NAME, workoutTypeId);
    await updateDoc(workoutTypeDocRef, workoutTypeData.toFirestore());
  } catch (error) {
    console.error(`Error updating workout type with ID ${workoutTypeId}:`, error);
    throw error;
  }
};

/**
 * Delete a workout type
 * @param {string} workoutTypeId - Workout type ID
 */
export const deleteWorkoutType = async (workoutTypeId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, workoutTypeId));
  } catch (error) {
    console.error(`Error deleting workout type with ID ${workoutTypeId}:`, error);
    throw error;
  }
};

/**
 * Activate or deactivate a workout type
 * @param {string} workoutTypeId - Workout type ID
 * @param {boolean} isActive - Whether to activate or deactivate the workout type
 */
export const toggleWorkoutTypeActive = async (workoutTypeId, isActive) => {
  try {
    const workoutTypeDocRef = doc(db, COLLECTION_NAME, workoutTypeId);
    await updateDoc(workoutTypeDocRef, { isActive });
  } catch (error) {
    console.error(`Error toggling active state for workout type with ID ${workoutTypeId}:`, error);
    throw error;
  }
}; 