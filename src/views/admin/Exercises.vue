<script>
import { ref, onMounted } from 'vue';
import { getAllExercises, getExercisesByLevel, getExercisesByMuscleGroup, createExercise, updateExercise, deleteExercise, toggleExerciseActive } from '@/firebase/exerciseManager';
import { getAllLevels } from '@/firebase/levelManager';
import { Exercise } from '@/models';

export default {
  name: 'AdminExercises',
  setup() {
    const exercises = ref([]);
    const levels = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const showForm = ref(false);
    const editMode = ref(false);
    const currentExercise = ref(new Exercise({}));
    const filter = ref({
      levelId: '',
      muscleGroup: ''
    });
    
    // Add missing refs for form inputs
    const newInstruction = ref('');
    const newTip = ref('');
    
    // Predefined muscle groups
    const muscleGroups = [
      'Chest',
      'Back',
      'Shoulders',
      'Arms',
      'Abdominals',
      'Legs',
      'Full Body',
      'Core'
    ];

    // Form validation
    const formErrors = ref({});

    // Fetch all exercises
    const fetchExercises = async () => {
      loading.value = true;
      error.value = null;
      try {
        if (filter.value.levelId) {
          exercises.value = await getExercisesByLevel(filter.value.levelId);
        } else if (filter.value.muscleGroup) {
          exercises.value = await getExercisesByMuscleGroup(filter.value.muscleGroup);
        } else {
          exercises.value = await getAllExercises();
        }
      } catch (err) {
        console.error('Error fetching exercises:', err);
        error.value = 'Failed to load exercises. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Fetch all levels
    const fetchLevels = async () => {
      try {
        // Fetch all levels, not just active ones
        levels.value = await getAllLevels(false);
        console.log('Fetched levels:', levels.value.length);
      } catch (err) {
        console.error('Error fetching levels:', err);
        error.value = 'Failed to load levels. Please try again.';
      }
    };

    // Initialize component
    onMounted(async () => {
      await fetchLevels();
      await fetchExercises();
    });

    // Filter exercises
    const applyFilter = () => {
      fetchExercises();
    };

    // Reset filter
    const resetFilter = () => {
      filter.value = {
        levelId: '',
        muscleGroup: ''
      };
      fetchExercises();
    };

    // Add new exercise
    const addExercise = () => {
      currentExercise.value = new Exercise({
        levelId: filter.value.levelId || '',
        instructions: [],
        tips: [],
        muscleGroups: []
      });
      showForm.value = true;
      editMode.value = false;
    };

    // Edit exercise
    const editExercise = (exercise) => {
      currentExercise.value = new Exercise({ ...exercise });
      showForm.value = true;
      editMode.value = true;
    };

    // Handle array inputs for instructions, tips, and muscle groups
    const addArrayItem = (array, item) => {
      if (item.trim()) {
        array.push(item.trim());
        return '';
      }
      return item;
    };

    const removeArrayItem = (array, index) => {
      array.splice(index, 1);
    };

    // Toggle muscle group selection
    const toggleMuscleGroup = (group) => {
      const index = currentExercise.value.muscleGroups.indexOf(group);
      if (index === -1) {
        currentExercise.value.muscleGroups.push(group);
      } else {
        currentExercise.value.muscleGroups.splice(index, 1);
      }
    };

    // Validate form
    const validateForm = () => {
      const errors = {};
      
      if (!currentExercise.value.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!currentExercise.value.levelId) {
        errors.levelId = 'Level is required';
      }
      
      formErrors.value = errors;
      return Object.keys(errors).length === 0;
    };

    // Save exercise
    const saveExercise = async () => {
      if (!validateForm()) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        if (editMode.value) {
          await updateExercise(currentExercise.value.id, currentExercise.value);
        } else {
          const exerciseId = await createExercise(currentExercise.value);
          currentExercise.value.id = exerciseId;
        }
        
        await fetchExercises();
        showForm.value = false;
      } catch (err) {
        console.error('Error saving exercise:', err);
        error.value = `Failed to ${editMode.value ? 'update' : 'create'} exercise. Please try again.`;
      } finally {
        loading.value = false;
      }
    };

    // Cancel form
    const cancelForm = () => {
      showForm.value = false;
      formErrors.value = {};
    };

    // Toggle exercise active state
    const toggleActive = async (exercise) => {
      loading.value = true;
      error.value = null;
      
      try {
        await toggleExerciseActive(exercise.id, !exercise.isActive);
        await fetchExercises();
      } catch (err) {
        console.error('Error toggling exercise active state:', err);
        error.value = 'Failed to update exercise status. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Delete exercise
    const confirmDelete = async (exercise) => {
      if (!confirm(`Are you sure you want to delete "${exercise.name}"?`)) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        await deleteExercise(exercise.id);
        await fetchExercises();
      } catch (err) {
        console.error('Error deleting exercise:', err);
        error.value = 'Failed to delete exercise. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Get level name by ID
    const getLevelName = (levelId) => {
      const level = levels.value.find(l => l.id === levelId);
      return level ? level.name : 'Unknown';
    };

    return {
      exercises,
      levels,
      loading,
      error,
      showForm,
      editMode,
      currentExercise,
      filter,
      muscleGroups,
      formErrors,
      fetchExercises,
      addExercise,
      editExercise,
      saveExercise,
      cancelForm,
      toggleActive,
      confirmDelete,
      getLevelName,
      applyFilter,
      resetFilter,
      addArrayItem,
      removeArrayItem,
      toggleMuscleGroup,
      newInstruction,
      newTip
    };
  }
};
</script>

<template>
  <div class="exercises-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Exercises</h1>
      <button class="btn btn-primary" @click="addExercise">
        <i class="fas fa-plus me-2"></i> Add Exercise
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>Filters</h5>
      </div>
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4 mb-3">
            <label for="levelFilter" class="form-label">Filter by Level</label>
            <select 
              id="levelFilter" 
              class="form-select" 
              v-model="filter.levelId"
            >
              <option value="">All Levels</option>
              <option v-for="level in levels" :key="level.id" :value="level.id">
                {{ level.name }}
              </option>
            </select>
          </div>
          
          <div class="col-md-4 mb-3">
            <label for="muscleGroupFilter" class="form-label">Filter by Muscle Group</label>
            <select 
              id="muscleGroupFilter" 
              class="form-select" 
              v-model="filter.muscleGroup"
            >
              <option value="">All Muscle Groups</option>
              <option v-for="group in muscleGroups" :key="group" :value="group">
                {{ group }}
              </option>
            </select>
          </div>
          
          <div class="col-md-4 mb-3 d-flex gap-2">
            <button class="btn btn-primary" @click="applyFilter" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Apply Filter
            </button>
            <button class="btn btn-secondary" @click="resetFilter">Reset</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Exercise Form -->
    <div v-if="showForm" class="card mb-4">
      <div class="card-header">
        <h5>{{ editMode ? 'Edit Exercise' : 'Add New Exercise' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveExercise">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label for="levelId" class="form-label">Level*</label>
                <select
                  id="levelId"
                  class="form-select"
                  v-model="currentExercise.levelId"
                  :class="{ 'is-invalid': formErrors.levelId }"
                >
                  <option value="">Select Level</option>
                  <option v-for="level in levels" :key="level.id" :value="level.id">
                    {{ level.name }}
                  </option>
                </select>
                <div v-if="formErrors.levelId" class="invalid-feedback">
                  {{ formErrors.levelId }}
                </div>
              </div>
              
              <div class="mb-3">
                <label for="name" class="form-label">Name*</label>
                <input
                  type="text"
                  class="form-control"
                  id="name"
                  v-model="currentExercise.name"
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
                  v-model="currentExercise.description"
                  rows="3"
                ></textarea>
              </div>
              
              <div class="mb-3">
                <label for="image" class="form-label">Image URL</label>
                <input
                  type="text"
                  class="form-control"
                  id="image"
                  v-model="currentExercise.image"
                >
              </div>
              
              <div class="mb-3">
                <label for="video" class="form-label">Video URL</label>
                <input
                  type="text"
                  class="form-control"
                  id="video"
                  v-model="currentExercise.video"
                >
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="mb-3">
                <label for="equipment" class="form-label">Equipment</label>
                <input
                  type="text"
                  class="form-control"
                  id="equipment"
                  v-model="currentExercise.equipment"
                >
              </div>
              
              <div class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="duration" class="form-label">Duration (sec)</label>
                    <input
                      type="number"
                      class="form-control"
                      id="duration"
                      v-model="currentExercise.duration"
                      min="0"
                    >
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="reps" class="form-label">Reps</label>
                    <input
                      type="number"
                      class="form-control"
                      id="reps"
                      v-model="currentExercise.reps"
                      min="0"
                    >
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="restTime" class="form-label">Rest Time (sec)</label>
                    <input
                      type="number"
                      class="form-control"
                      id="restTime"
                      v-model="currentExercise.restTime"
                      min="0"
                    >
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label for="caloriesBurn" class="form-label">Calories Burn</label>
                <input
                  type="number"
                  class="form-control"
                  id="caloriesBurn"
                  v-model="currentExercise.caloriesBurn"
                  min="0"
                >
              </div>
              
              <div class="mb-3">
                <label for="order" class="form-label">Order</label>
                <input
                  type="number"
                  class="form-control"
                  id="order"
                  v-model="currentExercise.order"
                  min="0"
                >
              </div>
              
              <div class="mb-3 form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="isActive"
                  v-model="currentExercise.isActive"
                >
                <label class="form-check-label" for="isActive">Active</label>
              </div>
            </div>
          </div>
          
          <!-- Muscle Groups -->
          <div class="mb-3">
            <label class="form-label">Muscle Groups</label>
            <div>
              <div class="form-check form-check-inline" v-for="group in muscleGroups" :key="group">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :id="'muscle-' + group" 
                  :checked="currentExercise.muscleGroups.includes(group)"
                  @change="toggleMuscleGroup(group)"
                >
                <label class="form-check-label" :for="'muscle-' + group">{{ group }}</label>
              </div>
            </div>
          </div>
          
          <!-- Instructions -->
          <div class="mb-3">
            <label class="form-label">Instructions</label>
            <div v-for="(instruction, index) in currentExercise.instructions" :key="index" class="input-group mb-2">
              <input type="text" class="form-control" v-model="currentExercise.instructions[index]">
              <button type="button" class="btn btn-outline-danger" @click="removeArrayItem(currentExercise.instructions, index)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Add instruction and press Enter" 
                v-model="newInstruction"
                @keyup.enter="newInstruction = addArrayItem(currentExercise.instructions, newInstruction)"
              >
              <button 
                type="button" 
                class="btn btn-outline-success" 
                @click="newInstruction = addArrayItem(currentExercise.instructions, newInstruction)"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <!-- Tips -->
          <div class="mb-3">
            <label class="form-label">Tips</label>
            <div v-for="(tip, index) in currentExercise.tips" :key="index" class="input-group mb-2">
              <input type="text" class="form-control" v-model="currentExercise.tips[index]">
              <button type="button" class="btn btn-outline-danger" @click="removeArrayItem(currentExercise.tips, index)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Add tip and press Enter" 
                v-model="newTip"
                @keyup.enter="newTip = addArrayItem(currentExercise.tips, newTip)"
              >
              <button 
                type="button" 
                class="btn btn-outline-success" 
                @click="newTip = addArrayItem(currentExercise.tips, newTip)"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
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
    
    <!-- Exercises Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading && !showForm" class="text-center my-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="exercises.length === 0" class="alert alert-info">
          No exercises found. Click "Add Exercise" to create one.
        </div>
        
        <table v-else class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Muscle Groups</th>
              <th>Duration/Reps</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exercise in exercises" :key="exercise.id">
              <td>
                <div class="d-flex align-items-center">
                  <img v-if="exercise.image" :src="exercise.image" alt="Image" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                  {{ exercise.name }}
                </div>
              </td>
              <td>{{ getLevelName(exercise.levelId) }}</td>
              <td>
                <span v-for="group in exercise.muscleGroups" :key="group" class="badge bg-info me-1">
                  {{ group }}
                </span>
              </td>
              <td>
                <span v-if="exercise.duration">{{ exercise.duration }}s</span>
                <span v-if="exercise.reps">{{ exercise.reps }} reps</span>
              </td>
              <td>{{ exercise.order }}</td>
              <td>
                <span :class="`badge ${exercise.isActive ? 'bg-success' : 'bg-danger'}`">
                  {{ exercise.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" @click="editExercise(exercise)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="toggleActive(exercise)">
                    <i :class="`fas fa-${exercise.isActive ? 'ban' : 'check'}`"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(exercise)">
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
.exercises-container {
  padding: 20px;
}
</style> 