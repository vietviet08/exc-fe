<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Navigation from '../components/Navigation.vue';

const store = useStore();
const userName = ref('');

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userName.value = user.displayName || user.email.split('@')[0];
    }
  });
});
</script>

<template>
  <div class="dashboard-container">
    <Navigation />
    
    <div class="dashboard-content">
      <div class="container py-5">
        <div class="row">
          <div class="col-12">
            <div class="card shadow">
              <div class="card-body">
                <h2 class="mb-4">Welcome, {{ userName }}!</h2>
                <p class="lead">This is your personal workout dashboard.</p>
                
                <div class="row mt-5">
                  <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm">
                      <div class="card-body text-center">
                        <i class="bi bi-calendar-check fs-1 text-primary mb-3"></i>
                        <h4>My Workouts</h4>
                        <p>View and manage your workout plans</p>
                        <button class="btn btn-outline-primary">View Workouts</button>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm">
                      <div class="card-body text-center">
                        <i class="bi bi-graph-up fs-1 text-success mb-3"></i>
                        <h4>Progress</h4>
                        <p>Track your fitness progress</p>
                        <button class="btn btn-outline-success">View Progress</button>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm">
                      <div class="card-body text-center">
                        <i class="bi bi-gear fs-1 text-warning mb-3"></i>
                        <h4>Profile Settings</h4>
                        <p>Update your profile information</p>
                        <button class="btn btn-outline-warning">Edit Profile</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-content {
  flex: 1;
  background-color: #f8f9fa;
}

.card {
  border-radius: 10px;
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
}
</style> 