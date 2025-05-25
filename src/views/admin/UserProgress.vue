<script>
import { ref, onMounted } from 'vue';
import { getAllUserProgress, getUserProgressByUser, getUserProgressByLevel, getUserProgressByExercise, deleteUserProgress } from '@/firebase/userProgressManager';
import { getUserById } from '@/firebase/userManager';
import { getLevelById } from '@/firebase/levelManager';
import { getExerciseById } from '@/firebase/exerciseManager';

export default {
  name: 'AdminUserProgress',
  setup() {
    const progressEntries = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const filter = ref({
      userId: '',
      levelId: '',
      exerciseId: '',
      limit: 50
    });
    const userCache = ref({});
    const levelCache = ref({});
    const exerciseCache = ref({});

    // Fetch user progress entries
    const fetchUserProgress = async () => {
      loading.value = true;
      error.value = null;
      try {
        let entries;
        if (filter.value.userId) {
          entries = await getUserProgressByUser(filter.value.userId, filter.value.limit);
        } else if (filter.value.levelId) {
          entries = await getUserProgressByLevel(filter.value.levelId, filter.value.limit);
        } else if (filter.value.exerciseId) {
          entries = await getUserProgressByExercise(filter.value.exerciseId, filter.value.limit);
        } else {
          entries = await getAllUserProgress(filter.value.limit);
        }
        
        progressEntries.value = entries;
        
        // Fetch user, level, and exercise details for each entry
        await Promise.all(entries.map(async (entry) => {
          if (entry.userId) await fetchUserDetails(entry.userId);
          if (entry.levelId) await fetchLevelDetails(entry.levelId);
          if (entry.exerciseId) await fetchExerciseDetails(entry.exerciseId);
        }));
        
      } catch (err) {
        console.error('Error fetching user progress:', err);
        error.value = 'Failed to load user progress entries. Please try again.';
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

    // Fetch exercise details for a given exercise ID
    const fetchExerciseDetails = async (exerciseId) => {
      if (!exerciseId || exerciseCache.value[exerciseId]) return;
      
      try {
        const exercise = await getExerciseById(exerciseId);
        if (exercise) {
          exerciseCache.value[exerciseId] = {
            name: exercise.name
          };
        } else {
          exerciseCache.value[exerciseId] = {
            name: 'Unknown Exercise'
          };
        }
      } catch (err) {
        console.error(`Error fetching exercise ${exerciseId}:`, err);
        exerciseCache.value[exerciseId] = {
          name: 'Error Loading Exercise'
        };
      }
    };

    // Format date
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString();
    };

    // Get user name
    const getUserName = (userId) => {
      return userCache.value[userId]?.name || 'Loading...';
    };

    // Get level name
    const getLevelName = (levelId) => {
      return levelCache.value[levelId]?.name || 'Loading...';
    };

    // Get exercise name
    const getExerciseName = (exerciseId) => {
      return exerciseCache.value[exerciseId]?.name || 'Loading...';
    };

    // Delete progress entry
    const confirmDelete = async (entry) => {
      if (!confirm(`Are you sure you want to delete this progress entry?`)) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        await deleteUserProgress(entry.id);
        await fetchUserProgress();
      } catch (err) {
        console.error('Error deleting progress entry:', err);
        error.value = 'Failed to delete progress entry. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Apply filters
    const applyFilters = () => {
      fetchUserProgress();
    };

    // Reset filters
    const resetFilters = () => {
      filter.value = {
        userId: '',
        levelId: '',
        exerciseId: '',
        limit: 50
      };
      fetchUserProgress();
    };

    // Initialize component
    onMounted(fetchUserProgress);

    return {
      progressEntries,
      loading,
      error,
      filter,
      userCache,
      levelCache,
      exerciseCache,
      formatDate,
      getUserName,
      getLevelName,
      getExerciseName,
      confirmDelete,
      applyFilters,
      resetFilters
    };
  }
};
</script>

<template>
  <div class="user-progress-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>User Progress</h1>
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
            <label for="exerciseId" class="form-label">Exercise ID</label>
            <input
              type="text"
              class="form-control"
              id="exerciseId"
              v-model="filter.exerciseId"
              placeholder="Enter exercise ID"
            >
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
    
    <!-- User Progress Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="progressEntries.length === 0" class="alert alert-info">
          No progress entries found matching your criteria.
        </div>
        
        <table v-else class="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Level</th>
              <th>Exercise</th>
              <th>Completion Date</th>
              <th>Duration</th>
              <th>Reps</th>
              <th>Sets</th>
              <th>Calories</th>
              <th>Difficulty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in progressEntries" :key="entry.id">
              <td>{{ entry.id.substring(0, 8) }}...</td>
              <td>{{ getUserName(entry.userId) }}</td>
              <td>{{ getLevelName(entry.levelId) }}</td>
              <td>{{ getExerciseName(entry.exerciseId) }}</td>
              <td>{{ formatDate(entry.completionDate) }}</td>
              <td>{{ entry.duration }} min</td>
              <td>{{ entry.repsCompleted }}</td>
              <td>{{ entry.setsCompleted }}</td>
              <td>{{ entry.caloriesBurned }}</td>
              <td>{{ entry.difficulty }}</td>
              <td>
                <div class="btn-group">
                  <button 
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmDelete(entry)"
                    title="Delete Entry"
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
.user-progress-container {
  padding: 20px;
}
</style> 