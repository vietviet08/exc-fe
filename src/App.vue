<script setup>
import { useStore } from 'vuex';
import { computed } from 'vue';

const store = useStore();
const loading = computed(() => store.state.loading);
</script>

<template>
  <div class="app-container">
    <div v-if="loading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
