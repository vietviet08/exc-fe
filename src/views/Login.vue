<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const processingAuth = ref(true);
const router = useRouter();
const store = useStore();

// Create a development mode flag that works in both environments
// This avoids using import.meta.env directly in the template
const isDevelopment = ref(true);  // Default to true for debugging purposes
// In production, you'd typically set this to false

// Check authentication state on component mount
onMounted(async () => {
  // Use the new checkAuthState action
  await store.dispatch('checkAuthState');
  processingAuth.value = false;
  
  if (store.state.isAuthenticated && store.state.isAdmin) {
    console.log("User is already authenticated as admin, redirecting to dashboard");
    router.push('/admin/dashboard');
  } else {
    console.log("No authenticated admin user detected");
  }
});

const login = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    console.log(`Attempting login with email: ${email.value}`);
    
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    console.log(`Login successful for user: ${user.email}, uid: ${user.uid}`);
    
    // Check user role with the new action
    console.log("Checking user role for admin permissions");
    await store.dispatch('checkAuthState');
    
    if (store.state.isAdmin) {
      console.log(`User ${user.email} authenticated as admin, redirecting to dashboard`);
      router.push('/admin/dashboard');
    } else {
      // Not an admin, show error
      console.error(`User ${user.email} is not an admin`);
      error.value = 'Access denied. Only administrators can access this application.';
      await auth.signOut();
    }
  } catch (err) {
    console.error("Login error:", err);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      error.value = 'Invalid email or password.';
    } else {
      error.value = `Error: ${err.message}`;
    }
  } finally {
    loading.value = false;
  }
};

// Add this function to debug user role directly from Firestore
const debugCheckUserRole = async () => {
  if (!email.value) {
    error.value = 'Please enter an email to check';
    return;
  }
  
  try {
    error.value = '';
    loading.value = true;
    
    // First sign in to get the UID
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    console.log(`Debug: Successfully signed in as ${user.email} with UID ${user.uid}`);
    
    // Then check the user document directly
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`Debug: User document found for ${user.uid}:`, userData);
      console.log(`Debug: User ${user.email} has role: ${userData.role}`);
      
      if (userData.role === 'admin') {
        console.log(`Debug: User ${user.email} is confirmed as admin`);
      } else {
        console.log(`Debug: User ${user.email} is NOT an admin`);
      }
    } else {
      console.log(`Debug: No user document found for UID ${user.uid}`);
    }
  } catch (err) {
    console.error("Debug error:", err);
    error.value = `Debug error: ${err.message}`;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="processingAuth" class="d-flex justify-content-center align-items-center" style="height: 100vh;">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
  
  <div v-else class="login-container">
    <div class="login-wrapper">
      
      
      <!-- Login Card -->
      <div class="login-card">
      
      
        <p class="text-center text-muted mb-3">Sign in to access the admin dashboard</p>
        <p class="text-center text-danger fw-bold mb-4">
          This application is restricted to administrators only
        </p>
        
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        
        <form @submit.prevent="login">
          <!-- Email Field -->
          <div class="mb-4">
            <label for="email" class="form-label">Admin Email</label>
            <input 
              v-model="email" 
              type="email" 
              class="form-control" 
              id="email" 
              placeholder="admin@example.com"
              required
              autocomplete="email" 
            />
          </div>
          
          <!-- Password Field -->
          <div class="mb-4">
            <label for="password" class="form-label">Password</label>
            <div class="d-flex justify-content-between">
              <div></div> <!-- Empty div for spacing -->
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>
            <input 
              v-model="password" 
              type="password" 
              class="form-control" 
              id="password" 
              required
              autocomplete="current-password" 
            />
          </div>
          
          <!-- Remember Me -->
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="remember">
            <label class="form-check-label" for="remember">Remember me</label>
          </div>
          
          <!-- Login Button -->
          <button 
            type="submit" 
            class="btn btn-primary w-100" 
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Log In
          </button>
          
          <!-- Debug Button - Only in development environment -->
          <button 
            v-if="isDevelopment"
            type="button"
            class="btn btn-outline-secondary w-100 mt-2"
            @click="debugCheckUserRole"
            :disabled="loading || !email.value || !password.value"
          >
            Debug: Check User Role
          </button>
        </form>
        
        <!-- Footer note about admin access -->
        <div class="text-center mt-4">
          <p class="text-muted small mb-2">If you need admin access, please contact the system administrator.</p>
          <p class="small">
            <router-link to="/setup-admin" class="text-decoration-none">Create an admin account</router-link>
          </p>
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
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e7f1ff;
  padding: 0;
  width: 100%;
}

.login-wrapper {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}


.logo-container {
  background-color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sidebar-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo {
  height: 60px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.app-name {
  font-weight: 700;
  font-size: 2rem;
  color: #333;
  margin-bottom: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tagline {
  color: #6c757d;
  font-size: 1rem;
  margin-top: 5px;
  font-style: italic;
}

.login-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  padding: 40px 50px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 700px;
}

.forgot-link {
  font-size: 0.85rem;
  color: #6c757d;
  text-decoration: none;
}

.social-login {
  margin-top: 30px;
}

.social-login p {
  margin-bottom: 15px;
}

.social-btn {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 5px;
}

.footer {
  color: #6c757d;
  font-size: 0.9rem;
}

.btn-primary {
  background-color: #556ee6;
  border-color: #556ee6;
  padding: 12px;
  font-weight: 500;
  font-size: 1.05rem;
}

.form-control {
  padding: 12px;
  font-size: 1rem;
  border-color: #ced4da;
  height: auto;
}

.form-control:focus {
  box-shadow: none;
  border-color: #556ee6;
}

.social-divider {
  text-align: center;
  position: relative;
  margin: 25px 0 20px;
}

.social-divider:before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e9ecef;
  z-index: 1;
}

.social-divider span {
  position: relative;
  background-color: white;
  padding: 0 15px;
  z-index: 2;
  color: #6c757d;
}
</style> 