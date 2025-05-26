<script>
import ImageUploader from '@/components/dashboard/ImageUploader.vue';
import { ref, onMounted } from 'vue';
import { db } from '@/firebase/config';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { cloudinaryService } from '@/services/cloudinary';

export default {
  components: {
    ImageUploader
  },
  setup() {
    const images = ref([]);
    const imageUrl = ref('');
    const selectedFolder = ref('general');
    const loading = ref(false);
    const uploadStatus = ref('');
    const selectedImages = ref([]);
    const showGifModal = ref(false);
    const gifFrameDelay = ref('500');

    // GIF Creation states
    const showGifCreator = ref(false);
    const firstImageUrl = ref('');
    const secondImageUrl = ref('');
    const firstImageId = ref('');
    const secondImageId = ref('');
    const gifName = ref('');
    const creatingGif = ref(false);
    const gifCreationStatus = ref('');
    const frameDelay = ref(500); // Default frame delay in milliseconds
    
    const folders = [
      { id: 'general', name: 'General' },
      { id: 'users', name: 'User Profiles' },
      { id: 'exercises', name: 'Exercise Images' },
      { id: 'workouts', name: 'Workout Plans' }
    ];

    // Load images from Firestore
    const fetchImages = async () => {
      try {
        loading.value = true;
        const imagesCollection = collection(db, 'images');
        const q = query(imagesCollection, orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const imageList = [];
        querySnapshot.forEach((doc) => {
          imageList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        images.value = imageList;
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        loading.value = false;
      }
    };

    // Handle successful upload
    const handleUploadSuccess = async (imageData) => {
      try {
        uploadStatus.value = 'Creating record in Firestore...';
        
        // Save image metadata to Firestore
        await addDoc(collection(db, 'images'), {
          url: imageData.url,
          public_id: imageData.publicId,
          folder: selectedFolder.value,
          created_at: new Date(),
          metadata: imageData.data
        });

        uploadStatus.value = 'Image uploaded successfully!';
        imageUrl.value = '';
        
        // Refresh the image list
        fetchImages();
      } catch (error) {
        console.error('Error saving image metadata:', error);
        uploadStatus.value = 'Error saving image metadata';
      }
    };

    // Handle upload error
    const handleUploadError = (error) => {
      uploadStatus.value = `Upload error: ${error}`;
    };

    // Delete an image
    const deleteImage = async (image) => {
      if (!confirm('Are you sure you want to delete this image?')) return;
      
      try {
        loading.value = true;
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'images', image.id));
        
        // Remove from local state
        images.value = images.value.filter(img => img.id !== image.id);
        
        // NOTE: This doesn't delete from Cloudinary! 
        // For production, implement server-side deletion
        alert('Image deleted from database. For production, implement Cloudinary deletion through a secure backend.');
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error deleting image: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    // Copy image URL to clipboard
    const copyToClipboard = (url) => {
      navigator.clipboard.writeText(url)
        .then(() => {
          alert('Image URL copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy URL:', err);
        });
    };
    
    // Toggle image selection for GIF creation
    const toggleImageSelection = (image) => {
      const index = selectedImages.value.findIndex(img => img.id === image.id);
      if (index !== -1) {
        selectedImages.value.splice(index, 1);
      } else {
        // Limit to 2 images for GIF creation
        if (selectedImages.value.length < 2) {
          selectedImages.value.push(image);
        } else {
          // Replace the first selected image if already have 2
          selectedImages.value.shift();
          selectedImages.value.push(image);
        }
      }
    };

    // Check if image is selected
    const isImageSelected = (image) => {
      return selectedImages.value.some(img => img.id === image.id);
    };

    // Open GIF creation modal
    const openGifModal = () => {
      if (selectedImages.value.length !== 2) {
        alert('Please select exactly 2 images to create a GIF');
        return;
      }
      
      showGifModal.value = true;
    };

    // Create animated GIF from selected images
    const createAnimatedGif = async () => {
      if (selectedImages.value.length !== 2) {
        uploadStatus.value = 'Please select exactly 2 images to create a GIF';
        return;
      }
      
      try {
        loading.value = true;
        uploadStatus.value = 'Creating animated GIF...';
        
        console.log('Selected images for GIF:', selectedImages.value);
        
        const [firstImage, secondImage] = selectedImages.value;
        
        // Use the original URL directly from the image - let the cloudinary service handle extraction
        const firstImageUrl = firstImage.url;
        const secondImageUrl = secondImage.url;
        
        console.log('Using image URLs for GIF creation:', { firstImageUrl, secondImageUrl });
        
        // Create GIF with cloudinary service
        const result = await cloudinaryService.uploadAnimatedGif(
          firstImageUrl, 
          secondImageUrl, 
          {
            frameDelay: parseInt(gifFrameDelay.value),
            folder: 'animated_gifs',
            public_id: `animated_${Date.now()}`
          }
        );
        
        if (result.success) {
          uploadStatus.value = 'GIF created successfully!';
          
          // Save GIF metadata to Firestore
          await addDoc(collection(db, 'images'), {
            url: result.url,
            public_id: result.data.public_id,
            folder: 'animated_gifs',
            created_at: new Date(),
            metadata: {
              ...result.data,
              isGif: true,
              sourceImages: selectedImages.value.map(img => img.id)
            }
          });
          
          // Reset selections
          selectedImages.value = [];
          showGifModal.value = false;
          
          // Refresh the image list
          fetchImages();
        } else {
          throw new Error(result.error || 'Failed to create GIF');
        }
      } catch (error) {
        console.error('Error creating GIF:', error);
        uploadStatus.value = `Error creating GIF: ${error.message}`;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchImages();
    });

    return {
      images,
      imageUrl,
      selectedFolder,
      folders,
      loading,
      uploadStatus,
      handleUploadSuccess,
      handleUploadError,
      deleteImage,
      copyToClipboard,
      selectedImages,
      toggleImageSelection,
      isImageSelected,
      showGifModal,
      gifFrameDelay,
      openGifModal,
      createAnimatedGif
    };
  }
};
</script>

<template>
  <!-- GIF Creator Modal -->
  <div v-if="showGifModal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
    <div class="card" style="width: 600px; max-width: 95%;">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Create Animated GIF</h5>
        <button type="button" class="btn-close" @click="showGifModal = false"></button>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Selected Images (2/2)</label>
          <div class="d-flex gap-2">
            <div v-for="image in selectedImages" :key="image.id" class="position-relative" style="width: 100px; height: 100px;">
              <img :src="image.url" class="img-thumbnail" style="width: 100%; height: 100%; object-fit: cover;" />
              <button 
                @click="toggleImageSelection(image)" 
                class="btn btn-sm btn-danger position-absolute" 
                style="top: 0; right: 0; padding: 2px 5px;"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Frame Delay (milliseconds)</label>
          <input 
            type="range" 
            class="form-range" 
            min="100" 
            max="1000" 
            step="100" 
            v-model="gifFrameDelay" 
          />
          <div class="d-flex justify-content-between">
            <small>Fast (100ms)</small>
            <small>{{ gifFrameDelay }}ms</small>
            <small>Slow (1000ms)</small>
          </div>
        </div>
        
        <div class="d-flex justify-content-between">
          <div>
            <button 
              class="btn btn-primary" 
              @click="createAnimatedGif()" 
              :disabled="selectedImages.length !== 2 || loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Create GIF
            </button>
            <button class="btn btn-secondary ms-2" @click="showGifModal = false">Cancel</button>
          </div>
          <div v-if="uploadStatus" class="text-success">{{ uploadStatus }}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="content-container">
    <h1 class="page-title">Image Manager</h1>
    
    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title mb-4">Upload New Image</h4>
            
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" v-model="selectedFolder">
                    <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                      {{ folder.name }}
                    </option>
                  </select>
                </div>
                
                <ImageUploader
                  v-model:value="imageUrl"
                  :folder="selectedFolder"
                  placeholder="Click or drag to upload image"
                  buttonLabel="Choose Image"
                  @upload-success="handleUploadSuccess"
                  @upload-error="handleUploadError"
                />
                
                <div v-if="uploadStatus" class="alert alert-info mt-3">
                  {{ uploadStatus }}
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="upload-guidelines">
                  <h5>Upload Guidelines</h5>
                  <ul>
                    <li>Maximum file size: 2MB</li>
                    <li>Supported formats: JPG, PNG, GIF</li>
                    <li>For best results, use images with a clear background</li>
                    <li>Images will be optimized automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-lg-12 d-flex justify-content-end">
        <button class="btn btn-primary me-2" @click="openGifModal" :disabled="selectedImages.length !== 2">
          <i class="fas fa-film me-2"></i> Create Animated GIF 
          <span v-if="selectedImages.length > 0" class="badge bg-light text-dark ms-1">{{ selectedImages.length }}/2</span>
        </button>
      </div>
    </div>
    
    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title mb-4">Image Library</h4>
            
            <div class="row mb-3">
              <div class="col-md-4">
                <select class="form-select" v-model="selectedFolder">
                  <option value="">All Categories</option>
                  <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                    {{ folder.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <!-- Loading spinner -->
            <div v-if="loading" class="text-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            
            <!-- Image grid -->
            <div v-else class="row image-grid">
              <div v-if="images.length === 0" class="col-12 text-center py-5">
                <p>No images found. Upload your first image!</p>
              </div>
              
              <div 
                v-for="image in images.filter(img => !selectedFolder || img.folder === selectedFolder)" 
                :key="image.id" 
                class="col-md-3"
              >
                <div class="image-card" :class="{ 'selected-for-gif': isImageSelected(image) }">
                  <div class="image-preview">
                    <img :src="image.url" alt="Uploaded image" />
                    <div v-if="image.metadata?.isGif" class="gif-badge">GIF</div>
                  </div>
                  <div class="image-info">
                    <small class="text-muted">Uploaded: {{ new Date(image.created_at.seconds * 1000).toLocaleDateString() }}</small>
                    <div class="folder-tag">{{ folders.find(f => f.id === image.folder)?.name || 'Unknown' }}</div>
                  </div>
                  <div class="image-actions">
                    <button class="btn btn-sm btn-info" @click="copyToClipboard(image.url)" title="Copy URL">
                      <i class="fa fa-copy"></i>
                    </button>
                    <button 
                      class="btn btn-sm btn-primary" 
                      @click="toggleImageSelection(image)" 
                      title="Toggle selection for GIF"
                    >
                      <i class="fa" :class="isImageSelected(image) ? 'fa-check-circle' : 'fa-circle'"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" @click="deleteImage(image)" title="Delete">
                      <i class="fa fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.upload-guidelines {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
}

.image-grid {
  margin-top: 20px;
}

.image-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  margin-bottom: 20px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.image-card.selected-for-gif {
  box-shadow: 0 0 0 3px #0d6efd, 0 1px 5px rgba(0, 0, 0, 0.3);
  transform: scale(1.02);
}

.image-preview {
  height: 180px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.image-preview img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.gif-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #17a2b8;
  color: white;
  border-radius: 3px;
  padding: 2px 6px;
  font-weight: bold;
  font-size: 12px;
}

.image-info {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.folder-tag {
  background-color: #e9ecef;
  border-radius: 3px;
  color: #495057;
  font-size: 0.75rem;
  padding: 2px 6px;
}

.image-actions {
  background-color: rgba(0, 0, 0, 0.03);
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  padding: 8px;
}

/* GIF Creator styles */
.image-select-card {
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  height: 100px;
  position: relative;
}

.image-select-card img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.selected-image-1 {
  border-color: #0d6efd;
}

.selected-image-2 {
  border-color: #17a2b8;
}

.image-select-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px;
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-select-card:hover .image-select-actions {
  opacity: 1;
}

.modal-backdrop {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style> 