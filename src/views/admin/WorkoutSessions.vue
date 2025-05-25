<script>
import { ref, onMounted } from 'vue';
import { getAllWorkoutSessions, getWorkoutSessionsByUser, getWorkoutSessionsByLevel, getWorkoutSessionsByStatus, deleteWorkoutSession, updateWorkoutSessionStatus } from '@/firebase/workoutSessionManager';
import { getUserById } from '@/firebase/userManager';
import { getLevelById } from '@/firebase/levelManager';

export default {
  name: 'AdminWorkoutSessions',
  setup() {
    const workoutSessions = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const filter = ref({
      userId: '',
      levelId: '',
      status: '',
      limit: 50
    });
    const userCache = ref({});
    const levelCache = ref({});

    // Fetch workout sessions
    const fetchWorkoutSessions = async () => {
      loading.value = true;
      error.value = null;
      try {
        let sessions;
        if (filter.value.userId) {
          sessions = await getWorkoutSessionsByUser(filter.value.userId, filter.value.limit);
        } else if (filter.value.levelId) {
          sessions = await getWorkoutSessionsByLevel(filter.value.levelId, filter.value.limit);
        } else if (filter.value.status) {
          sessions = await getWorkoutSessionsByStatus(filter.value.status, filter.value.limit);
        } else {
          sessions = await getAllWorkoutSessions(filter.value.limit);
        }
        
        workoutSessions.value = sessions;
        
        // Fetch user and level details for each session
        await Promise.all(sessions.map(async (session) => {
          await fetchUserDetails(session.userId);
          await fetchLevelDetails(session.levelId);
        }));
        
      } catch (err) {
        console.error('Error fetching workout sessions:', err);
        error.value = 'Failed to load workout sessions. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Fetch user details for a given user ID
    const fetchUserDetails = async (userId) => {
      if (!userId || userCache.value[userId]) return;
      
      try {
        const user = await getUserById(userId);
        if (user) {
          userCache.value[userId] = {
            name: user.displayName || user.email,
            email: user.email
          };
        } else {
          userCache.value[userId] = {
            name: 'Unknown User',
            email: 'N/A'
          };
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
        userCache.value[userId] = {
          name: 'Error Loading User',
          email: 'N/A'
        };
      }
    };

    // Fetch level details for a given level ID
    const fetchLevelDetails = async (levelId) => {
      if (!levelId || levelCache.value[levelId]) return;
      
      try {
        const level = await getLevelById(levelId);
        if (level) {
          levelCache.value[levelId] = {
            name: level.name,
            difficulty: level.difficulty
          };
        } else {
          levelCache.value[levelId] = {
            name: 'Unknown Level',
            difficulty: 'N/A'
          };
        }
      } catch (err) {
        console.error(`Error fetching level ${levelId}:`, err);
        levelCache.value[levelId] = {
          name: 'Error Loading Level',
          difficulty: 'N/A'
        };
      }
    };

    // Format date
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString();
    };

    // Format duration
    const formatDuration = (duration) => {
      if (!duration) return 'N/A';
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    };

    // Get user name
    const getUserName = (userId) => {
      return userCache.value[userId]?.name || 'Loading...';
    };

    // Get level name
    const getLevelName = (levelId) => {
      return levelCache.value[levelId]?.name || 'Loading...';
    };

    // Update session status
    const updateStatus = async (session, newStatus) => {
      loading.value = true;
      error.value = null;
      
      try {
        await updateWorkoutSessionStatus(session.id, newStatus);
        await fetchWorkoutSessions();
      } catch (err) {
        console.error(`Error updating workout session status:`, err);
        error.value = 'Failed to update session status. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Delete session
    const confirmDelete = async (session) => {
      if (!confirm(`Are you sure you want to delete this workout session?`)) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        await deleteWorkoutSession(session.id);
        await fetchWorkoutSessions();
      } catch (err) {
        console.error('Error deleting workout session:', err);
        error.value = 'Failed to delete workout session. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Apply filters
    const applyFilters = () => {
      fetchWorkoutSessions();
    };

    // Reset filters
    const resetFilters = () => {
      filter.value = {
        userId: '',
        levelId: '',
        status: '',
        limit: 50
      };
      fetchWorkoutSessions();
    };

    // Initialize component
    onMounted(fetchWorkoutSessions);

    return {
      workoutSessions,
      loading,
      error,
      filter,
      userCache,
      levelCache,
      formatDate,
      formatDuration,
      getUserName,
      getLevelName,
      updateStatus,
      confirmDelete,
      applyFilters,
      resetFilters
    };
  }
};
</script>

<template>
  <div class="workout-sessions-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Workout Sessions</h1>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>Filters</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3 mb-3">
            <label for="userId" class="form-label">User ID</label>
            <input
              type="text"
              class="form-control"
              id="userId"
              v-model="filter.userId"
              placeholder="Enter user ID"
            >
          </div>
          
          <div class="col-md-3 mb-3">
            <label for="levelId" class="form-label">Level ID</label>
            <input
              type="text"
              class="form-control"
              id="levelId"
              v-model="filter.levelId"
              placeholder="Enter level ID"
            >
          </div>
          
          <div class="col-md-3 mb-3">
            <label for="status" class="form-label">Status</label>
            <select
              id="status"
              class="form-select"
              v-model="filter.status"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div class="col-md-3 mb-3">
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
        </div>
        
        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="applyFilters" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Apply Filters
          </button>
          <button class="btn btn-secondary" @click="resetFilters">Reset</button>
        </div>
      </div>
    </div>
    
    <!-- Workout Sessions Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="workoutSessions.length === 0" class="alert alert-info">
          No workout sessions found matching your criteria.
        </div>
        
        <table v-else class="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Level</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Calories</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in workoutSessions" :key="session.id">
              <td>{{ session.id.substring(0, 8) }}...</td>
              <td>{{ getUserName(session.userId) }}</td>
              <td>{{ getLevelName(session.levelId) }}</td>
              <td>{{ formatDate(session.startTime) }}</td>
              <td>{{ formatDate(session.endTime) }}</td>
              <td>{{ session.duration }} min</td>
              <td>{{ session.totalCaloriesBurned }}</td>
              <td>
                <span :class="`badge ${
                  session.status === 'completed' ? 'bg-success' : 
                  session.status === 'in_progress' ? 'bg-warning' : 
                  session.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                }`">
                  {{ session.status.replace('_', ' ') }}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  <button 
                    v-if="session.status !== 'completed'" 
                    class="btn btn-sm btn-outline-success"
                    @click="updateStatus(session, 'completed')"
                    title="Mark as Completed"
                  >
                    <i class="fas fa-check"></i>
                  </button>
                  <button 
                    v-if="session.status !== 'in_progress'" 
                    class="btn btn-sm btn-outline-warning"
                    @click="updateStatus(session, 'in_progress')"
                    title="Mark as In Progress"
                  >
                    <i class="fas fa-play"></i>
                  </button>
                  <button 
                    v-if="session.status !== 'cancelled'" 
                    class="btn btn-sm btn-outline-danger"
                    @click="updateStatus(session, 'cancelled')"
                    title="Mark as Cancelled"
                  >
                    <i class="fas fa-ban"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmDelete(session)"
                    title="Delete Session"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workout-sessions-container {
  padding: 20px;
}
</style> 