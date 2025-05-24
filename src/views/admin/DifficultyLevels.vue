<script setup>
import { ref, onMounted } from 'vue';
import { 
  collection, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// State
const difficultyLevels = ref([]);
const loading = ref(true);
const error = ref(null);

// Fetch difficulty levels
const fetchLevels = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const levelsQuery = query(collection(db, 'difficulty_levels'), orderBy('level_order', 'asc'));
    const snapshot = await getDocs(levelsQuery);
    difficultyLevels.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('Error fetching difficulty levels:', err);
    error.value = 'Failed to load difficulty levels';
  } finally {
    loading.value = false;
  }
};

// Load data on mount
onMounted(fetchLevels);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Difficulty Levels</h2>
      <button class="btn btn-primary">
        <i class="bi bi-plus-circle me-1"></i> Add Level
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
    
    <!-- This is a placeholder component -->
    <div v-else class="card">
      <div class="card-body">
        <div v-if="difficultyLevels.length === 0" class="text-center my-4">
          <p>No difficulty levels found.</p>
        </div>
        <div v-else>
          <!-- Difficulty levels table would go here -->
          <p>{{ difficultyLevels.length }} difficulty levels found.</p>
        </div>
      </div>
    </div>
  </div>
</template> 