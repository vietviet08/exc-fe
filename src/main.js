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

// Auth guard
import { auth } from './firebase/config'
import { onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth'
import { verifyAdminAccess } from './firebase/userManager'

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
      authReady: false,
      authChecking: false
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
    },
    setAuthChecking(state, checking) {
      state.authChecking = checking;
    }
  },
  actions: {
    async checkUserRole({ commit }, user) {
      commit('setAuthChecking', true);
      
      if (user) {
        console.log(`Checking user role for: ${user.email}, uid: ${user.uid}`);
        try {
          // Verify admin role using Firestore
          const isAdmin = await verifyAdminAccess(user);
          console.log(`Admin verification result for ${user.email}: ${isAdmin}`);
          
          commit('setAdmin', isAdmin);
          commit('setAuthenticated', isAdmin); // Only authenticate if admin
          
          if (!isAdmin) {
            console.log(`User ${user.email} is not an admin, signing out`);
            // Sign out non-admin users automatically
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          commit('setAdmin', false);
          commit('setAuthenticated', false);
          await signOut(auth);
        }
      } else {
        console.log('No user provided for checkUserRole');
        commit('setAdmin', false);
        commit('setAuthenticated', false);
      }
      
      commit('setAuthReady', true);
      commit('setAuthChecking', false);
      
      // Return the current admin state
      return store.state.isAdmin;
    }
  }
});

// Create router
const routes = [
  { path: '/', redirect: '/login' },
  { 
    path: '/login', 
    component: Login, 
    meta: { requiresGuest: true }
  },
  { 
    path: '/setup-admin', 
    component: SetupAdmin 
  },
  // Admin routes
  { 
    path: '/admin/dashboard', 
    component: Dashboard,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/categories', 
    component: Categories,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/workout-types', 
    component: WorkoutTypes,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/levels', 
    component: Levels,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/exercises', 
    component: Exercises,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/workout-sessions', 
    component: WorkoutSessions,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/user-progress', 
    component: UserProgress,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/users', 
    component: Users,
    meta: { requiresAdmin: true }
  },
  { 
    path: '/admin/images', 
    component: ImageManager,
    meta: { requiresAdmin: true }
  },
  // Redirect for admin path
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  // Catch-all route for any unmatched routes
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
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
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  
  console.log(`Navigation to: ${to.path}`);
  console.log(`Current auth state: user=${currentUser?.email || 'none'}, isAdmin=${store.state.isAdmin}, isAuthenticated=${store.state.isAuthenticated}`);
  
  // Allow access to setup-admin and login pages without authentication checks
  if (to.path === '/setup-admin' || to.path === '/login') {
    console.log('Allowing direct access to:', to.path);
    next();
    return;
  }
  
  // Đảm bảo rằng trang login luôn có thể truy cập được
  if (to.path === '/login') {
    next();
    return;
  }
  
  // Wait for auth state to be ready before navigating
  if (!store.state.authReady) {
    console.log('Auth state not ready, waiting for onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      console.log(`Auth state changed: user=${user?.email || 'none'}`);
      
      store.commit('setUser', user);
      store.dispatch('checkUserRole', user).then(() => {
        console.log(`checkUserRole completed: isAdmin=${store.state.isAdmin}, isAuthenticated=${store.state.isAuthenticated}`);
        checkNavigationRules();
      });
    });
  } else {
    console.log('Auth state ready, checking navigation rules');
    checkNavigationRules();
  }

  function checkNavigationRules() {
    console.log(`Checking navigation rules: isAdmin=${store.state.isAdmin}, requiresAdmin=${requiresAdmin}, requiresGuest=${requiresGuest}`);
    
    // Always allow access to login page
    if (to.path === '/login') {
      next();
      return;
    }
    
    if (requiresAdmin && !store.state.isAdmin) {
      console.log('Admin route requested but user is not admin, redirecting to login');
      next('/login');
    } else if (requiresGuest && store.state.isAuthenticated) {
      // If user is logged in and tries to access login page, redirect to admin dashboard
      console.log('User is authenticated but trying to access guest page, redirecting to admin dashboard');
      next('/admin/dashboard');
    } else {
      console.log('Navigation allowed');
      next();
    }
  }
});

// Create the app
const app = createApp(App);

// Use plugins
app.use(store);
app.use(router);

// Đảm bảo ứng dụng luôn được mount ngay cả khi chưa xác thực
app.mount('#app');

// Setup authentication observer sau khi đã mount ứng dụng
onAuthStateChanged(auth, (user) => {
  console.log(`Global auth state changed: user=${user?.email || 'none'}`);
  store.commit('setUser', user);
  store.dispatch('checkUserRole', user).then(() => {
    console.log(`Global checkUserRole completed: isAdmin=${store.state.isAdmin}, isAuthenticated=${store.state.isAuthenticated}`);
  });
});
