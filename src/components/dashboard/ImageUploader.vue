<script>
import { ref, computed } from 'vue';
import { cloudinaryService } from '@/services/cloudinary';

export default {
  name: 'ImageUploader',
  props: {
    value: {
      type: String,
      default: ''
    },
    folder: {
      type: String,
      default: 'images'
    },
    maxSizeMB: {
      type: Number,
      default: 2 // 2MB default max size
    },
    aspectRatio: {
      type: Number,
      default: null // e.g., 1 for square, 16/9 for widescreen
    },
    acceptedTypes: {
      type: String,
      default: 'image/jpeg,image/png,image/gif'
    },
    buttonLabel: {
      type: String,
      default: 'Upload Image'
    },
    placeholder: {
      type: String,
      default: 'Click or drag image to upload'
    }
  },
  emits: ['update:value', 'upload-success', 'upload-error', 'upload-start'],
  setup(props, { emit }) {
    const imageUrl = ref(props.value);
    const isUploading = ref(false);
    const uploadProgress = ref(0);
    const errorMessage = ref('');
    const fileInput = ref(null);
    const dragActive = ref(false);

    // Maximum file size in bytes
    const maxSizeBytes = computed(() => props.maxSizeMB * 1024 * 1024);

    // For preview of image before upload
    const previewUrl = ref(null);

    /**
     * Trigger file input click
     */
    const triggerFileInput = () => {
      fileInput.value.click();
    };

    /**
     * Handle file selection
     */
    const handleFileSelected = (event) => {
      const file = event.target.files[0];
      if (file) {
        validateAndProcessFile(file);
      }
    };

    /**
     * Handle drag events
     */
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragActive.value = true;
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragActive.value = false;
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragActive.value = false;
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateAndProcessFile(e.dataTransfer.files[0]);
      }
    };

    /**
     * Validate and process the selected file
     */
    const validateAndProcessFile = (file) => {
      errorMessage.value = '';

      // Validate file type
      if (!file.type.match(props.acceptedTypes.replace(/,/g, '|'))) {
        errorMessage.value = 'Invalid file type. Please upload a valid image.';
        return;
      }

      // Validate file size
      if (file.size > maxSizeBytes.value) {
        errorMessage.value = `File too large. Maximum size is ${props.maxSizeMB}MB.`;
        return;
      }

      // Create object URL for preview
      previewUrl.value = URL.createObjectURL(file);
      
      // Upload the file
      uploadImage(file);
    };

    /**
     * Upload image to Cloudinary
     */
    const uploadImage = async (file) => {
      try {
        isUploading.value = true;
        uploadProgress.value = 10; // Start progress
        emit('upload-start');

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += Math.floor(Math.random() * 10);
          }
        }, 300);

        // Upload with Cloudinary service
        const response = await cloudinaryService.uploadImage(file, {
          folder: props.folder
        });
        
        clearInterval(progressInterval);
        
        if (response.success) {
          uploadProgress.value = 100;
          imageUrl.value = response.url;
          emit('update:value', response.url);
          emit('upload-success', {
            url: response.url,
            publicId: response.data.public_id,
            data: response.data
          });
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      } catch (error) {
        errorMessage.value = error.message || 'Failed to upload image';
        emit('upload-error', errorMessage.value);
      } finally {
        isUploading.value = false;
        if (previewUrl.value) {
          URL.revokeObjectURL(previewUrl.value);
          previewUrl.value = null;
        }
      }
    };

    /**
     * Reset the uploader
     */
    const resetUpload = () => {
      imageUrl.value = '';
      previewUrl.value = null;
      errorMessage.value = '';
      uploadProgress.value = 0;
      
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      
      emit('update:value', '');
    };

    return {
      imageUrl,
      isUploading,
      uploadProgress,
      errorMessage,
      fileInput,
      dragActive,
      previewUrl,
      triggerFileInput,
      handleFileSelected,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      resetUpload
    };
  }
};
</script>

<template>
  <div class="image-uploader">
    <!-- Current Image Preview (if exists) -->
    <div v-if="imageUrl && !isUploading" class="current-image-container">
      <img :src="imageUrl" alt="Uploaded Image" class="current-image" />
      <div class="image-actions">
        <button type="button" class="btn btn-danger btn-sm" @click="resetUpload">
          <i class="fa fa-trash"></i> Remove
        </button>
      </div>
    </div>

    <!-- Upload Zone -->
    <div
      v-else
      :class="['upload-zone', { 'drag-active': dragActive, 'is-uploading': isUploading }]"
      @click="triggerFileInput"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <!-- Preview during upload -->
      <div v-if="previewUrl" class="preview-container">
        <img :src="previewUrl" alt="Preview" class="preview-image" />
      </div>

      <!-- Status and instructions -->
      <div class="upload-content">
        <div v-if="isUploading" class="upload-progress">
          <div class="progress">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <div class="progress-text">Uploading... {{ uploadProgress }}%</div>
        </div>
        
        <div v-else class="upload-instructions">
          <i class="fa fa-cloud-upload-alt upload-icon"></i>
          <div class="upload-text">{{ placeholder }}</div>
          <button type="button" class="btn btn-primary btn-sm mt-2">
            {{ buttonLabel }}
          </button>
        </div>
      </div>

      <!-- Error message if any -->
      <div v-if="errorMessage" class="upload-error alert alert-danger">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      class="file-input"
      :accept="acceptedTypes"
      @change="handleFileSelected"
    />
  </div>
</template>

<style scoped>
.image-uploader {
  width: 100%;
  margin-bottom: 20px;
}

.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover {
  border-color: #6c757d;
  background-color: #f1f3f5;
}

.drag-active {
  border-color: #556ee6;
  background-color: rgba(85, 110, 230, 0.05);
}

.upload-icon {
  font-size: 48px;
  color: #6c757d;
  margin-bottom: 15px;
}

.upload-text {
  color: #6c757d;
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.upload-progress {
  width: 80%;
}

.progress {
  height: 10px;
  margin-bottom: 10px;
}

.progress-text {
  font-size: 14px;
  color: #6c757d;
}

.upload-error {
  margin-top: 15px;
  font-size: 14px;
  width: 100%;
}

.current-image-container {
  position: relative;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.current-image {
  width: 100%;
  display: block;
}

.image-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px;
  border-radius: 4px;
}

.preview-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.upload-content {
  z-index: 2;
  position: relative;
}

.is-uploading {
  pointer-events: none;
}
</style> 