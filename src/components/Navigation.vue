<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

const router = useRouter();
const store = useStore();
const isLoggingOut = ref(false);

const user = computed(() => store.state.user);
const userName = computed(() => {
  if (!user.value) return '';
  return user.value.displayName || user.value.email.split('@')[0];
});

const logout = async () => {
  try {
    isLoggingOut.value = true;
    await signOut(auth);
    router.push('/login');
  } catch (error) {
    console.error('Error signing out:', error);
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand" href="#">HOME WORKOUT</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Workouts</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Progress</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Profile</a>
          </li>
        </ul>
        <div class="d-flex align-items-center">
          <span class="text-light me-3">Hi, {{ userName }}</span>
          <button @click="logout" class="btn btn-light" :disabled="isLoggingOut">
            <span v-if="isLoggingOut" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 