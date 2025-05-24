<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: [Number, String],
      required: true
    },
    icon: {
      type: String,
      default: 'fa-chart-bar'
    },
    color: {
      type: String,
      default: 'primary',
      validator: (value) => {
        return ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(value);
      }
    },
    valuePrefix: {
      type: String,
      default: ''
    },
    valueSuffix: {
      type: String,
      default: ''
    },
    isGrowing: {
      type: Boolean,
      default: null
    },
    percentage: {
      type: Number,
      default: null
    }
  }
};
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="d-flex align-items-center">
        <div class="avatar-md rounded-circle bg-light p-2 me-3">
          <div :class="`avatar-title rounded-circle bg-${color} text-white`">
            <i :class="`fa ${icon}`"></i>
          </div>
        </div>
        <div class="flex-grow-1">
          <h5 class="mb-2">{{ title }}</h5>
          <h4 class="mb-1">{{ valuePrefix }}{{ value }}{{ valueSuffix }}</h4>
          <div v-if="percentage !== null" class="text-nowrap">
            <span :class="`text-${isGrowing ? 'success' : 'danger'}`">
              <i :class="`fa fa-arrow-${isGrowing ? 'up' : 'down'} me-1`"></i>{{ percentage }}%
            </span>
            <span class="text-muted ms-2">Since last month</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-md {
  height: 4rem;
  width: 4rem;
}

.avatar-title {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
  font-size: 1.5rem;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.bg-primary {
  background-color: #556ee6 !important;
}

.bg-success {
  background-color: #34c38f !important;
}

.bg-info {
  background-color: #50a5f1 !important;
}

.bg-warning {
  background-color: #f1b44c !important;
}

.bg-danger {
  background-color: #f46a6a !important;
}

.bg-secondary {
  background-color: #74788d !important;
}
</style> 