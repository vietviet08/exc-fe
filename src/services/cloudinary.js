import axios from 'axios';
import GIF from 'gif.js';

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
   * Extract a usable public ID from various formats
   * 
   * @param {String} input - URL or public ID string
   * @returns {String} - Clean public ID 
   */
  extractPublicId(input) {
    if (!input) return null;
    
    // If it's already a public ID (without http/https)
    if (!input.includes('http')) {
      return input;
    }
    
    // If it's a full Cloudinary URL
    try {
      const url = new URL(input);
      const pathSegments = url.pathname.split('/');
      
      // Find the 'upload' segment
      const uploadIndex = pathSegments.findIndex(segment => segment === 'upload');
      
      if (uploadIndex !== -1 && uploadIndex < pathSegments.length - 1) {
        // Skip version number if present (v1234)
        let startIndex = uploadIndex + 1;
        if (pathSegments[startIndex] && pathSegments[startIndex].match(/^v\d+$/)) {
          startIndex++;
        }
        
        // Extract everything after upload/version to the end (before file extension)
        const publicIdParts = pathSegments.slice(startIndex);
        let publicId = publicIdParts.join('/');
        
        // Remove file extension if present
        publicId = publicId.replace(/\.[^/.]+$/, '');
        
        console.log('Extracted public ID:', publicId);
        return publicId;
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
    
    return input;
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
    
    // Add fl flags if specified (like attachment, getinfo, etc)
    if (options.fl) {
      transformations.push(`fl_${options.fl}`);
    }

    // Build the URL with transformations
    const transformationString = transformations.length > 0 
      ? transformations.join(',') + '/' 
      : '';
    
    // Make sure the publicId doesn't start with a slash
    const cleanPublicId = publicId.startsWith('/') ? publicId.substring(1) : publicId;
    
    // Base URL - ensure we're using image/upload/ path for standard images
    let url = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformationString}${cleanPublicId}`;
    
    // Add fetch parameter to avoid caching issues if specified
    if (options.fetch) {
      url += `?_fetch=${Date.now()}`;
    }
      
    console.log('Generated image URL:', url);
    return url;
  },
  
  /**
   * Create a true animated GIF file from two images using gif.js library
   * 
   * @param {String} firstImageData - First image data (publicId or URL)
   * @param {String} secondImageData - Second image data (publicId or URL)
   * @param {Object} options - Upload options (folder, public_id, etc)
   * @returns {Promise} - The upload response with image details
   */
  async uploadAnimatedGif(firstImageData, secondImageData, options = {}) {
    try {
      console.log("Starting GIF file creation with gif.js");
      console.log("Image data:", { firstImageData, secondImageData });
      
      // Check if we have valid image data
      if (!firstImageData || !secondImageData) {
        throw new Error("Missing image data. Both images are required.");
      }
      
      // Try to load images directly from URLs first
      const loadImageDirectly = async (url) => {
        console.log("Attempting to load image directly from URL:", url);
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            console.log(`Successfully loaded image, size: ${img.width}x${img.height}`);
            resolve(img);
          };
          img.onerror = (e) => {
            console.error("Failed to load image directly:", e);
            reject(new Error("Failed to load image directly"));
          };
          img.src = url;
        });
      };
      
      try {
        // First try loading directly from provided URLs
        const [img1, img2] = await Promise.all([
          loadImageDirectly(firstImageData),
          loadImageDirectly(secondImageData)
        ]);
        
        console.log("Successfully loaded both images directly from URLs");
        
        // Get dimensions from the first image
        const width = Math.max(img1.width, 1);
        const height = Math.max(img1.height, 1);
        
        console.log(`Using dimensions: ${width}x${height}`);
        
        // Create canvas for drawing frames
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        
        // Fill with white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        
        // Get frame delay from options
        const delay = parseInt(options.frameDelay) || 500;
        console.log(`Using frame delay: ${delay}ms`);
        
        // Create GIF with proper worker script path
        return new Promise((resolve, reject) => {
          try {
            // Create a new GIF using the gif.js library
            const gif = new GIF({
              workers: 2,
              quality: 10,
              workerScript: "/js/gif.worker.js",
              width: width,
              height: height,
              repeat: 0, // Loop forever
              background: "#FFFFFF", 
              transparent: null
            });
            
            // Add the first frame
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img1, 0, 0, width, height);
            console.log("Adding first frame to GIF");
            gif.addFrame(ctx, { delay: delay, copy: true });
            
            // Add the second frame
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img2, 0, 0, width, height);
            console.log("Adding second frame to GIF");
            gif.addFrame(ctx, { delay: delay, copy: true });
            
            // Set up progress tracking
            gif.on("progress", (p) => {
              console.log(`GIF generation progress: ${Math.round(p * 100)}%`);
            });
            
            // Handle GIF completion
            gif.on("finished", async (blob) => {
              try {
                console.log(`GIF created successfully! Size: ${blob.size} bytes`);
                
                // Create file object from the blob
                const publicId = options.public_id || `gif_${Date.now()}`;
                const gifFile = new File([blob], `${publicId}.gif`, {
                  type: "image/gif"
                });
                
                // Upload the GIF to Cloudinary
                console.log("Uploading GIF to Cloudinary...");
                const uploadResult = await this.uploadImage(gifFile, {
                  folder: options.folder || "animations",
                  public_id: publicId,
                  tags: ["animated-gif"]
                });
                
                if (uploadResult.success) {
                  console.log("GIF uploaded successfully:", uploadResult.url);
                  resolve({
                    success: true,
                    url: uploadResult.url,
                    data: uploadResult.data
                  });
                } else {
                  reject(new Error(uploadResult.error || "Failed to upload GIF"));
                }
              } catch (error) {
                console.error("Error in GIF upload:", error);
                reject(error);
              }
            });
            
            // Start rendering
            console.log("Starting GIF rendering...");
            gif.render();
          } catch (error) {
            console.error("Error creating GIF:", error);
            reject(error);
          }
        });
      } catch (directLoadError) {
        console.log("Failed to load images directly, trying with Cloudinary URLs:", directLoadError);
        
        // If direct loading failed, try to extract IDs and use Cloudinary URLs
        const extractPublicId = (data) => {
          if (!data) return null;
          
          // If it's already a public ID (without http/https)
          if (!data.includes('http')) {
            return data;
          }
          
          // If it's a full Cloudinary URL, extract the ID
          try {
            const url = new URL(data);
            const pathParts = url.pathname.split('/');
            // Find the 'upload' part
            const uploadIndex = pathParts.indexOf('upload');
            if (uploadIndex >= 0 && uploadIndex < pathParts.length - 1) {
              // Get the filename part at the end of the path
              const filename = pathParts[pathParts.length - 1];
              // Remove the file extension if present
              const id = filename.split('.')[0];
              console.log("Extracted ID from URL:", id);
              return id;
            }
          } catch (e) {
            console.error("Error parsing URL:", e);
          }
          
          // Try a simple regex as fallback
          const match = data.match(/\/([^\/]+)(?:\.\w+)?$/);
          return match ? match[1] : data;
        };
        
        // Try with just the IDs
        const firstId = extractPublicId(firstImageData);
        const secondId = extractPublicId(secondImageData);
        
        console.log("Extracted IDs:", { firstId, secondId });
        
        // Generate simple URLs - don't add additional folders
        const generateSimpleUrls = (id) => {
          const timestamp = Date.now();
          return [
            // Direct ID with no modification
            `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${id}?_t=${timestamp}`,
            // With auto format
            `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto/${id}?_t=${timestamp}`
          ];
        };
        
        const firstImageUrls = generateSimpleUrls(firstId);
        const secondImageUrls = generateSimpleUrls(secondId);
        
        console.log("Trying simplified URLs:", { firstImageUrls, secondImageUrls });
        
        // Function to try loading an image from a list of URLs
        const tryLoadingImage = async (urls) => {
          for (const url of urls) {
            try {
              console.log(`Trying URL: ${url}`);
              const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.crossOrigin = "anonymous";
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load from ${url}`));
                image.src = url;
              });
              console.log(`Successfully loaded from ${url}`);
              return img;
            } catch (err) {
              console.log(`Failed to load from ${url}: ${err.message}`);
            }
          }
          throw new Error("Failed to load image from all URLs");
        };
        
        // Try loading from the simplified URLs
        const img1 = await tryLoadingImage(firstImageUrls);
        const img2 = await tryLoadingImage(secondImageUrls);
        
        // Get dimensions from first image
        const width = Math.max(img1.width, 1);
        const height = Math.max(img1.height, 1);
        
        console.log(`Using dimensions from fallback: ${width}x${height}`);
        
        // Create canvas for drawing frames
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        
        // Fill with white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        
        // Get frame delay from options
        const delay = parseInt(options.frameDelay) || 500;
        console.log(`Using frame delay: ${delay}ms`);
        
        // Create GIF with fallback images
        return new Promise((resolve, reject) => {
          try {
            // Create a new GIF using the gif.js library
            const gif = new GIF({
              workers: 2,
              quality: 10,
              workerScript: "/js/gif.worker.js",
              width: width,
              height: height,
              repeat: 0, // Loop forever
              background: "#FFFFFF", 
              transparent: null
            });
            
            // Add the first frame
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img1, 0, 0, width, height);
            console.log("Adding first frame to GIF (fallback)");
            gif.addFrame(ctx, { delay: delay, copy: true });
            
            // Add the second frame
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img2, 0, 0, width, height);
            console.log("Adding second frame to GIF (fallback)");
            gif.addFrame(ctx, { delay: delay, copy: true });
            
            // Set up progress tracking
            gif.on("progress", (p) => {
              console.log(`GIF generation progress (fallback): ${Math.round(p * 100)}%`);
            });
            
            // Handle GIF completion
            gif.on("finished", async (blob) => {
              try {
                console.log(`GIF created successfully (fallback)! Size: ${blob.size} bytes`);
                
                // Create file object from the blob
                const publicId = options.public_id || `gif_${Date.now()}`;
                const gifFile = new File([blob], `${publicId}.gif`, {
                  type: "image/gif"
                });
                
                // Upload the GIF to Cloudinary
                console.log("Uploading GIF to Cloudinary...");
                const uploadResult = await this.uploadImage(gifFile, {
                  folder: options.folder || "animations",
                  public_id: publicId,
                  tags: ["animated-gif"]
                });
                
                if (uploadResult.success) {
                  console.log("GIF uploaded successfully (fallback):", uploadResult.url);
                  resolve({
                    success: true,
                    url: uploadResult.url,
                    data: uploadResult.data
                  });
                } else {
                  reject(new Error(uploadResult.error || "Failed to upload GIF"));
                }
              } catch (error) {
                console.error("Error in GIF upload (fallback):", error);
                reject(error);
              }
            });
            
            // Start rendering
            console.log("Starting GIF rendering (fallback)...");
            gif.render();
          } catch (error) {
            console.error("Error creating GIF (fallback):", error);
            reject(error);
          }
        });
      }
    } catch (error) {
      console.error("Error creating animated GIF:", error);
      return {
        success: false,
        error: error.message || "Failed to create animated GIF"
      };
    }
  }
};

/**
 * Helper function to create an image element from blob
 */
function createImageElement(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.src = url;
  });
} 