<script>
import { ref, onMounted } from 'vue';
import { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory, toggleCategoryActive } from '@/firebase/categoryManager';
import { Category } from '@/models';

export default {
  name: 'AdminCategories',
  setup() {
    const categories = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const showForm = ref(false);
    const editMode = ref(false);
    const currentCategory = ref(new Category({}));

    // Form validation
    const formErrors = ref({});

    // Fetch all categories
    const fetchCategories = async () => {
      loading.value = true;
      error.value = null;
      try {
        categories.value = await getAllCategories();
      } catch (err) {
        console.error('Error fetching categories:', err);
        error.value = 'Failed to load categories. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Initialize component
    onMounted(fetchCategories);

    // Add new category
    const addCategory = () => {
      currentCategory.value = new Category({});
      showForm.value = true;
      editMode.value = false;
    };

    // Edit category
    const editCategory = (category) => {
      currentCategory.value = new Category({ ...category });
      showForm.value = true;
      editMode.value = true;
    };

    // Validate form
    const validateForm = () => {
      const errors = {};
      
      if (!currentCategory.value.name.trim()) {
        errors.name = 'Name is required';
      }
      
      formErrors.value = errors;
      return Object.keys(errors).length === 0;
    };

    // Save category
    const saveCategory = async () => {
      if (!validateForm()) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        if (editMode.value) {
          await updateCategory(currentCategory.value.id, currentCategory.value);
        } else {
          const categoryId = await createCategory(currentCategory.value);
          currentCategory.value.id = categoryId;
        }
        
        await fetchCategories();
        showForm.value = false;
      } catch (err) {
        console.error('Error saving category:', err);
        error.value = `Failed to ${editMode.value ? 'update' : 'create'} category. Please try again.`;
      } finally {
        loading.value = false;
      }
    };

    // Cancel form
    const cancelForm = () => {
      showForm.value = false;
      formErrors.value = {};
    };

    // Toggle category active state
    const toggleActive = async (category) => {
      loading.value = true;
      error.value = null;
      
      try {
        await toggleCategoryActive(category.id, !category.isActive);
        await fetchCategories();
      } catch (err) {
        console.error('Error toggling category active state:', err);
        error.value = 'Failed to update category status. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Delete category
    const confirmDelete = async (category) => {
      if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        await deleteCategory(category.id);
        await fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        error.value = 'Failed to delete category. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    return {
      categories,
      loading,
      error,
      showForm,
      editMode,
      currentCategory,
      formErrors,
      addCategory,
      editCategory,
      saveCategory,
      cancelForm,
      toggleActive,
      confirmDelete
    };
  }
};
</script>

<template>
  <div class="categories-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Categories</h1>
      <button class="btn btn-primary" @click="addCategory">
        <i class="fas fa-plus me-2"></i> Add Category
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    
    <!-- Category Form -->
    <div v-if="showForm" class="card mb-4">
      <div class="card-header">
        <h5>{{ editMode ? 'Edit Category' : 'Add New Category' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveCategory">
          <div class="mb-3">
            <label for="name" class="form-label">Name*</label>
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="currentCategory.name"
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
              v-model="currentCategory.description"
              rows="3"
            ></textarea>
          </div>
          
          <div class="mb-3">
            <label for="icon" class="form-label">Icon</label>
            <input
              type="text"
              class="form-control"
              id="icon"
              v-model="currentCategory.icon"
              placeholder="Icon class or URL"
            >
          </div>
          
          <div class="mb-3">
            <label for="order" class="form-label">Order</label>
            <input
              type="number"
              class="form-control"
              id="order"
              v-model="currentCategory.order"
              min="0"
            >
          </div>
          
          <div class="mb-3 form-check">
            <input
              type="checkbox"
              class="form-check-input"
              id="isActive"
              v-model="currentCategory.isActive"
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
    
    <!-- Categories Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading && !showForm" class="text-center my-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="categories.length === 0" class="alert alert-info">
          No categories found. Click "Add Category" to create one.
        </div>
        
        <table v-else class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id">
              <td>
                <div class="d-flex align-items-center">
                  <i v-if="category.icon" :class="category.icon" class="me-2"></i>
                  <img v-else-if="category.icon && category.icon.startsWith('http')" :src="category.icon" alt="Icon" class="me-2" style="width: 24px; height: 24px;">
                  {{ category.name }}
                </div>
              </td>
              <td>{{ category.description || '-' }}</td>
              <td>{{ category.order }}</td>
              <td>
                <span :class="`badge ${category.isActive ? 'bg-success' : 'bg-danger'}`">
                  {{ category.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" @click="editCategory(category)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="toggleActive(category)">
                    <i :class="`fas fa-${category.isActive ? 'ban' : 'check'}`"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(category)">
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
.categories-container {
  padding: 20px;
}
</style> 