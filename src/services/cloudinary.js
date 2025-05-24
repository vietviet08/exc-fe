import axios from 'axios';

// Cloudinary configuration
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/";
// Replace with your actual cloud name
const CLOUD_NAME = "dphvpkczy"
// Replace with your upload preset (create an unsigned upload preset in your Cloudinary dashboard)
const UPLOAD_PRESET = "exc-app"

/**
 * Service to handle Cloudinary image uploads
 */
export const cloudinaryService = {
  /**
   * Upload a file to Cloudinary
   * 
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options (folder, tags, etc)
   * @returns {Promise} - The upload response with image details
   */
  async uploadImage(file, options = {}) {
    try {
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      
      // Add any additional options as needed
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.tags && Array.isArray(options.tags)) {
        formData.append('tags', options.tags.join(','));
      }

      // Add public ID if provided
      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }

      // Make the upload request to Cloudinary
      const response = await axios.post(
        `${CLOUDINARY_URL}${CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        url: response.data.secure_url
      };
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  },

  /**
   * Delete an image from Cloudinary 
   * Note: Requires server-side API for security (this is a simplified version)
   * In production, image deletion should be handled via backend
   * 
   * @param {String} publicId - The public ID of the image to delete
   * @returns {Promise}
   */
  async deleteImage(publicId) {
    // In a real app, you'd call your backend API that handles secure deletions
    // This is placeholder showing what information you'd send to your backend
    try {
      // NOTE: Direct deletion from frontend is NOT secure and NOT recommended
      // This is just to illustrate the concept
      console.log(`Would delete image with public ID: ${publicId}`);
      
      return {
        success: true,
        message: 'Please implement secure deletion via backend'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete image'
      };
    }
  },

  /**
   * Generate a Cloudinary URL with transformations
   * 
   * @param {String} publicId - The public ID of the image
   * @param {Object} options - Transformation options
   * @returns {String} - The transformed image URL
   */
  getImageUrl(publicId, options = {}) {
    const transformations = [];
    
    if (options.width) {
      transformations.push(`w_${options.width}`);
    }
    
    if (options.height) {
      transformations.push(`h_${options.height}`);
    }
    
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    }

    // Add quality transformation if specified
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    // Add format transformation if specified
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    // Construct the URL
    const transformationString = transformations.length > 0 
      ? transformations.join(',') + '/' 
      : '';
      
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformationString}${publicId}`;
  }
}; 