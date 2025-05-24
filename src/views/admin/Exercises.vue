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
const exercises = ref([]);
const loading = ref(true);
const error = ref(null);

// Fetch exercises
const fetchExercises = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const exercisesQuery = query(collection(db, 'exercises'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(exercisesQuery);
    exercises.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('Error fetching exercises:', err);
    error.value = 'Failed to load exercises';
  } finally {
    loading.value = false;
  }
};

// Load data on mount
onMounted(fetchExercises);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Exercises</h2>
      <button class="btn btn-primary">
        <i class="bi bi-plus-circle me-1"></i> Add Exercise
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
        <div v-if="exercises.length === 0" class="text-center my-4">
          <p>No exercises found.</p>
        </div>
        <div v-else>
          <!-- Exercises table would go here -->
          <p>{{ exercises.length }} exercises found.</p>
        </div>
      </div>
    </div>
  </div>
</template> 