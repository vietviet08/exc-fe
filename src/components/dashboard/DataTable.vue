<script>
import { computed } from 'vue';

export default {
  props: {
    title: {
      type: String,
      default: 'Data'
    },
    columns: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    perPage: {
      type: Number,
      default: 10
    },
    currentPage: {
      type: Number,
      default: 1
    },
    sortBy: {
      type: String,
      default: ''
    },
    sortDirection: {
      type: String,
      default: 'asc'
    }
  },
  
  emits: [
    'update:currentPage', 
    'update:sortBy', 
    'update:sortDirection'
  ],
  
  setup(props, { slots, emit }) {
    // Compute total pages
    const totalPages = computed(() => {
      return Math.ceil(props.items.length / props.perPage);
    });
    
    // Compute paginated items
    const paginatedItems = computed(() => {
      const start = (props.currentPage - 1) * props.perPage;
      const end = start + props.perPage;
      return props.items.slice(start, end);
    });
    
    // Check if a column has a custom slot
    const hasSlot = (key) => {
      return !!slots[key];
    };
    
    // Toggle sort
    const sort = (column) => {
      if (column.sortable === false) return;
      
      if (props.sortBy === column.key) {
        // Toggle direction if already sorting by this column
        const newDirection = props.sortDirection === 'asc' ? 'desc' : 'asc';
        emit('update:sortDirection', newDirection);
      } else {
        // Set new sort column and default to ascending
        emit('update:sortBy', column.key);
        emit('update:sortDirection', 'asc');
      }
    };
    
    // Page navigation
    const goToPage = (page) => {
      if (page > 0 && page <= totalPages.value) {
        emit('update:currentPage', page);
      }
    };
    
    // Get cell value
    const getCellValue = (item, column) => {
      const key = column.key;
      if (typeof column.formatter === 'function') {
        return column.formatter(item[key], item);
      }
      return item[key];
    };
    
    // Generate page array for pagination
    const pageArray = computed(() => {
      const total = totalPages.value;
      const current = props.currentPage;
      const delta = 2; // How many pages to show before and after current page
      const pages = [];
      
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of range
      let start = Math.max(2, current - delta);
      let end = Math.min(total - 1, current + delta);
      
      // Adjust if we're near the beginning
      if (current - delta <= 1) {
        end = Math.min(1 + 2 * delta, total - 1);
      }
      
      // Adjust if we're near the end
      if (current + delta >= total) {
        start = Math.max(2, total - 2 * delta);
      }
      
      // Add ellipsis if needed after first page
      if (start > 2) {
        pages.push('...');
      }
      
      // Add pages in range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed before last page
      if (end < total - 1) {
        pages.push('...');
      }
      
      // Always show last page if more than 1 page
      if (total > 1) {
        pages.push(total);
      }
      
      return pages;
    });
    
    return {
      paginatedItems,
      totalPages,
      hasSlot,
      sort,
      goToPage,
      getCellValue,
      pageArray
    };
  }
};
</script>

<template>
  <div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="card-title mb-0">{{ title }}</h5>
      <div class="card-tools">
        <slot name="table-tools"></slot>
      </div>
    </div>
    <div class="card-body">
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="items.length === 0" class="text-center my-5">
        <p class="mb-0 text-muted">No data available</p>
      </div>
      <div v-else>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th v-for="column in columns" :key="column.key" @click="sort(column)" 
                  :class="{ 'sortable': column.sortable !== false, 'sorted': sortBy === column.key }">
                  {{ column.label }}
                  <span v-if="sortBy === column.key" class="sort-icon ms-1">
                    <i :class="sortDirection === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down'"></i>
                  </span>
                </th>
                <th v-if="$slots.actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in paginatedItems" :key="item.id || index">
                <td v-for="column in columns" :key="column.key">
                  <!-- Custom cell template if provided -->
                  <slot :name="column.key" :value="getCellValue(item, column)" :item="item">
                    {{ getCellValue(item, column) }}
                  </slot>
                </td>
                <!-- Actions column if actions slot is provided -->
                <td v-if="$slots.actions">
                  <slot name="actions" :item="item" :index="index"></slot>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center mt-3">
          <div>
            <span class="text-muted">
              Showing {{ ((currentPage - 1) * perPage) + 1 }} to 
              {{ Math.min(currentPage * perPage, items.length) }} of 
              {{ items.length }} entries
            </span>
          </div>
          <nav aria-label="Table pagination">
            <ul class="pagination mb-0">
              <!-- Previous button -->
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(currentPage - 1)" aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>
              
              <!-- Page numbers -->
              <li v-for="(page, index) in pageArray" :key="index" 
                  :class="{ 'page-item': true, 'active': page === currentPage, 'disabled': page === '...' }">
                <button v-if="page === '...'" class="page-link" disabled>...</button>
                <button v-else class="page-link" @click="goToPage(page)">{{ page }}</button>
              </li>
              
              <!-- Next button -->
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="goToPage(currentPage + 1)" aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sortable {
  cursor: pointer;
}

.sortable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.sorted {
  background-color: rgba(0, 0, 0, 0.03);
}

.table > :not(:first-child) {
  border-top: 1px solid currentColor;
}
</style> 