<script>
import { ref, onMounted } from 'vue';
import { getAllUsers, getUsersByRole, getUserById, updateUser } from '@/firebase/userManager';
import { User } from '@/models';

export default {
  name: 'AdminUsers',
  setup() {
    const users = ref([]);
    const loading = ref(true);
    const error = ref('');
    const success = ref('');
    const filter = ref({
      role: '',
      limit: 100
    });
    const selectedUser = ref(null);
    const showDetailsModal = ref(false);

    // Load users from Firebase
    const fetchUsers = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        if (filter.value.role) {
          users.value = await getUsersByRole(filter.value.role);
        } else {
          users.value = await getAllUsers(filter.value.limit);
        }
      } catch (err) {
        console.error('Error loading users:', err);
        error.value = `Error loading users: ${err.message}`;
      } finally {
        loading.value = false;
      }
    };

    // Get user details
    const viewUserDetails = async (userId) => {
      loading.value = true;
      error.value = '';
      
      try {
        selectedUser.value = await getUserById(userId);
        showDetailsModal.value = true;
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
        error.value = `Error fetching user details: ${err.message}`;
      } finally {
        loading.value = false;
      }
    };

    // Change user role
    const changeUserRole = async (userId, newRole) => {
      if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
      
      loading.value = true;
      error.value = '';
      success.value = '';
      
      try {
        const user = await getUserById(userId);
        if (user) {
          user.role = newRole;
          await updateUser(userId, user);
          success.value = `User role updated successfully for ${user.email}`;
          await fetchUsers();
        }
      } catch (err) {
        console.error(`Error updating user role for ${userId}:`, err);
        error.value = `Error updating user role: ${err.message}`;
      } finally {
        loading.value = false;
      }
    };

    // Format date
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString();
    };

    // Apply filters
    const applyFilters = () => {
      fetchUsers();
    };

    // Reset filters
    const resetFilters = () => {
      filter.value = {
        role: '',
        limit: 100
      };
      fetchUsers();
    };

    // Initialize component
    onMounted(fetchUsers);

    return {
      users,
      loading,
      error,
      success,
      filter,
      selectedUser,
      showDetailsModal,
      fetchUsers,
      viewUserDetails,
      changeUserRole,
      formatDate,
      applyFilters,
      resetFilters
    };
  }
};
</script>

<template>
  <div class="users-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Users</h1>
      <button 
        class="btn btn-primary" 
        @click="fetchUsers" 
        :disabled="loading"
      >
        <i class="fas fa-sync-alt me-2"></i> Refresh
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    
    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>Filters</h5>
      </div>
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4">
            <label for="roleFilter" class="form-label">Filter by Role</label>
            <select 
              id="roleFilter" 
              class="form-select" 
              v-model="filter.role"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          
          <div class="col-md-4">
            <label for="limit" class="form-label">Limit</label>
            <input
              type="number"
              class="form-control"
              id="limit"
              v-model="filter.limit"
              min="1"
              max="500"
            >
          </div>
          
          <div class="col-md-4 d-flex gap-2">
            <button class="btn btn-primary" @click="applyFilters" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Apply Filters
            </button>
            <button class="btn btn-secondary" @click="resetFilters">Reset</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Users Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="users.length === 0" class="alert alert-info">
          No users found matching your criteria.
        </div>
        
        <table v-else class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Email</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>{{ user.displayName || 'Not set' }}</td>
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
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="btn-group">
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    @click="viewUserDetails(user.id)"
                    title="View Details"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button 
                    v-if="user.role === 'user'" 
                    class="btn btn-sm btn-outline-danger"
                    @click="changeUserRole(user.id, 'admin')"
                    title="Make Admin"
                  >
                    <i class="fas fa-user-shield"></i>
                  </button>
                  <button 
                    v-if="user.role === 'admin'" 
                    class="btn btn-sm btn-outline-secondary"
                    @click="changeUserRole(user.id, 'user')"
                    title="Remove Admin"
                  >
                    <i class="fas fa-user"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- User Details Modal -->
    <div v-if="showDetailsModal" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">User Details</h5>
            <button type="button" class="btn-close" @click="showDetailsModal = false"></button>
          </div>
          <div class="modal-body" v-if="selectedUser">
            <div class="row mb-3">
              <div class="col-md-4 text-center mb-3">
                <div v-if="selectedUser.avatar" class="mb-2">
                  <img :src="selectedUser.avatar" alt="User Avatar" class="rounded-circle" style="width: 120px; height: 120px; object-fit: cover;">
                </div>
                <div v-else class="border rounded-circle d-flex align-items-center justify-content-center" style="width: 120px; height: 120px; margin: 0 auto;">
                  <i class="fas fa-user fa-4x text-secondary"></i>
                </div>
                <h5 class="mt-2">{{ selectedUser.displayName || selectedUser.email }}</h5>
                <span 
                  class="badge" 
                  :class="{
                    'bg-danger': selectedUser.role === 'admin',
                    'bg-primary': selectedUser.role === 'user'
                  }"
                >
                  {{ selectedUser.role }}
                </span>
              </div>
              <div class="col-md-8">
                <table class="table">
                  <tbody>
                    <tr>
                      <th style="width: 30%">Email</th>
                      <td>{{ selectedUser.email }}</td>
                    </tr>
                    <tr>
                      <th>Gender</th>
                      <td>{{ selectedUser.gender || 'Not set' }}</td>
                    </tr>
                    <tr>
                      <th>Age</th>
                      <td>{{ selectedUser.age || 'Not set' }}</td>
                    </tr>
                    <tr>
                      <th>Height</th>
                      <td>{{ selectedUser.height ? `${selectedUser.height} cm` : 'Not set' }}</td>
                    </tr>
                    <tr>
                      <th>Weight</th>
                      <td>{{ selectedUser.weight ? `${selectedUser.weight} kg` : 'Not set' }}</td>
                    </tr>
                    <tr>
                      <th>Fitness Level</th>
                      <td>{{ selectedUser.fitnessLevel || 'Not set' }}</td>
                    </tr>
                    <tr>
                      <th>Created At</th>
                      <td>{{ formatDate(selectedUser.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="selectedUser.goals && selectedUser.goals.length">
              <h6>Goals</h6>
              <div class="mb-3">
                <span v-for="goal in selectedUser.goals" :key="goal" class="badge bg-info me-2 mb-1">{{ goal }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDetailsModal = false">Close</button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<style scoped>
.users-container {
  padding: 20px;
}
</style> 