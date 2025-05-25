import { db } from './config';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { Category } from '../models';

const COLLECTION_NAME = 'categories';

/**
 * Get all categories
 * @param {boolean} activeOnly - If true, only return active categories
 * @returns {Promise<Category[]>}
 */
export const getAllCategories = async (activeOnly = false) => {
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
    return querySnapshot.docs.map(doc => Category.fromFirestore(doc));
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

/**
 * Get a category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Category|null>}
 */
export const getCategoryById = async (categoryId) => {
  try {
    const categoryDoc = await getDoc(doc(db, COLLECTION_NAME, categoryId));
    if (!categoryDoc.exists()) {
      return null;
    }
    return Category.fromFirestore(categoryDoc);
  } catch (error) {
    console.error(`Error getting category with ID ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Create a new category
 * @param {Category} categoryData - Category data
 * @returns {Promise<string>} - New category ID
 */
export const createCategory = async (categoryData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), categoryData.toFirestore());
    return docRef.id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update a category
 * @param {string} categoryId - Category ID
 * @param {Category} categoryData - Updated category data
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const categoryDocRef = doc(db, COLLECTION_NAME, categoryId);
    await updateDoc(categoryDocRef, categoryData.toFirestore());
  } catch (error) {
    console.error(`Error updating category with ID ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Delete a category
 * @param {string} categoryId - Category ID
 */
export const deleteCategory = async (categoryId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, categoryId));
  } catch (error) {
    console.error(`Error deleting category with ID ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Activate or deactivate a category
 * @param {string} categoryId - Category ID
 * @param {boolean} isActive - Whether to activate or deactivate the category
 */
export const toggleCategoryActive = async (categoryId, isActive) => {
  try {
    const categoryDocRef = doc(db, COLLECTION_NAME, categoryId);
    await updateDoc(categoryDocRef, { isActive });
  } catch (error) {
    console.error(`Error toggling active state for category with ID ${categoryId}:`, error);
    throw error;
  }
}; 