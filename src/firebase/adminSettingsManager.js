import { db } from './config';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AdminSettings } from '../models';

const ADMIN_SETTINGS_COLLECTION = 'adminSettings';
const DEFAULT_SETTINGS_ID = 'global';

/**
 * Get admin settings
 * @returns {Promise<AdminSettings>} Admin settings
 */
export const getAdminSettings = async () => {
  try {
    const docRef = doc(db, ADMIN_SETTINGS_COLLECTION, DEFAULT_SETTINGS_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return AdminSettings.fromFirestore(docSnap);
    } else {
      // Create default settings if they don't exist
      const defaultSettings = new AdminSettings({
        id: DEFAULT_SETTINGS_ID,
        appVersion: '1.0.0',
        adminEmailList: [],
        featureModeSetting: {
          enablePremiumFeatures: false,
          enableUserRegistration: true
        },
        notifications: {
          enablePushNotifications: false,
          reminderFrequency: 'daily'
        }
      });
      
      await setDoc(docRef, defaultSettings.toFirestore());
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting admin settings:', error);
    throw error;
  }
};

/**
 * Update admin settings
 * @param {AdminSettings} settings - The admin settings to update
 * @returns {Promise<void>}
 */
export const updateAdminSettings = async (settings) => {
  try {
    const docRef = doc(db, ADMIN_SETTINGS_COLLECTION, DEFAULT_SETTINGS_ID);
    await updateDoc(docRef, settings.toFirestore());
  } catch (error) {
    console.error('Error updating admin settings:', error);
    throw error;
  }
};

/**
 * Add admin email to the admin email list
 * @param {string} email - The email to add
 * @returns {Promise<void>}
 */
export const addAdminEmail = async (email) => {
  try {
    const settings = await getAdminSettings();
    if (!settings.adminEmailList.includes(email)) {
      settings.adminEmailList.push(email);
      await updateAdminSettings(settings);
    }
  } catch (error) {
    console.error('Error adding admin email:', error);
    throw error;
  }
};

/**
 * Remove admin email from the admin email list
 * @param {string} email - The email to remove
 * @returns {Promise<void>}
 */
export const removeAdminEmail = async (email) => {
  try {
    const settings = await getAdminSettings();
    settings.adminEmailList = settings.adminEmailList.filter(e => e !== email);
    await updateAdminSettings(settings);
  } catch (error) {
    console.error('Error removing admin email:', error);
    throw error;
  }
};

/**
 * Update app version
 * @param {string} version - The new app version
 * @returns {Promise<void>}
 */
export const updateAppVersion = async (version) => {
  try {
    const settings = await getAdminSettings();
    settings.appVersion = version;
    await updateAdminSettings(settings);
  } catch (error) {
    console.error('Error updating app version:', error);
    throw error;
  }
};

/**
 * Update feature mode settings
 * @param {object} featureSettings - The feature settings to update
 * @returns {Promise<void>}
 */
export const updateFeatureSettings = async (featureSettings) => {
  try {
    const settings = await getAdminSettings();
    settings.featureModeSetting = {
      ...settings.featureModeSetting,
      ...featureSettings
    };
    await updateAdminSettings(settings);
  } catch (error) {
    console.error('Error updating feature settings:', error);
    throw error;
  }
};

/**
 * Update notification settings
 * @param {object} notificationSettings - The notification settings to update
 * @returns {Promise<void>}
 */
export const updateNotificationSettings = async (notificationSettings) => {
  try {
    const settings = await getAdminSettings();
    settings.notifications = {
      ...settings.notifications,
      ...notificationSettings
    };
    await updateAdminSettings(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}; 