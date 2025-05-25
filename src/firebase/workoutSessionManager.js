import { db } from './config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { WorkoutSession } from '../models';

const COLLECTION_NAME = 'workoutSessions';

/**
 * Get all workout sessions
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<WorkoutSession[]>}
 */
export const getAllWorkoutSessions = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => WorkoutSession.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting workout sessions:', error);
    throw error;
  }
};

/**
 * Get workout sessions by user ID
 * @param {string} userId - User ID
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<WorkoutSession[]>}
 */
export const getWorkoutSessionsByUser = async (userId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => WorkoutSession.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting workout sessions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get workout sessions by level ID
 * @param {string} levelId - Level ID
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<WorkoutSession[]>}
 */
export const getWorkoutSessionsByLevel = async (levelId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('levelId', '==', levelId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => WorkoutSession.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting workout sessions for level ${levelId}:`, error);
    throw error;
  }
};

/**
 * Get workout sessions by status
 * @param {string} status - Status ('pending', 'in_progress', 'completed', 'cancelled')
 * @param {number} limitCount - Limit the number of results
 * @returns {Promise<WorkoutSession[]>}
 */
export const getWorkoutSessionsByStatus = async (status, limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => WorkoutSession.fromFirestore(doc));
  } catch (error) {
    console.error(`Error getting workout sessions with status ${status}:`, error);
    throw error;
  }
};

/**
 * Get a workout session by ID
 * @param {string} sessionId - Workout session ID
 * @returns {Promise<WorkoutSession|null>}
 */
export const getWorkoutSessionById = async (sessionId) => {
  try {
    const sessionDoc = await getDoc(doc(db, COLLECTION_NAME, sessionId));
    if (!sessionDoc.exists()) {
      return null;
    }
    return WorkoutSession.fromFirestore(sessionDoc);
  } catch (error) {
    console.error(`Error getting workout session with ID ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Create a new workout session
 * @param {WorkoutSession} sessionData - Workout session data
 * @returns {Promise<string>} - New workout session ID
 */
export const createWorkoutSession = async (sessionData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sessionData.toFirestore());
    return docRef.id;
  } catch (error) {
    console.error('Error creating workout session:', error);
    throw error;
  }
};

/**
 * Update a workout session
 * @param {string} sessionId - Workout session ID
 * @param {WorkoutSession} sessionData - Updated workout session data
 */
export const updateWorkoutSession = async (sessionId, sessionData) => {
  try {
    const sessionDocRef = doc(db, COLLECTION_NAME, sessionId);
    await updateDoc(sessionDocRef, sessionData.toFirestore());
  } catch (error) {
    console.error(`Error updating workout session with ID ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Delete a workout session
 * @param {string} sessionId - Workout session ID
 */
export const deleteWorkoutSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, sessionId));
  } catch (error) {
    console.error(`Error deleting workout session with ID ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Update workout session status
 * @param {string} sessionId - Workout session ID
 * @param {string} status - New status ('pending', 'in_progress', 'completed', 'cancelled')
 */
export const updateWorkoutSessionStatus = async (sessionId, status) => {
  try {
    const sessionDocRef = doc(db, COLLECTION_NAME, sessionId);
    await updateDoc(sessionDocRef, { 
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error(`Error updating status for workout session with ID ${sessionId}:`, error);
    throw error;
  }
}; 