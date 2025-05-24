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
const users = ref([]);
const loading = ref(true);
const error = ref(null);

// Fetch users
const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const usersQuery = query(collection(db, 'users'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(usersQuery);
    users.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('Error fetching users:', err);
    error.value = 'Failed to load users';
  } finally {
    loading.value = false;
  }
};

// Load data on mount
onMounted(fetchUsers);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Users</h2>
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
        <div v-if="users.length === 0" class="text-center my-4">
          <p>No users found.</p>
        </div>
        <div v-else>
          <!-- Users table would go here -->
          <p>{{ users.length }} users found.</p>
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            User management is restricted. You can view users but cannot modify their accounts directly.
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 