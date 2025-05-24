<script>
import { ref, onMounted, computed } from 'vue';
import DataTable from '@/components/dashboard/DataTable.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import { db } from '@/firebase/config';
import { 
  collection, getDocs, doc, getDoc,
  query, orderBy, where, limit, deleteDoc
} from 'firebase/firestore';
import { UserWorkout } from '@/models/UserWorkout';
import { WorkoutPlan } from '@/models/WorkoutPlan';
import { Modal } from 'bootstrap';

export default {
  components: {
    DataTable,
    StatCard
  },
  setup() {
    // State
    const userWorkouts = ref([]);
    const workoutPlans = ref([]);
    const users = ref([]);
    const loading = ref(true);
    const selectedUserId = ref('');
    const dateFilter = ref(null);
    const detailWorkout = ref(null);
    
    // Modal reference
    const detailModal = ref(null);
    
    // Filter by last days
    const lastDays = ref(7); // Default: 7 days
    const dayOptions = [
      { value: 7, label: 'Last 7 days' },
      { value: 30, label: 'Last 30 days' },
      { value: 90, label: 'Last 90 days' },
      { value: 365, label: 'Last year' },
      { value: 0, label: 'All time' }
    ];

    // Computed
    const columns = [
      { key: 'user_name', label: 'User' },
      { key: 'workout_name', label: 'Workout Plan' },
      { key: 'completion_status', label: 'Status' },
      { key: 'start_time', label: 'Start Time' },
      { key: 'end_time', label: 'End Time' },
      { key: 'total_duration', label: 'Duration (min)' },
      { key: 'calories_burned', label: 'Calories Burned' }
    ];

    const filteredWorkouts = computed(() => {
      return userWorkouts.value.filter(workout => {
        let dateMatch = true;
        
        // Filter by date range
        if (lastDays.value > 0) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - lastDays.value);
          dateMatch = workout.start_time && workout.start_time >= cutoffDate;
        }

        // Filter by user if selected
        const userMatch = !selectedUserId.value || workout.user_id === selectedUserId.value;
        
        return dateMatch && userMatch;
      });
    });

    const stats = computed(() => {
      const filtered = filteredWorkouts.value;
      
      // Calculate total duration across all workouts
      const totalDuration = filtered.reduce((sum, workout) => {
        return sum + (workout.total_duration || 0);
      }, 0);
      
      // Calculate total calories across all workouts
      const totalCalories = filtered.reduce((sum, workout) => {
        return sum + (workout.calories_burned || 0);
      }, 0);
      
      // Count completed workouts
      const completed = filtered.filter(workout => 
        workout.completion_status === 'completed'
      ).length;
      
      // Calculate completion rate
      const completionRate = filtered.length > 0
        ? Math.round((completed / filtered.length) * 100)
        : 0;
      
      return [
        {
          title: 'Total Workouts',
          value: filtered.length,
          icon: 'fa-dumbbell',
          color: 'primary'
        },
        {
          title: 'Completion Rate',
          value: `${completionRate}%`,
          icon: 'fa-check-circle',
          color: 'success'
        },
        {
          title: 'Total Duration',
          value: `${Math.round(totalDuration)} min`,
          icon: 'fa-clock',
          color: 'info'
        },
        {
          title: 'Calories Burned',
          value: Math.round(totalCalories),
          icon: 'fa-fire',
          color: 'danger'
        }
      ];
    });

    // Fetch data
    const fetchData = async () => {
      try {
        loading.value = true;

        // Get users
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = [];
        usersSnapshot.forEach(doc => {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        users.value = usersList;

        // Get workout plans
        const plansCollection = collection(db, 'workout_plans');
        const plansQuery = query(plansCollection, orderBy('name'));
        const plansSnapshot = await getDocs(plansQuery);
        
        const plansList = [];
        plansSnapshot.forEach((doc) => {
          plansList.push(WorkoutPlan.fromFirestore(doc));
        });
        workoutPlans.value = plansList;

        // Get user workouts
        const workoutsCollection = collection(db, 'user_workouts');
        const workoutsQuery = query(workoutsCollection, orderBy('start_time', 'desc'));
        const workoutsSnapshot = await getDocs(workoutsQuery);
        
        const workoutsList = [];
        
        for (const doc of workoutsSnapshot.docs) {
          const userWorkout = UserWorkout.fromFirestore(doc);
          
          // Attach workout plan reference
          if (userWorkout.plan_id) {
            const matchingPlan = plansList.find(plan => plan.plan_id === userWorkout.plan_id);
            if (matchingPlan) {
              userWorkout.setWorkoutPlan(matchingPlan);
            }
          }
          
          // Add user name
          const user = usersList.find(u => u.id === userWorkout.user_id);
          userWorkout._user_name = user ? (user.display_name || user.email) : 'Unknown User';
          
          workoutsList.push(userWorkout);
        }
        
        userWorkouts.value = workoutsList;
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        loading.value = false;
      }
    };

    // Format date for display
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString();
    };

    // Get user name
    const getUserName = (userId) => {
      const user = users.value.find(u => u.id === userId);
      return user ? (user.display_name || user.email) : 'Unknown User';
    };

    // Get workout plan name
    const getWorkoutName = (planId) => {
      const plan = workoutPlans.value.find(p => p.plan_id === planId);
      return plan ? plan.name : 'Unknown Plan';
    };

    // Show workout detail
    const showWorkoutDetail = (workout) => {
      detailWorkout.value = workout;
      
      const modalElement = document.getElementById('workoutDetailModal');
      if (modalElement) {
        detailModal.value = new Modal(modalElement);
        detailModal.value.show();
      }
    };

    // Delete workout
    const deleteWorkout = async (workoutId) => {
      if (!confirm('Are you sure you want to delete this workout record?')) return;
      
      try {
        loading.value = true;
        await deleteDoc(doc(db, 'user_workouts', workoutId));
        userWorkouts.value = userWorkouts.value.filter(w => w.workout_id !== workoutId);
        
        if (detailModal.value) {
          detailModal.value.hide();
        }
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    // Format duration
    const formatDuration = (minutes) => {
      if (!minutes) return 'N/A';
      const hrs = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    // Initialize
    onMounted(() => {
      fetchData();
    });

    return {
      userWorkouts,
      filteredWorkouts,
      workoutPlans,
      users,
      loading,
      columns,
      stats,
      selectedUserId,
      lastDays,
      dayOptions,
      detailWorkout,
      formatDate,
      getUserName,
      getWorkoutName,
      showWorkoutDetail,
      deleteWorkout,
      formatDuration
    };
  }
};
</script>

<template>
  <div class="content-container">
    <h1 class="page-title">User Workout History</h1>
    
    <!-- Stats Row -->
    <div class="row">
      <div class="col-md-6 col-xl-3" v-for="(stat, index) in stats" :key="index">
        <StatCard
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
        />
      </div>
    </div>
    
    <!-- Filters and Controls -->
    <div class="row mb-4">
      <div class="col-md-4">
        <label class="form-label">Filter by User</label>
        <select class="form-select" v-model="selectedUserId">
          <option value="">All Users</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.display_name || user.email }}
          </option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Time Period</label>
        <select class="form-select" v-model="lastDays">
          <option v-for="option in dayOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="col-md-4 d-flex align-items-end justify-content-end">
        <button class="btn btn-primary" @click="fetchData">
          <i class="fa fa-refresh"></i> Refresh Data
        </button>
      </div>
    </div>
    
    <!-- Workouts Table -->
    <DataTable
      title="Workout History"
      :columns="columns"
      :items="filteredWorkouts"
      :loading="loading"
    >
      <template #user_name="{ item }">
        {{ item._user_name }}
      </template>
      
      <template #workout_name="{ item }">
        {{ item._workout_plan?.name || 'Unknown Plan' }}
      </template>
      
      <template #completion_status="{ value }">
        <span v-if="value === 'completed'" class="badge bg-success">Completed</span>
        <span v-else-if="value === 'partial'" class="badge bg-warning">Partial</span>
        <span v-else-if="value === 'abandoned'" class="badge bg-danger">Abandoned</span>
        <span v-else class="badge bg-secondary">{{ value || 'Unknown' }}</span>
      </template>
      
      <template #start_time="{ value }">
        {{ formatDate(value) }}
      </template>
      
      <template #end_time="{ value }">
        {{ formatDate(value) }}
      </template>
      
      <template #total_duration="{ value }">
        {{ formatDuration(value) }}
      </template>
      
      <template #actions="{ item }">
        <button 
          class="btn btn-sm btn-info" 
          @click="showWorkoutDetail(item)" 
          title="View Details"
        >
          <i class="fa fa-eye"></i>
        </button>
      </template>
    </DataTable>
    
    <!-- Workout Detail Modal -->
    <div class="modal fade" id="workoutDetailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="detailWorkout">
          <div class="modal-header">
            <h5 class="modal-title">Workout Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <h6 class="text-muted">User</h6>
                  <p class="mb-0">{{ detailWorkout._user_name }}</p>
                </div>
                <div class="mb-3">
                  <h6 class="text-muted">Workout Plan</h6>
                  <p class="mb-0">{{ detailWorkout._workout_plan?.name || 'Unknown Plan' }}</p>
                </div>
                <div class="mb-3">
                  <h6 class="text-muted">Status</h6>
                  <span v-if="detailWorkout.completion_status === 'completed'" class="badge bg-success">Completed</span>
                  <span v-else-if="detailWorkout.completion_status === 'partial'" class="badge bg-warning">Partial</span>
                  <span v-else-if="detailWorkout.completion_status === 'abandoned'" class="badge bg-danger">Abandoned</span>
                  <span v-else class="badge bg-secondary">{{ detailWorkout.completion_status || 'Unknown' }}</span>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <h6 class="text-muted">Start Time</h6>
                  <p class="mb-0">{{ formatDate(detailWorkout.start_time) }}</p>
                </div>
                <div class="mb-3">
                  <h6 class="text-muted">End Time</h6>
                  <p class="mb-0">{{ formatDate(detailWorkout.end_time) }}</p>
                </div>
                <div class="mb-3">
                  <h6 class="text-muted">Duration</h6>
                  <p class="mb-0">{{ formatDuration(detailWorkout.total_duration) }}</p>
                </div>
              </div>
            </div>
            
            <div class="row mt-3">
              <div class="col-md-4">
                <div class="workout-stat-card">
                  <div class="stat-icon bg-primary">
                    <i class="fa fa-fire"></i>
                  </div>
                  <div class="stat-content">
                    <h6 class="text-muted">Calories Burned</h6>
                    <h5>{{ detailWorkout.calories_burned || 0 }}</h5>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="workout-stat-card">
                  <div class="stat-icon bg-success">
                    <i class="fa fa-check"></i>
                  </div>
                  <div class="stat-content">
                    <h6 class="text-muted">Exercises Completed</h6>
                    <h5>{{ detailWorkout.exercises_completed || 0 }}</h5>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="workout-stat-card">
                  <div class="stat-icon bg-info">
                    <i class="fa fa-star"></i>
                  </div>
                  <div class="stat-content">
                    <h6 class="text-muted">Rating</h6>
                    <h5>{{ detailWorkout.completion_rating || 'N/A' }}</h5>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-4" v-if="detailWorkout.notes">
              <h6 class="text-muted">User Notes</h6>
              <div class="p-3 bg-light rounded">
                {{ detailWorkout.notes }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="deleteWorkout(detailWorkout.workout_id)"
            >
              <i class="fa fa-trash"></i> Delete Record
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.workout-stat-card {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon i {
  color: white;
  font-size: 20px;
}

.stat-content {
  flex-grow: 1;
}

.stat-content h6 {
  margin-bottom: 5px;
  font-size: 12px;
}

.stat-content h5 {
  margin-bottom: 0;
  font-weight: 600;
}

.bg-primary {
  background-color: #556ee6;
}

.bg-success {
  background-color: #34c38f;
}

.bg-info {
  background-color: #50a5f1;
}
</style> 