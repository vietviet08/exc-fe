<script>
import { ref, onMounted } from 'vue';
import { getAllLevels, getLevelsByWorkoutType, createLevel, updateLevel, deleteLevel, toggleLevelActive } from '@/firebase/levelManager';
import { getAllWorkoutTypes } from '@/firebase/workoutTypeManager';
import { Level } from '@/models';

export default {
  name: 'AdminLevels',
  setup() {
    const levels = ref([]);
    const workoutTypes = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const showForm = ref(false);
    const editMode = ref(false);
    const currentLevel = ref(new Level({}));
    const selectedWorkoutTypeId = ref('');

    // Form validation
    const formErrors = ref({});

    // Fetch all levels
    const fetchLevels = async () => {
      loading.value = true;
      error.value = null;
      try {
        if (selectedWorkoutTypeId.value) {
          levels.value = await getLevelsByWorkoutType(selectedWorkoutTypeId.value);
        } else {
          levels.value = await getAllLevels();
        }
      } catch (err) {
        console.error('Error fetching levels:', err);
        error.value = 'Failed to load levels. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Fetch all workout types
    const fetchWorkoutTypes = async () => {
      try {
        // Fetch all workout types, not just active ones
        workoutTypes.value = await getAllWorkoutTypes(false);
        console.log('Fetched workout types:', workoutTypes.value.length);
      } catch (err) {
        console.error('Error fetching workout types:', err);
        error.value = 'Failed to load workout types. Please try again.';
      }
    };

    // Initialize component
    onMounted(async () => {
      await fetchWorkoutTypes();
      await fetchLevels();
    });

    // Filter by workout type
    const filterByWorkoutType = async () => {
      await fetchLevels();
    };

    // Add new level
    const addLevel = () => {
      currentLevel.value = new Level({
        workoutTypeId: selectedWorkoutTypeId.value || ''
      });
      showForm.value = true;
      editMode.value = false;
    };

    // Edit level
    const editLevel = (level) => {
      currentLevel.value = new Level({ ...level });
      showForm.value = true;
      editMode.value = true;
    };

    // Validate form
    const validateForm = () => {
      const errors = {};
      
      if (!currentLevel.value.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!currentLevel.value.workoutTypeId) {
        errors.workoutTypeId = 'Workout Type is required';
      }
      
      formErrors.value = errors;
      return Object.keys(errors).length === 0;
    };

    // Save level
    const saveLevel = async () => {
      if (!validateForm()) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        if (editMode.value) {
          await updateLevel(currentLevel.value.id, currentLevel.value);
        } else {
          const levelId = await createLevel(currentLevel.value);
          currentLevel.value.id = levelId;
        }
        
        await fetchLevels();
        showForm.value = false;
      } catch (err) {
        console.error('Error saving level:', err);
        error.value = `Failed to ${editMode.value ? 'update' : 'create'} level. Please try again.`;
      } finally {
        loading.value = false;
      }
    };

    // Cancel form
    const cancelForm = () => {
      showForm.value = false;
      formErrors.value = {};
    };

    // Toggle level active state
    const toggleActive = async (level) => {
      loading.value = true;
      error.value = null;
      
      try {
        await toggleLevelActive(level.id, !level.isActive);
        await fetchLevels();
      } catch (err) {
        console.error('Error toggling level active state:', err);
        error.value = 'Failed to update level status. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Delete level
    const confirmDelete = async (level) => {
      if (!confirm(`Are you sure you want to delete "${level.name}"?`)) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        await deleteLevel(level.id);
        await fetchLevels();
      } catch (err) {
        console.error('Error deleting level:', err);
        error.value = 'Failed to delete level. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Get workout type name by ID
    const getWorkoutTypeName = (workoutTypeId) => {
      const workoutType = workoutTypes.value.find(wt => wt.id === workoutTypeId);
      return workoutType ? workoutType.name : 'Unknown';
    };

    return {
      levels,
      workoutTypes,
      loading,
      error,
      showForm,
      editMode,
      currentLevel,
      selectedWorkoutTypeId,
      formErrors,
      addLevel,
      editLevel,
      saveLevel,
      cancelForm,
      toggleActive,
      confirmDelete,
      filterByWorkoutType,
      getWorkoutTypeName
    };
  }
};
</script>

<template>
  <div class="levels-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Workout Levels</h1>
      <button class="btn btn-primary" @click="addLevel">
        <i class="fas fa-plus me-2"></i> Add Level
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <!-- Filter by Workout Type -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4">
            <label for="workoutTypeFilter" class="form-label">Filter by Workout Type</label>
            <select 
              id="workoutTypeFilter" 
              class="form-select" 
              v-model="selectedWorkoutTypeId"
              @change="filterByWorkoutType"
            >
              <option value="">All Workout Types</option>
              <option v-for="workoutType in workoutTypes" :key="workoutType.id" :value="workoutType.id">
                {{ workoutType.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Level Form -->
    <div v-if="showForm" class="card mb-4">
      <div class="card-header">
        <h5>{{ editMode ? 'Edit Level' : 'Add New Level' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveLevel">
          <div class="mb-3">
            <label for="workoutTypeId" class="form-label">Workout Type*</label>
            <select
              id="workoutTypeId"
              class="form-select"
              v-model="currentLevel.workoutTypeId"
              :class="{ 'is-invalid': formErrors.workoutTypeId }"
            >
              <option value="">Select Workout Type</option>
              <option v-for="workoutType in workoutTypes" :key="workoutType.id" :value="workoutType.id">
                {{ workoutType.name }}
              </option>
            </select>
            <div v-if="formErrors.workoutTypeId" class="invalid-feedback">
              {{ formErrors.workoutTypeId }}
            </div>
          </div>
          
          <div class="mb-3">
            <label for="name" class="form-label">Name*</label>
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="currentLevel.name"
              :class="{ 'is-invalid': formErrors.name }"
            >
            <div v-if="formErrors.name" class="invalid-feedback">
              {{ formErrors.name }}
            </div>
          </div>
          
          <div class="mb-3">
            <label for="description" class="form-label">Description</label>
            <textarea
              class="form-control"
              id="description"
              v-model="currentLevel.description"
              rows="3"
            ></textarea>
          </div>
          
          <div class="mb-3">
            <label for="difficulty" class="form-label">Difficulty</label>
            <select
              id="difficulty"
              class="form-select"
              v-model="currentLevel.difficulty"
            >
              <option value="">Select Difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label for="durationMinutes" class="form-label">Duration (minutes)</label>
            <input
              type="number"
              class="form-control"
              id="durationMinutes"
              v-model="currentLevel.durationMinutes"
              min="1"
            >
          </div>
          
          <div class="mb-3">
            <label for="caloriesBurn" class="form-label">Calories Burn</label>
            <input
              type="number"
              class="form-control"
              id="caloriesBurn"
              v-model="currentLevel.caloriesBurn"
              min="0"
            >
          </div>
          
          <div class="mb-3">
            <label for="order" class="form-label">Order</label>
            <input
              type="number"
              class="form-control"
              id="order"
              v-model="currentLevel.order"
              min="0"
            >
          </div>
          
          <div class="mb-3 form-check">
            <input
              type="checkbox"
              class="form-check-input"
              id="isActive"
              v-model="currentLevel.isActive"
            >
            <label class="form-check-label" for="isActive">Active</label>
          </div>
          
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ editMode ? 'Update' : 'Create' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="cancelForm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Levels Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading && !showForm" class="text-center my-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="levels.length === 0" class="alert alert-info">
          No levels found. Click "Add Level" to create one.
        </div>
        
        <table v-else class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Workout Type</th>
              <th>Difficulty</th>
              <th>Duration</th>
              <th>Calories</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="level in levels" :key="level.id">
              <td>{{ level.name }}</td>
              <td>{{ getWorkoutTypeName(level.workoutTypeId) }}</td>
              <td>{{ level.difficulty || '-' }}</td>
              <td>{{ level.durationMinutes || '-' }} min</td>
              <td>{{ level.caloriesBurn || '-' }}</td>
              <td>{{ level.order }}</td>
              <td>
                <span :class="`badge ${level.isActive ? 'bg-success' : 'bg-danger'}`">
                  {{ level.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" @click="editLevel(level)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="toggleActive(level)">
                    <i :class="`fas fa-${level.isActive ? 'ban' : 'check'}`"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(level)">
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
.levels-container {
  padding: 20px;
}
</style> 