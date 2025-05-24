import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import components for routing
import Login from './views/Login.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import UserDashboard from './views/UserDashboard.vue'
import MainCategories from './views/admin/MainCategories.vue'
import SubCategories from './views/admin/SubCategories.vue'
import DifficultyLevels from './views/admin/DifficultyLevels.vue'
import WorkoutPlans from './views/admin/WorkoutPlans.vue'
import Exercises from './views/admin/Exercises.vue'
import Users from './views/admin/Users.vue'

// Auth guard
import { auth } from './firebase/config'
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth'

// Set Firebase auth persistence to LOCAL
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Create store
const store = createStore({
  state() {
    return {
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      authReady: false
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
    setAuthReady(state, authReady) {
      state.authReady = authReady;
    }
  },
  actions: {
    async checkUserRole({ commit }, user) {
      if (user) {
        // Check if user's email is admin (you can replace with your admin check logic)
        const isAdmin = user.email === 'admin@example.com';
        commit('setAdmin', isAdmin);
        commit('setAuthenticated', true);
      } else {
        commit('setAdmin', false);
        commit('setAuthenticated', false);
      }
      commit('setAuthReady', true);
    }
  }
});

// Create router
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', 
    component: Login, 
    meta: { requiresGuest: true }
  },
  { 
    path: '/admin', 
    component: AdminDashboard,
    meta: { requiresAdmin: true },
    children: [
      { path: 'main-categories', component: MainCategories },
      { path: 'sub-categories', component: SubCategories },
      { path: 'difficulty-levels', component: DifficultyLevels },
      { path: 'workout-plans', component: WorkoutPlans },
      { path: 'exercises', component: Exercises },
      { path: 'users', component: Users }
    ]
  },
  {
    path: '/dashboard',
    component: UserDashboard,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard with auth state check
router.beforeEach((to, from, next) => {
  const currentUser = auth.currentUser;
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  
  // Wait for auth state to be ready before navigating
  if (!store.state.authReady) {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      store.commit('setUser', user);
      store.dispatch('checkUserRole', user).then(() => {
        checkNavigationRules();
      });
    });
  } else {
    checkNavigationRules();
  }

  function checkNavigationRules() {
    if (requiresAdmin && !store.state.isAdmin) {
      next('/login');
    } else if (requiresAuth && !store.state.isAuthenticated) {
      next('/login');
    } else if (requiresGuest && store.state.isAuthenticated) {
      // If user is logged in and tries to access login page, redirect to appropriate dashboard
      if (store.state.isAdmin) {
        next('/admin/main-categories');
      } else {
        next('/dashboard');
      }
    } else {
      next();
    }
  }
});

// Create the app
const app = createApp(App);

// Use plugins
app.use(store);
app.use(router);

// Setup authentication observer
let appMounted = false;
onAuthStateChanged(auth, (user) => {
  store.commit('setUser', user);
  store.dispatch('checkUserRole', user).then(() => {
    if (!appMounted) {
      app.mount('#app');
      appMounted = true;
    }
  });
});
