<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const processingAuth = ref(true);
const router = useRouter();
const store = useStore();

// Check authentication state on component mount
onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    processingAuth.value = false;
    if (user) {
      // User is already logged in, check role and redirect
      store.dispatch('checkUserRole', user).then(() => {
        if (store.state.isAdmin) {
          router.push('/admin/main-categories');
        } else {
          router.push('/dashboard');
        }
      });
    }
  });
  
  // Clean up subscription
  return () => unsubscribe();
});

const login = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    
    // Check user role
    await store.dispatch('checkUserRole', user);
    
    if (store.state.isAdmin) {
      router.push('/admin/main-categories');
    } else {
      // Regular user - redirect to user dashboard
      router.push('/dashboard');
    }
  } catch (err) {
    error.value = err.message;
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
      <!-- Logo -->
      <div class="text-center mb-5">
        <img src="@/assets/logo.svg" alt="Logo" class="logo" />
        <h2 class="app-name">HOME WORKOUT</h2>
      </div>
      
      <!-- Login Card -->
      <div class="login-card">
        <h3 class="text-center mb-3">Welcome Back!</h3>
        <p class="text-center text-muted mb-5">Sign in to continue to Minible.</p>
        
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        
        <form @submit.prevent="login">
          <!-- Email Field -->
          <div class="mb-4">
            <label for="email" class="form-label">Email</label>
            <input 
              v-model="email" 
              type="email" 
              class="form-control" 
              id="email" 
              placeholder="admin@gmail.com"
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
        </form>
        
      
        
        <!-- Signup Link -->
        <div class="text-center mt-4">
          <p>Don't have an account? <a href="#">Signup now</a></p>
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

.logo {
  height: 50px;
  margin-bottom: 15px;
}

.app-name {
  font-weight: bold;
  font-size: 2rem;
  color: #333;
  margin-bottom: 0;
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