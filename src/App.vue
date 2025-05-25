<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { signOut } from 'firebase/auth';
import { auth } from './firebase/config';

const store = useStore();
const router = useRouter();
const route = useRoute();

const sidebarCollapsed = ref(false);
const user = computed(() => store.state.user);
const isAdmin = computed(() => store.state.isAdmin);
const isAuthenticated = computed(() => store.state.isAuthenticated);
const isAdminRoute = computed(() => route.path.startsWith('/admin'));

const logout = async () => {
  try {
    await signOut(auth);
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

</script>

<template>
  <div class="app-container">
    <!-- Sidebar for admin routes -->
    <div v-if="isAuthenticated && isAdminRoute" 
         class="sidebar" 
         :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="d-flex align-items-center">
          <div class="logo-container me-2">
            <img src="@/assets/logo.png" alt="Logo" class="sidebar-logo w-100 h-100" />
          </div>
          <h3>GORDON</h3>
        </div>
        <button class="btn btn-sm btn-outline-light d-lg-none" @click="toggleSidebar">
          <i class="bi bi-x"></i>
        </button>
      </div>
      
      <ul class="nav flex-column">
        <li class="nav-item">
          <router-link to="/admin/dashboard" class="nav-link">
            <i class="bi bi-speedometer2 me-2"></i> Dashboard
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/categories" class="nav-link">
            <i class="bi bi-grid me-2"></i> Categories
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/workout-types" class="nav-link">
            <i class="bi bi-grid-3x3-gap me-2"></i> Workout Types
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/levels" class="nav-link">
            <i class="bi bi-bar-chart-steps me-2"></i> Levels
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/exercises" class="nav-link">
            <i class="bi bi-activity me-2"></i> Exercises
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/workout-sessions" class="nav-link">
            <i class="bi bi-stopwatch me-2"></i> Workout Sessions
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/user-progress" class="nav-link">
            <i class="bi bi-clipboard-data me-2"></i> User Progress
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/users" class="nav-link">
            <i class="bi bi-people me-2"></i> Users
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/images" class="nav-link">
            <i class="bi bi-images me-2"></i> Images
          </router-link>
        </li>
      </ul>
      
      <div class="sidebar-footer">
        <button class="btn btn-outline-light btn-sm" @click="logout">
          <i class="bi bi-box-arrow-right me-2"></i> Logout
        </button>
      </div>
    </div>
    
    <!-- Main Content Container - luôn hiển thị -->
    <div class="main-content" :class="{ 'with-sidebar': isAuthenticated && isAdminRoute }">
      <!-- Navbar for Admin pages -->
      <nav v-if="isAuthenticated && isAdminRoute" class="navbar navbar-expand-lg bg-white shadow-sm">
        <div class="container-fluid">
          <button 
            class="navbar-toggler d-lg-none border-0" 
            type="button" 
            @click="toggleSidebar"
          >
            <i class="bi bi-list"></i>
          </button>
          
          <div class="d-flex align-items-center ms-auto">
            <span class="me-3">
              {{ user?.email || 'Admin' }}
            </span>
            <button class="btn btn-sm btn-outline-secondary" @click="logout">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </nav>
      
      <!-- Router View - luôn hiển thị -->
      <router-view />
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f8f9fa;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background-color: #343a40;
  color: white;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  z-index: 1000;
}

.sidebar.collapsed {
  margin-left: -260px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.sidebar ul {
  padding: 1rem 0;
  flex-grow: 1;
  list-style: none;
  margin: 0;
}

.sidebar .nav-link {
  color: rgba(255, 255, 255, 0.75);
  padding: 0.75rem 1rem;
  text-decoration: none;
}

.sidebar .nav-link:hover,
.sidebar .nav-link.router-link-active {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.main-content {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.main-content.with-sidebar {
  width: calc(100% - 260px);
}

.navbar {
  padding: 0.75rem 1rem;
}

@media (max-width: 991.98px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    margin-left: -260px;
  }
  
  .sidebar.collapsed {
    margin-left: 0;
  }
  
  .main-content.with-sidebar {
    width: 100%;
  }
}
</style>
