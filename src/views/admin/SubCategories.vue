<script setup>
import { ref, onMounted } from 'vue';
import { 
  collection, 
  getDocs,
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// State
const subCategories = ref([]);
const mainCategories = ref([]);
const loading = ref(true);
const error = ref(null);

// Fetch data
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Fetch main categories for dropdown
    const mainCategoriesQuery = query(collection(db, 'main_categories'), where('is_active', '==', true));
    const mainCategoriesSnapshot = await getDocs(mainCategoriesQuery);
    mainCategories.value = mainCategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Fetch sub categories
    const subCategoriesQuery = query(collection(db, 'sub_categories'), orderBy('sort_order', 'asc'));
    const subCategoriesSnapshot = await getDocs(subCategoriesQuery);
    subCategories.value = subCategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('Error fetching data:', err);
    error.value = 'Failed to load data';
  } finally {
    loading.value = false;
  }
};

// Load data on mount
onMounted(fetchData);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Sub Categories</h2>
      <button class="btn btn-primary">
        <i class="bi bi-plus-circle me-1"></i> Add Sub Category
      </button>
    </div>
    
    <!-- Alert for errors -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <!-- This is a placeholder component. Similar to MainCategories.vue but for Sub Categories. -->
    <div v-else class="card">
      <div class="card-body">
        <div v-if="subCategories.length === 0" class="text-center my-4">
          <p>No sub categories found.</p>
        </div>
        <div v-else>
          <!-- Sub Categories table would go here, similar to MainCategories.vue -->
          <p>{{ subCategories.length }} sub categories found.</p>
        </div>
      </div>
    </div>
  </div>
</template> 