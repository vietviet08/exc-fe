import { db } from './config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { Exercise } from '../models';

const COLLECTION_NAME = 'exercises';

/**
 * Get all exercises
 * @param {boolean} activeOnly - If true, only return active exercises
 * @returns {Promise<Exercise[]>}
 */
export const getAllExercises = async (activeOnly = false) => {
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
    return querySnapshot.docs.map(doc => Exercise.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting exercises:', error);
    throw error;
  }
};

/**
 * Get exercises by level ID
 * @param {string} levelId - Level ID
 * @param {boolean} activeOnly - If true, only return active exercises
 * @returns {Promise<Exercise[]>}
 */
export const getExercisesByLevel = async (levelId, activeOnly = false) => {
  try {
    let q;
    if (activeOnly) {
      q = query(collection(db, COLLECTION_NAME), 
        where('levelId', '==', levelId),
        where('isActive', '==', true),
        orderBy('order', 'asc'));
    } else {
      q = query(collection(db, COLLECTION_NAME), 
        where('levelId', '==', levelId),
        orderBy('order', 'asc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => Exercise.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting exercises for level ${levelId}:`, error);
    throw error;
  }
};

/**
 * Get exercises by muscle group
 * @param {string} muscleGroup - Muscle group name
 * @param {boolean} activeOnly - If true, only return active exercises
 * @returns {Promise<Exercise[]>}
 */
export const getExercisesByMuscleGroup = async (muscleGroup, activeOnly = false) => {
  try {
    let q;
    if (activeOnly) {
      q = query(collection(db, COLLECTION_NAME), 
        where('muscleGroups', 'array-contains', muscleGroup),
        where('isActive', '==', true),
        orderBy('order', 'asc'));
    } else {
      q = query(collection(db, COLLECTION_NAME), 
        where('muscleGroups', 'array-contains', muscleGroup),
        orderBy('order', 'asc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => Exercise.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting exercises for muscle group ${muscleGroup}:`, error);
    throw error;
  }
};

/**
 * Get an exercise by ID
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<Exercise|null>}
 */
export const getExerciseById = async (exerciseId) => {
  try {
    const exerciseDoc = await getDoc(doc(db, COLLECTION_NAME, exerciseId));
    if (!exerciseDoc.exists()) {
      return null;
    }
    return Exercise.fromFirestore(exerciseDoc);
  } catch (error) {
    console.error(`Error getting exercise with ID ${exerciseId}:`, error);
    throw error;
  }
};

/**
 * Create a new exercise
 * @param {Exercise} exerciseData - Exercise data
 * @returns {Promise<string>} - New exercise ID
 */
export const createExercise = async (exerciseData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), exerciseData.toFirestore());
    return docRef.id;
  } catch (error) {
    console.error('Error creating exercise:', error);
    throw error;
  }
};

/**
 * Update an exercise
 * @param {string} exerciseId - Exercise ID
 * @param {Exercise} exerciseData - Updated exercise data
 */
export const updateExercise = async (exerciseId, exerciseData) => {
  try {
    const exerciseDocRef = doc(db, COLLECTION_NAME, exerciseId);
    await updateDoc(exerciseDocRef, exerciseData.toFirestore());
  } catch (error) {
    console.error(`Error updating exercise with ID ${exerciseId}:`, error);
    throw error;
  }
};

/**
 * Delete an exercise
 * @param {string} exerciseId - Exercise ID
 */
export const deleteExercise = async (exerciseId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, exerciseId));
  } catch (error) {
    console.error(`Error deleting exercise with ID ${exerciseId}:`, error);
    throw error;
  }
};

/**
 * Activate or deactivate an exercise
 * @param {string} exerciseId - Exercise ID
 * @param {boolean} isActive - Whether to activate or deactivate the exercise
 */
export const toggleExerciseActive = async (exerciseId, isActive) => {
  try {
    const exerciseDocRef = doc(db, COLLECTION_NAME, exerciseId);
    await updateDoc(exerciseDocRef, { isActive });
  } catch (error) {
    console.error(`Error toggling active state for exercise with ID ${exerciseId}:`, error);
    throw error;
  }
}; 