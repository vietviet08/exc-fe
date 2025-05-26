import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import { createApp } from 'vue'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import components for routing
import Login from './views/Login.vue'
import Dashboard from './views/admin/Dashboard.vue'
import SetupAdmin from './views/SetupAdmin.vue'
import Categories from './views/admin/Categories.vue'
import WorkoutTypes from './views/admin/WorkoutTypes.vue'
import Levels from './views/admin/Levels.vue'
import Exercises from './views/admin/Exercises.vue'
import WorkoutSessions from './views/admin/WorkoutSessions.vue'
import UserProgress from './views/admin/UserProgress.vue'
import Users from './views/admin/Users.vue'
import ImageManager from './views/admin/ImageManager.vue'
import AdminSettings from './views/admin/AdminSettings.vue'

// Auth guard
import { auth } from './firebase/config'
import { onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth'
import { verifyAdminAccess } from './firebase/userManager'

// Set Firebase auth persistence to LOCAL
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Create auth store
const store = createStore({
  state() {
    return {
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: true
    }
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setAdmin(state, isAdmin) {
      state.isAdmin = isAdmin;
    },
    setAuthenticated(state, isAuthenticated) {
      state.isAuthenticated = isAuthenticated;
    },
    setLoading(state, isLoading) {
      state.isLoading = isLoading;
    }
  },
  actions: {
    async checkAuthState({ commit }) {
      commit('setLoading', true);
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            commit('setUser', {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            });
            commit('setAuthenticated', true);
            
            // Check if user is admin
            try {
              const isAdmin = await verifyAdminAccess(user.uid);
              commit('setAdmin', isAdmin);
            } catch (error) {
              console.error('Error verifying admin access:', error);
              commit('setAdmin', false);
            }
          } else {
            commit('setUser', null);
            commit('setAuthenticated', false);
            commit('setAdmin', false);
          }
          commit('setLoading', false);
          resolve();
        });
      });
    }
  }
});

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      redirect: '/admin/dashboard' 
    },
    { 
      path: '/login', 
      component: Login 
    },
    { 
      path: '/admin/setup', 
      component: SetupAdmin 
    },
    { 
      path: '/admin/dashboard', 
      component: Dashboard,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/categories', 
      component: Categories,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/workout-types', 
      component: WorkoutTypes,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/levels', 
      component: Levels,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/exercises', 
      component: Exercises,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/workout-sessions', 
      component: WorkoutSessions,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/user-progress', 
      component: UserProgress,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/users', 
      component: Users,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/image-manager', 
      component: ImageManager,
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    { 
      path: '/admin/settings', 
      component: AdminSettings,
      meta: { requiresAuth: true, requiresAdmin: true } 
    }
  ]
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Make sure auth state is loaded
  if (store.state.isLoading) {
    await store.dispatch('checkAuthState');
  }
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!store.state.isAuthenticated) {
      next('/login');
    } else if (to.matched.some(record => record.meta.requiresAdmin) && !store.state.isAdmin) {
      // If route requires admin access and user is not admin
      console.log('Access denied: Admin privileges required');
      signOut(auth); // Sign out non-admin user
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

// Create and mount app
const app = createApp(App);
app.use(store);
app.use(router);
app.mount('#app');
