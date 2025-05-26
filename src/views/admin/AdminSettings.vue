<script>
import { ref, onMounted } from 'vue';
import { getAdminSettings, updateAdminSettings, addAdminEmail, removeAdminEmail } from '@/firebase/adminSettingsManager';
import { AdminSettings } from '@/models';

export default {
  name: 'AdminSettingsView',
  setup() {
    const settings = ref(new AdminSettings({}));
    const loading = ref(true);
    const error = ref(null);
    const success = ref(null);
    const newAdminEmail = ref('');

    // Fetch admin settings
    const fetchSettings = async () => {
      loading.value = true;
      error.value = null;
      try {
        settings.value = await getAdminSettings();
      } catch (err) {
        console.error('Error fetching admin settings:', err);
        error.value = 'Failed to load admin settings. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Save admin settings
    const saveSettings = async () => {
      loading.value = true;
      error.value = null;
      success.value = null;
      try {
        await updateAdminSettings(settings.value);
        success.value = 'Settings saved successfully!';
      } catch (err) {
        console.error('Error saving admin settings:', err);
        error.value = 'Failed to save settings. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Add admin email
    const addAdmin = async () => {
      if (!newAdminEmail.value) return;
      
      loading.value = true;
      error.value = null;
      success.value = null;
      try {
        await addAdminEmail(newAdminEmail.value);
        newAdminEmail.value = '';
        await fetchSettings(); // Refresh the list
        success.value = 'Admin email added successfully!';
      } catch (err) {
        console.error('Error adding admin email:', err);
        error.value = 'Failed to add admin email. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Remove admin email
    const removeAdmin = async (email) => {
      loading.value = true;
      error.value = null;
      success.value = null;
      try {
        await removeAdminEmail(email);
        await fetchSettings(); // Refresh the list
        success.value = 'Admin email removed successfully!';
      } catch (err) {
        console.error('Error removing admin email:', err);
        error.value = 'Failed to remove admin email. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    // Initialize component
    onMounted(fetchSettings);

    return {
      settings,
      loading,
      error,
      success,
      newAdminEmail,
      saveSettings,
      addAdmin,
      removeAdmin
    };
  }
};
</script>

<template>
  <div class="admin-settings">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Admin Settings</h1>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">Application Settings</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label for="appVersion" class="form-label">App Version</label>
            <input
              type="text"
              class="form-control"
              id="appVersion"
              v-model="settings.appVersion"
            >
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">Admin Users</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label for="newAdminEmail" class="form-label">Add Admin Email</label>
            <div class="input-group">
              <input
                type="email"
                class="form-control"
                id="newAdminEmail"
                v-model="newAdminEmail"
                placeholder="admin@example.com"
              >
              <button class="btn btn-primary" @click="addAdmin">Add</button>
            </div>
          </div>

          <div v-if="settings.adminEmailList.length === 0" class="alert alert-info">
            No admin emails added yet.
          </div>

          <ul v-else class="list-group">
            <li v-for="(email, index) in settings.adminEmailList" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
              {{ email }}
              <button class="btn btn-sm btn-danger" @click="removeAdmin(email)">
                <i class="bi bi-trash"></i>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">Feature Settings</h5>
        </div>
        <div class="card-body">
          <div class="form-check form-switch mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="enablePremiumFeatures"
              v-model="settings.featureModeSetting.enablePremiumFeatures"
            >
            <label class="form-check-label" for="enablePremiumFeatures">
              Enable Premium Features
            </label>
          </div>

          <div class="form-check form-switch mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="enableUserRegistration"
              v-model="settings.featureModeSetting.enableUserRegistration"
            >
            <label class="form-check-label" for="enableUserRegistration">
              Enable User Registration
            </label>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">Notification Settings</h5>
        </div>
        <div class="card-body">
          <div class="form-check form-switch mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="enablePushNotifications"
              v-model="settings.notifications.enablePushNotifications"
            >
            <label class="form-check-label" for="enablePushNotifications">
              Enable Push Notifications
            </label>
          </div>

          <div class="mb-3">
            <label for="reminderFrequency" class="form-label">Reminder Frequency</label>
            <select
              id="reminderFrequency"
              class="form-select"
              v-model="settings.notifications.reminderFrequency"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
        <button class="btn btn-primary" @click="saveSettings" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template> 