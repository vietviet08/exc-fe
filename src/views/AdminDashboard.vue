<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const store = useStore();
const router = useRouter();
const sidebarCollapsed = ref(false);

const user = computed(() => store.state.user);

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
  <div class="admin-dashboard">
    <!-- Sidebar -->
    <div class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h3>Workout Admin</h3>
        <button class="btn btn-sm btn-outline-light d-lg-none" @click="toggleSidebar">
          <i class="bi bi-x"></i>
        </button>
      </div>
      
      <ul class="nav flex-column">
        <li class="nav-item">
          <router-link to="/admin/main-categories" class="nav-link">
            <i class="bi bi-grid me-2"></i> Main Categories
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/sub-categories" class="nav-link">
            <i class="bi bi-grid-3x3-gap me-2"></i> Sub Categories
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/difficulty-levels" class="nav-link">
            <i class="bi bi-bar-chart-steps me-2"></i> Difficulty Levels
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/workout-plans" class="nav-link">
            <i class="bi bi-calendar-check me-2"></i> Workout Plans
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/exercises" class="nav-link">
            <i class="bi bi-activity me-2"></i> Exercises
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/users" class="nav-link">
            <i class="bi bi-people me-2"></i> Users
          </router-link>
        </li>
      </ul>
      
      <div class="sidebar-footer">
        <button class="btn btn-outline-light btn-sm" @click="logout">
          <i class="bi bi-box-arrow-right me-2"></i> Logout
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Navbar -->
      <nav class="navbar navbar-expand-lg bg-white shadow-sm">
        <div class="container-fluid">
          <button 
            class="navbar-toggler d-lg-none border-0" 
            type="button" 
            @click="toggleSidebar"
          >
            <i class="bi bi-list"></i>
          </button>
          
          <div class="d-flex align-items-center">
            <span class="ms-2">
              {{ user?.email || 'Admin' }}
            </span>
          </div>
        </div>
      </nav>
      
      <!-- Content Area -->
      <div class="content p-4">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
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

.sidebar ul {
  padding: 1rem 0;
  flex-grow: 1;
}

.sidebar .nav-link {
  color: rgba(255, 255, 255, 0.75);
  padding: 0.75rem 1rem;
}

.sidebar .nav-link:hover,
.sidebar .nav-link.active {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.content {
  flex-grow: 1;
  background-color: #f8f9fa;
}

@media (max-width: 991.98px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1050;
    margin-left: -260px;
  }
  
  .sidebar.collapsed {
    margin-left: 0;
  }
}
</style> 