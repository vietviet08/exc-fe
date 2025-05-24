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
const workoutPlans = ref([]);
const loading = ref(true);
const error = ref(null);

// Fetch workout plans
const fetchPlans = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const plansQuery = query(collection(db, 'workout_plans'), orderBy('sort_order', 'asc'));
    const snapshot = await getDocs(plansQuery);
    workoutPlans.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('Error fetching workout plans:', err);
    error.value = 'Failed to load workout plans';
  } finally {
    loading.value = false;
  }
};

// Load data on mount
onMounted(fetchPlans);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Workout Plans</h2>
      <button class="btn btn-primary">
        <i class="bi bi-plus-circle me-1"></i> Add Workout Plan
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
        <div v-if="workoutPlans.length === 0" class="text-center my-4">
          <p>No workout plans found.</p>
        </div>
        <div v-else>
          <!-- Workout plans table would go here -->
          <p>{{ workoutPlans.length }} workout plans found.</p>
        </div>
      </div>
    </div>
  </div>
</template> 