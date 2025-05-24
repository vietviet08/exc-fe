<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '../firebase/userManager';
import { auth, checkIfAdminExists } from '../firebase/config';
import { signOut } from 'firebase/auth';

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const setupKey = ref(''); // Secret key to restrict who can create admin
const error = ref('');
const success = ref('');
const loading = ref(false);
const adminExists = ref(false);
const initialLoading = ref(true);
const router = useRouter();

// Secret key that would be known only to authorized personnel
// In a real app, this would be environment variable or server-side validation
const SETUP_SECRET_KEY = 'ADMIN_SETUP_123456';

// Check if any admin already exists
onMounted(async () => {
  try {
    adminExists.value = await checkIfAdminExists();
    console.log(`Admin check result: ${adminExists.value}`);
    initialLoading.value = false;
  } catch (error) {
    console.error('Error checking for admin:', error);
    initialLoading.value = false;
  }
});

const createAdmin = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;
  
  try {
    console.log('Starting admin creation process');
    
    // Validate form
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match';
      loading.value = false;
      return;
    }
    
    // If admin exists, require setup key
    if (adminExists.value && setupKey.value !== SETUP_SECRET_KEY) {
      error.value = 'Invalid setup key. Since an admin already exists, you need a valid key.';
      loading.value = false;
      return;
    }
    
    console.log(`Registering admin user with email: ${email.value}`);
    
    // Make sure any existing user is signed out first
    if (auth.currentUser) {
      console.log(`Signing out current user: ${auth.currentUser.email}`);
      await signOut(auth);
    }
    
    // Register admin user
    const result = await registerUser(email.value, password.value, 'admin');
    
    if (result.success) {
      console.log(`Admin user created successfully: ${email.value}`);
      success.value = 'Admin user created successfully! Redirecting to login...';
      
      // Sign out to ensure clean login
      await signOut(auth);
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      console.error('Failed to create admin user:', result.error);
      error.value = result.error || 'Failed to create admin user';
    }
  } catch (err) {
    console.error('Error in admin creation:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="initialLoading" class="d-flex justify-content-center align-items-center" style="height: 100vh;">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <div v-else class="setup-container">
    <div class="setup-wrapper">
      <!-- Logo -->
      <div class="text-center mb-5">
        <h2 class="app-name">HOME WORKOUT</h2>
        <h3 class="text-primary">Admin Setup</h3>
      </div>
      
      <!-- Setup Card -->
      <div class="setup-card">
        <h4 class="text-center mb-3">Create Admin User</h4>
        <p class="text-center text-muted mb-4" v-if="!adminExists">
          Create the first administrator account
        </p>
        <p class="text-center text-muted mb-4" v-else>
          <strong>Note:</strong> An admin account already exists. You need the setup key to create another admin.
        </p>
        
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>
        
        <form @submit.prevent="createAdmin">
          <!-- Email Field -->
          <div class="mb-3">
            <label for="email" class="form-label">Admin Email</label>
            <input 
              v-model="email" 
              type="email" 
              class="form-control" 
              id="email" 
              placeholder="admin@example.com"
              required 
            />
          </div>
          
          <!-- Password Field -->
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input 
              v-model="password" 
              type="password" 
              class="form-control" 
              id="password"
              required 
            />
          </div>
          
          <!-- Confirm Password Field -->
          <div class="mb-3">
            <label for="confirm-password" class="form-label">Confirm Password</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              class="form-control" 
              id="confirm-password"
              required 
            />
          </div>
          
          <!-- Setup Key Field (only required if admin exists) -->
          <div class="mb-4" v-if="adminExists">
            <label for="setup-key" class="form-label">Setup Key</label>
            <input 
              v-model="setupKey" 
              type="password" 
              class="form-control" 
              id="setup-key"
              placeholder="Enter the administrator setup key"
              required 
            />
            <div class="form-text">Required since an admin account already exists</div>
          </div>
          
          <!-- Create Button -->
          <button 
            type="submit" 
            class="btn btn-primary w-100" 
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Create Admin User
          </button>
        </form>
        
        <div class="text-center mt-4">
          <router-link to="/login" class="text-decoration-none">Return to Login</router-link>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer text-center mt-4">
        <p>© 2025 HOME WORKOUT. Crafted with ❤️ by vietviet08</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e7f1ff;
  padding: 20px 0;
}

.setup-wrapper {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-name {
  font-weight: bold;
  font-size: 2rem;
  color: #333;
  margin-bottom: 5px;
}

.setup-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  padding: 30px 40px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 550px;
}

.btn-primary {
  background-color: #556ee6;
  border-color: #556ee6;
  padding: 12px;
  font-weight: 500;
  font-size: 1rem;
}

.form-control {
  padding: 10px;
  font-size: 1rem;
  border-color: #ced4da;
}

.form-control:focus {
  box-shadow: none;
  border-color: #556ee6;
}

.footer {
  color: #6c757d;
  font-size: 0.9rem;
}
</style> 