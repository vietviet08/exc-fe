<script setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const users = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');
const actionInProgress = ref(false);

// Load all users from Firestore
const loadUsers = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    console.log('Loading users from Firestore');
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    
    const usersList = [];
    querySnapshot.forEach(doc => {
      usersList.push({
        id: doc.id,
        ...doc.data(),
        // Add processing flags for each user
        isProcessing: false
      });
    });
    
    users.value = usersList;
    console.log(`Loaded ${usersList.length} users`);
  } catch (err) {
    console.error('Error loading users:', err);
    error.value = `Error loading users: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Change user role
const changeUserRole = async (userId, newRole) => {
  // Find the user and mark as processing
  const user = users.value.find(u => u.id === userId);
  if (!user) return;
  
  user.isProcessing = true;
  actionInProgress.value = true;
  error.value = '';
  success.value = '';
  
  try {
    console.log(`Changing role for user ${userId} to ${newRole}`);
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { role: newRole });
    
    // Update local user data
    user.role = newRole;
    success.value = `User role updated successfully for ${user.email}`;
    console.log(`Role updated successfully for user ${userId}`);
  } catch (err) {
    console.error(`Error updating user role for ${userId}:`, err);
    error.value = `Error updating user role: ${err.message}`;
  } finally {
    user.isProcessing = false;
    actionInProgress.value = false;
  }
};

// Load users when component mounts
onMounted(() => {
  loadUsers();
});
</script>

<template>
  <div class="users-container p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>User Management</h2>
      <button 
        class="btn btn-primary" 
        @click="loadUsers" 
        :disabled="loading || actionInProgress"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
        Refresh Users
      </button>
    </div>
    
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    
    <div v-if="loading" class="d-flex justify-content-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <div v-else>
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="table-light">
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>
                <span 
                  class="badge" 
                  :class="{
                    'bg-danger': user.role === 'admin',
                    'bg-primary': user.role === 'user'
                  }"
                >
                  {{ user.role }}
                </span>
              </td>
              <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
              <td>
                <div class="btn-group">
                  <button 
                    v-if="user.role === 'user'" 
                    class="btn btn-sm btn-outline-danger"
                    @click="changeUserRole(user.id, 'admin')"
                    :disabled="user.isProcessing"
                  >
                    <span v-if="user.isProcessing" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    Make Admin
                  </button>
                  <button 
                    v-if="user.role === 'admin'" 
                    class="btn btn-sm btn-outline-secondary"
                    @click="changeUserRole(user.id, 'user')"
                    :disabled="user.isProcessing"
                  >
                    <span v-if="user.isProcessing" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    Remove Admin
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="4" class="text-center">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style> 