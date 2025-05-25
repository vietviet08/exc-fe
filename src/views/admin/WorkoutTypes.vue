<script>
import { ref, onMounted } from 'vue';
import { getAllWorkoutTypes, getWorkoutTypesByCategory, createWorkoutType, updateWorkoutType, deleteWorkoutType, toggleWorkoutTypeActive } from '@/firebase/workoutTypeManager';
import { getAllCategories } from '@/firebase/categoryManager';
import { WorkoutType } from '@/models';

export default {
  name: 'AdminWorkoutTypes',
  setup() {
    const workoutTypes = ref([]);
    const categories = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const showForm = ref(false);
    const editMode = ref(false);
    const currentWorkoutType = ref(new WorkoutType({}));
    const selectedCategoryId = ref('');

    // Form validation
    const formErrors = ref({});

    // Fetch all workout types
    const fetchWorkoutTypes = async () => {
      loading.value = true;
      error.value = null;
      try {
        if (selectedCategoryId.value) {
          workoutTypes.value = await getWorkoutTypesByCategory(selectedCategoryId.value);
        } else {
          workoutTypes.value = await getAllWorkoutTypes();
        }
      } catch (err) {
        console.error('Error fetching workout types:', err);
        error.value = 'Failed to load workout types. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Fetch all categories
    const fetchCategories = async () => {
      try {
        categories.value = await getAllCategories(true); // Only active categories
      } catch (err) {
        console.error('Error fetching categories:', err);
        error.value = 'Failed to load categories. Please try again.';
      }
    };

    // Initialize component
    onMounted(async () => {
      await fetchCategories();
      await fetchWorkoutTypes();
    });

    // Filter by category
    const filterByCategory = async () => {
      await fetchWorkoutTypes();
    };

    // Add new workout type
    const addWorkoutType = () => {
      currentWorkoutType.value = new WorkoutType({
        categoryId: selectedCategoryId.value || ''
      });
      showForm.value = true;
      editMode.value = false;
    };

    // Edit workout type
    const editWorkoutType = (workoutType) => {
      currentWorkoutType.value = new WorkoutType({ ...workoutType });
      showForm.value = true;
      editMode.value = true;
    };

    // Validate form
    const validateForm = () => {
      const errors = {};
      
      if (!currentWorkoutType.value.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!currentWorkoutType.value.categoryId) {
        errors.categoryId = 'Category is required';
      }
      
      formErrors.value = errors;
      return Object.keys(errors).length === 0;
    };

    // Save workout type
    const saveWorkoutType = async () => {
      if (!validateForm()) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        if (editMode.value) {
          await updateWorkoutType(currentWorkoutType.value.id, currentWorkoutType.value);
        } else {
          const workoutTypeId = await createWorkoutType(currentWorkoutType.value);
          currentWorkoutType.value.id = workoutTypeId;
        }
        
        await fetchWorkoutTypes();
        showForm.value = false;
      } catch (err) {
        console.error('Error saving workout type:', err);
        error.value = `Failed to ${editMode.value ? 'update' : 'create'} workout type. Please try again.`;
      } finally {
        loading.value = false;
      }
    };

    // Cancel form
    const cancelForm = () => {
      showForm.value = false;
      formErrors.value = {};
    };

    // Toggle workout type active state
    const toggleActive = async (workoutType) => {
      loading.value = true;
      error.value = null;
      
      try {
        await toggleWorkoutTypeActive(workoutType.id, !workoutType.isActive);
        await fetchWorkoutTypes();
      } catch (err) {
        console.error('Error toggling workout type active state:', err);
        error.value = 'Failed to update workout type status. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Delete workout type
    const confirmDelete = async (workoutType) => {
      if (!confirm(`Are you sure you want to delete "${workoutType.name}"?`)) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        await deleteWorkoutType(workoutType.id);
        await fetchWorkoutTypes();
      } catch (err) {
        console.error('Error deleting workout type:', err);
        error.value = 'Failed to delete workout type. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Get category name by ID
    const getCategoryName = (categoryId) => {
      const category = categories.value.find(c => c.id === categoryId);
      return category ? category.name : 'Unknown';
    };

    return {
      workoutTypes,
      categories,
      loading,
      error,
      showForm,
      editMode,
      currentWorkoutType,
      selectedCategoryId,
      formErrors,
      addWorkoutType,
      editWorkoutType,
      saveWorkoutType,
      cancelForm,
      toggleActive,
      confirmDelete,
      filterByCategory,
      getCategoryName
    };
  }
};
</script>

<template>
  <div class="workout-types-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Workout Types</h1>
      <button class="btn btn-primary" @click="addWorkoutType">
        <i class="fas fa-plus me-2"></i> Add Workout Type
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <!-- Filter by Category -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4">
            <label for="categoryFilter" class="form-label">Filter by Category</label>
            <select 
              id="categoryFilter" 
              class="form-select" 
              v-model="selectedCategoryId"
              @change="filterByCategory"
            >
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Workout Type Form -->
    <div v-if="showForm" class="card mb-4">
      <div class="card-header">
        <h5>{{ editMode ? 'Edit Workout Type' : 'Add New Workout Type' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveWorkoutType">
          <div class="mb-3">
            <label for="categoryId" class="form-label">Category*</label>
            <select
              id="categoryId"
              class="form-select"
              v-model="currentWorkoutType.categoryId"
              :class="{ 'is-invalid': formErrors.categoryId }"
            >
              <option value="">Select Category</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <div v-if="formErrors.categoryId" class="invalid-feedback">
              {{ formErrors.categoryId }}
            </div>
          </div>
          
          <div class="mb-3">
            <label for="name" class="form-label">Name*</label>
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="currentWorkoutType.name"
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
              v-model="currentWorkoutType.description"
              rows="3"
            ></textarea>
          </div>
          
          <div class="mb-3">
            <label for="equipment" class="form-label">Equipment</label>
            <input
              type="text"
              class="form-control"
              id="equipment"
              v-model="currentWorkoutType.equipment"
            >
          </div>
          
          <div class="mb-3">
            <label for="duration" class="form-label">Duration</label>
            <input
              type="text"
              class="form-control"
              id="duration"
              v-model="currentWorkoutType.duration"
              placeholder="e.g. 30 min, 1 hour"
            >
          </div>
          
          <div class="mb-3">
            <label for="difficulty" class="form-label">Difficulty</label>
            <select
              id="difficulty"
              class="form-select"
              v-model="currentWorkoutType.difficulty"
            >
              <option value="">Select Difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label for="image" class="form-label">Image URL</label>
            <input
              type="text"
              class="form-control"
              id="image"
              v-model="currentWorkoutType.image"
            >
          </div>
          
          <div class="mb-3">
            <label for="order" class="form-label">Order</label>
            <input
              type="number"
              class="form-control"
              id="order"
              v-model="currentWorkoutType.order"
              min="0"
            >
          </div>
          
          <div class="mb-3 form-check">
            <input
              type="checkbox"
              class="form-check-input"
              id="isActive"
              v-model="currentWorkoutType.isActive"
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
    
    <!-- Workout Types Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading && !showForm" class="text-center my-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="workoutTypes.length === 0" class="alert alert-info">
          No workout types found. Click "Add Workout Type" to create one.
        </div>
        
        <table v-else class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Duration</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="workoutType in workoutTypes" :key="workoutType.id">
              <td>
                <div class="d-flex align-items-center">
                  <img v-if="workoutType.image" :src="workoutType.image" alt="Image" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                  {{ workoutType.name }}
                </div>
              </td>
              <td>{{ getCategoryName(workoutType.categoryId) }}</td>
              <td>{{ workoutType.difficulty || '-' }}</td>
              <td>{{ workoutType.duration || '-' }}</td>
              <td>{{ workoutType.order }}</td>
              <td>
                <span :class="`badge ${workoutType.isActive ? 'bg-success' : 'bg-danger'}`">
                  {{ workoutType.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" @click="editWorkoutType(workoutType)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="toggleActive(workoutType)">
                    <i :class="`fas fa-${workoutType.isActive ? 'ban' : 'check'}`"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(workoutType)">
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
.workout-types-container {
  padding: 20px;
}
</style> 