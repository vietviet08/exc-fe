<script setup>
import { ref, onMounted } from 'vue';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';

// State
const categories = ref([]);
const loading = ref(true);
const error = ref(null);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentCategory = ref({ name: '', description: '', icon_url: '', color: '#007bff', sort_order: 0, is_active: true });
const selectedCategory = ref(null);
const selectedFile = ref(null);
const filePreview = ref(null);
const processing = ref(false);

// Fetch all categories
const fetchCategories = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const categoriesQuery = query(collection(db, 'main_categories'), orderBy('sort_order', 'asc'));
    const snapshot = await getDocs(categoriesQuery);
    categories.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('Error fetching categories:', err);
    error.value = 'Failed to load categories';
  } finally {
    loading.value = false;
  }
};

// Handle file selection
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  selectedFile.value = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    filePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Upload icon file
const uploadIcon = async (file, categoryId) => {
  if (!file) return null;
  
  const iconRef = storageRef(storage, `main_categories/${categoryId}/${file.name}`);
  await uploadBytes(iconRef, file);
  return await getDownloadURL(iconRef);
};

// Add new category
const addCategory = async () => {
  processing.value = true;
  
  try {
    // Add document first to get ID
    const newCategoryRef = await addDoc(collection(db, 'main_categories'), {
      name: currentCategory.value.name,
      name_en: currentCategory.value.name, // Default to same as name
      description: currentCategory.value.description,
      color: currentCategory.value.color,
      sort_order: currentCategory.value.sort_order,
      is_active: currentCategory.value.is_active,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    // Upload icon if selected
    if (selectedFile.value) {
      const iconUrl = await uploadIcon(selectedFile.value, newCategoryRef.id);
      // Update document with icon URL
      await updateDoc(doc(db, 'main_categories', newCategoryRef.id), {
        icon_url: iconUrl
      });
    }
    
    // Refresh categories
    await fetchCategories();
    showAddModal.value = false;
    resetForm();
  } catch (err) {
    console.error('Error adding category:', err);
    error.value = 'Failed to add category';
  } finally {
    processing.value = false;
  }
};

// Edit category
const editCategory = (category) => {
  selectedCategory.value = category;
  currentCategory.value = { ...category };
  filePreview.value = category.icon_url || null;
  showEditModal.value = true;
};

// Update category
const updateCategory = async () => {
  processing.value = true;
  
  try {
    const categoryRef = doc(db, 'main_categories', selectedCategory.value.id);
    
    // Upload new icon if selected
    if (selectedFile.value) {
      // Delete old icon if exists
      if (selectedCategory.value.icon_url) {
        try {
          const oldIconRef = storageRef(storage, selectedCategory.value.icon_url);
          await deleteObject(oldIconRef);
        } catch (err) {
          console.error('Error deleting old icon:', err);
          // Continue with update even if deletion fails
        }
      }
      
      // Upload new icon
      const iconUrl = await uploadIcon(selectedFile.value, selectedCategory.value.id);
      currentCategory.value.icon_url = iconUrl;
    }
    
    // Update document
    await updateDoc(categoryRef, {
      name: currentCategory.value.name,
      name_en: currentCategory.value.name_en || currentCategory.value.name,
      description: currentCategory.value.description,
      icon_url: currentCategory.value.icon_url,
      color: currentCategory.value.color,
      sort_order: currentCategory.value.sort_order,
      is_active: currentCategory.value.is_active,
      updated_at: serverTimestamp()
    });
    
    // Refresh categories
    await fetchCategories();
    showEditModal.value = false;
    resetForm();
  } catch (err) {
    console.error('Error updating category:', err);
    error.value = 'Failed to update category';
  } finally {
    processing.value = false;
  }
};

// Confirm delete
const confirmDelete = (category) => {
  selectedCategory.value = category;
  showDeleteModal.value = true;
};

// Delete category
const deleteCategory = async () => {
  processing.value = true;
  
  try {
    // Delete icon if exists
    if (selectedCategory.value.icon_url) {
      try {
        const iconRef = storageRef(storage, selectedCategory.value.icon_url);
        await deleteObject(iconRef);
      } catch (err) {
        console.error('Error deleting icon:', err);
        // Continue with deletion even if icon deletion fails
      }
    }
    
    // Delete document
    await deleteDoc(doc(db, 'main_categories', selectedCategory.value.id));
    
    // Refresh categories
    await fetchCategories();
    showDeleteModal.value = false;
    selectedCategory.value = null;
  } catch (err) {
    console.error('Error deleting category:', err);
    error.value = 'Failed to delete category';
  } finally {
    processing.value = false;
  }
};

// Reset form
const resetForm = () => {
  currentCategory.value = { name: '', description: '', icon_url: '', color: '#007bff', sort_order: 0, is_active: true };
  selectedFile.value = null;
  filePreview.value = null;
};

// Show add modal
const openAddModal = () => {
  resetForm();
  showAddModal.value = true;
};

// Load categories on mount
onMounted(fetchCategories);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Main Categories</h2>
      <button class="btn btn-primary" @click="openAddModal">
        <i class="bi bi-plus-circle me-1"></i> Add Category
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
    
    <!-- Categories Table -->
    <div v-else class="card">
      <div class="card-body">
        <div v-if="categories.length === 0" class="text-center my-4">
          <p>No categories found. Click "Add Category" to create one.</p>
        </div>
        
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Description</th>
                <th>Color</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td>
                  <img 
                    v-if="category.icon_url" 
                    :src="category.icon_url" 
                    alt="Icon" 
                    class="img-thumbnail" 
                    style="width: 40px; height: 40px; object-fit: contain;"
                  />
                  <span v-else class="badge bg-secondary">No Icon</span>
                </td>
                <td>{{ category.name }}</td>
                <td>{{ category.description }}</td>
                <td>
                  <span 
                    class="color-swatch" 
                    :style="{ backgroundColor: category.color }"
                  ></span>
                </td>
                <td>{{ category.sort_order }}</td>
                <td>
                  <span 
                    class="badge"
                    :class="category.is_active ? 'bg-success' : 'bg-danger'"
                  >
                    {{ category.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <button 
                      class="btn btn-sm btn-outline-primary" 
                      @click="editCategory(category)"
                      title="Edit"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                      class="btn btn-sm btn-outline-danger" 
                      @click="confirmDelete(category)"
                      title="Delete"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Add Category Modal -->
    <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Category</h5>
            <button type="button" class="btn-close" @click="showAddModal = false" :disabled="processing"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addCategory">
              <div class="mb-3">
                <label for="name" class="form-label">Name *</label>
                <input 
                  v-model="currentCategory.name" 
                  type="text" 
                  class="form-control" 
                  id="name" 
                  required
                />
              </div>
              
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea 
                  v-model="currentCategory.description" 
                  class="form-control" 
                  id="description" 
                  rows="3"
                ></textarea>
              </div>
              
              <div class="mb-3">
                <label for="icon" class="form-label">Icon</label>
                <input 
                  type="file" 
                  class="form-control" 
                  id="icon" 
                  accept="image/*" 
                  @change="handleFileChange"
                />
                <div v-if="filePreview" class="mt-2">
                  <img 
                    :src="filePreview" 
                    alt="Preview" 
                    class="img-thumbnail" 
                    style="max-height: 100px;"
                  />
                </div>
              </div>
              
              <div class="mb-3">
                <label for="color" class="form-label">Color</label>
                <input 
                  v-model="currentCategory.color" 
                  type="color" 
                  class="form-control form-control-color" 
                  id="color" 
                  title="Choose color"
                />
              </div>
              
              <div class="mb-3">
                <label for="sort_order" class="form-label">Sort Order</label>
                <input 
                  v-model.number="currentCategory.sort_order" 
                  type="number" 
                  class="form-control" 
                  id="sort_order"
                />
              </div>
              
              <div class="mb-3 form-check">
                <input 
                  v-model="currentCategory.is_active" 
                  type="checkbox" 
                  class="form-check-input" 
                  id="is_active"
                />
                <label class="form-check-label" for="is_active">Active</label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddModal = false" :disabled="processing">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addCategory" :disabled="processing">
              <span v-if="processing" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Edit Category Modal -->
    <div class="modal fade" :class="{ 'show d-block': showEditModal }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Category</h5>
            <button type="button" class="btn-close" @click="showEditModal = false" :disabled="processing"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateCategory">
              <div class="mb-3">
                <label for="edit-name" class="form-label">Name *</label>
                <input 
                  v-model="currentCategory.name" 
                  type="text" 
                  class="form-control" 
                  id="edit-name" 
                  required
                />
              </div>
              
              <div class="mb-3">
                <label for="edit-description" class="form-label">Description</label>
                <textarea 
                  v-model="currentCategory.description" 
                  class="form-control" 
                  id="edit-description" 
                  rows="3"
                ></textarea>
              </div>
              
              <div class="mb-3">
                <label for="edit-icon" class="form-label">Icon</label>
                <input 
                  type="file" 
                  class="form-control" 
                  id="edit-icon" 
                  accept="image/*" 
                  @change="handleFileChange"
                />
                <div v-if="filePreview" class="mt-2">
                  <img 
                    :src="filePreview" 
                    alt="Preview" 
                    class="img-thumbnail" 
                    style="max-height: 100px;"
                  />
                </div>
              </div>
              
              <div class="mb-3">
                <label for="edit-color" class="form-label">Color</label>
                <input 
                  v-model="currentCategory.color" 
                  type="color" 
                  class="form-control form-control-color" 
                  id="edit-color" 
                  title="Choose color"
                />
              </div>
              
              <div class="mb-3">
                <label for="edit-sort_order" class="form-label">Sort Order</label>
                <input 
                  v-model.number="currentCategory.sort_order" 
                  type="number" 
                  class="form-control" 
                  id="edit-sort_order"
                />
              </div>
              
              <div class="mb-3 form-check">
                <input 
                  v-model="currentCategory.is_active" 
                  type="checkbox" 
                  class="form-check-input" 
                  id="edit-is_active"
                />
                <label class="form-check-label" for="edit-is_active">Active</label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false" :disabled="processing">Cancel</button>
            <button type="button" class="btn btn-primary" @click="updateCategory" :disabled="processing">
              <span v-if="processing" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false" :disabled="processing"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete the category <strong>{{ selectedCategory?.name }}</strong>?</p>
            <p class="text-danger">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false" :disabled="processing">Cancel</button>
            <button type="button" class="btn btn-danger" @click="deleteCategory" :disabled="processing">
              <span v-if="processing" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Backdrop -->
    <div 
      v-if="showAddModal || showEditModal || showDeleteModal" 
      class="modal-backdrop fade show"
      @click="() => { if (!processing) { showAddModal = false; showEditModal = false; showDeleteModal = false; } }"
    ></div>
  </div>
</template>

<style scoped>
.color-swatch {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #ced4da;
}

.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style> 