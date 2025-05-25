<script>
import ImageUploader from '@/components/dashboard/ImageUploader.vue';
import { ref, onMounted } from 'vue';
import { db } from '@/firebase/config';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
      copyToClipboard
    };
  }
};
</script>

<template>
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
                <div class="image-card">
                  <div class="image-preview">
                    <img :src="image.url" alt="Uploaded image" />
                  </div>
                  <div class="image-info">
                    <small class="text-muted">Uploaded: {{ new Date(image.created_at.seconds * 1000).toLocaleDateString() }}</small>
                    <div class="folder-tag">{{ folders.find(f => f.id === image.folder)?.name || 'Unknown' }}</div>
                  </div>
                  <div class="image-actions">
                    <button class="btn btn-sm btn-info" @click="copyToClipboard(image.url)" title="Copy URL">
                      <i class="fa fa-copy"></i>
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
</style> 