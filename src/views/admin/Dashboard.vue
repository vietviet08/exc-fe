<script>
import StatCard from '@/components/dashboard/StatCard.vue';
import DataTable from '@/components/dashboard/DataTable.vue';

export default {
  components: {
    StatCard,
    DataTable
  },
  data() {
    return {
      // Example data for stats
      stats: [
        {
          title: 'Total Users',
          value: 1250,
          icon: 'fa-user',
          color: 'primary',
          percentChange: 5.3,
          subtitle: 'since last month'
        },
        {
          title: 'Active Workouts',
          value: 452,
          icon: 'fa-heart',
          color: 'success',
          percentChange: 3.2,
          subtitle: 'since last week'
        },
        {
          title: 'Completed Plans',
          value: 185,
          icon: 'fa-check-circle',
          color: 'info',
          percentChange: -2.4,
          subtitle: 'since last month'
        },
        {
          title: 'Completion Rate',
          value: '78%',
          icon: 'fa-chart-bar',
          color: 'warning',
          percentChange: 4.6,
          subtitle: 'since last month'
        }
      ],
      
      // Recent users data
      recentUsers: [
        { user_id: '1', name: 'John Doe', email: 'john@example.com', joined_date: '2023-05-15', status: 'active' },
        { user_id: '2', name: 'Jane Smith', email: 'jane@example.com', joined_date: '2023-05-18', status: 'active' },
        { user_id: '3', name: 'Robert Johnson', email: 'robert@example.com', joined_date: '2023-05-20', status: 'inactive' },
        { user_id: '4', name: 'Emily Wilson', email: 'emily@example.com', joined_date: '2023-05-22', status: 'active' },
        { user_id: '5', name: 'Michael Brown', email: 'michael@example.com', joined_date: '2023-05-23', status: 'active' }
      ],
      
      // Recent workout data
      recentWorkouts: [
        { workout_id: '101', user_name: 'John Doe', plan_name: 'Weight Loss', start_time: '2023-05-23T09:30:00', duration: 45, status: 'completed' },
        { workout_id: '102', user_name: 'Emily Wilson', plan_name: 'Cardio Blast', start_time: '2023-05-23T10:15:00', duration: 30, status: 'completed' },
        { workout_id: '103', user_name: 'Robert Johnson', plan_name: 'Strength Training', start_time: '2023-05-23T14:00:00', duration: 60, status: 'in_progress' },
        { workout_id: '104', user_name: 'Jane Smith', plan_name: 'Yoga Flow', start_time: '2023-05-23T16:30:00', duration: 40, status: 'scheduled' },
        { workout_id: '105', user_name: 'Michael Brown', plan_name: 'HIIT', start_time: '2023-05-23T18:00:00', duration: 25, status: 'scheduled' }
      ],
      
      // Table columns
      userColumns: [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'joined_date', label: 'Joined Date' },
        { key: 'status', label: 'Status' }
      ],
      
      workoutColumns: [
        { key: 'user_name', label: 'User' },
        { key: 'plan_name', label: 'Workout Plan' },
        { key: 'start_time', label: 'Start Time' },
        { key: 'duration', label: 'Duration (mins)' },
        { key: 'status', label: 'Status' }
      ]
    };
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    formatDateTime(dateTimeString) {
      const date = new Date(dateTimeString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    },
    getStatusClass(status) {
      const statusClasses = {
        'active': 'badge bg-success',
        'inactive': 'badge bg-danger',
        'completed': 'badge bg-success',
        'in_progress': 'badge bg-warning',
        'scheduled': 'badge bg-info'
      };
      
      return statusClasses[status] || 'badge bg-secondary';
    }
  }
};
</script>

<template>
  <div class="content-container">
    <h1 class="page-title">Dashboard</h1>
    
    <!-- Stats Row -->
    <div class="row">
      <div class="col-md-6 col-xl-3" v-for="(stat, index) in stats" :key="index">
        <StatCard
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          :percent-change="stat.percentChange"
          :subtitle="stat.subtitle"
        />
      </div>
    </div>
    
    <!-- Recent Users -->
    <div class="row">
      <div class="col-xl-6">
        <DataTable
          title="Recent Users"
          :columns="userColumns"
          :items="recentUsers"
          :loading="false"
        >
          <template #joined_date="{ value }">
            {{ formatDate(value) }}
          </template>
          
          <template #status="{ value }">
            <span :class="getStatusClass(value)">
              {{ value.charAt(0).toUpperCase() + value.slice(1) }}
            </span>
          </template>
          
          <template #actions="{ item }">
            <div class="btn-group">
              <button class="btn btn-sm btn-primary" title="View">
                <i class="fa fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-info" title="Edit">
                <i class="fa fa-edit"></i>
              </button>
            </div>
          </template>
        </DataTable>
      </div>
      
      <!-- Recent Workouts -->
      <div class="col-xl-6">
        <DataTable
          title="Recent Workouts"
          :columns="workoutColumns"
          :items="recentWorkouts"
          :loading="false"
        >
          <template #start_time="{ value }">
            {{ formatDateTime(value) }}
          </template>
          
          <template #status="{ value }">
            <span :class="getStatusClass(value)">
              {{ value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') }}
            </span>
          </template>
          
          <template #actions="{ item }">
            <div class="btn-group">
              <button class="btn btn-sm btn-primary" title="View">
                <i class="fa fa-eye"></i>
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
    
    <!-- Activity Timeline -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title mb-4">Recent Activity</h4>
            
            <ul class="activity-timeline">
              <li class="activity-item">
                <div class="activity-icon bg-soft bg-primary">
                  <i class="fa fa-user-plus text-primary"></i>
                </div>
                <div class="activity-info">
                  <div class="activity-title">New user registered</div>
                  <p class="text-muted mb-0">Emily Wilson registered an account</p>
                  <small class="text-muted">2 hours ago</small>
                </div>
              </li>
              
              <li class="activity-item">
                <div class="activity-icon bg-soft bg-success">
                  <i class="fa fa-check-circle text-success"></i>
                </div>
                <div class="activity-info">
                  <div class="activity-title">Workout Completed</div>
                  <p class="text-muted mb-0">John Doe completed "Weight Loss" workout</p>
                  <small class="text-muted">4 hours ago</small>
                </div>
              </li>
              
              <li class="activity-item">
                <div class="activity-icon bg-soft bg-warning">
                  <i class="fa fa-star text-warning"></i>
                </div>
                <div class="activity-info">
                  <div class="activity-title">New Plan Rating</div>
                  <p class="text-muted mb-0">Jane Smith rated "Yoga Flow" workout plan</p>
                  <small class="text-muted">5 hours ago</small>
                </div>
              </li>
              
              <li class="activity-item">
                <div class="activity-icon bg-soft bg-info">
                  <i class="fa fa-plus-circle text-info"></i>
                </div>
                <div class="activity-info">
                  <div class="activity-title">New Exercise Added</div>
                  <p class="text-muted mb-0">Admin added "Mountain Climbers" to exercise library</p>
                  <small class="text-muted">1 day ago</small>
                </div>
              </li>
            </ul>
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

.activity-timeline {
  position: relative;
  padding-left: 32px;
  list-style: none;
  margin-bottom: 0;
}

.activity-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #f0f0f0;
}

.activity-item {
  position: relative;
  padding-bottom: 24px;
}

.activity-item:last-child {
  padding-bottom: 0;
}

.activity-icon {
  position: absolute;
  left: -32px;
  top: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-soft {
  opacity: 0.2;
}

.activity-info {
  padding-left: 0.5rem;
}

.activity-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}
</style> 