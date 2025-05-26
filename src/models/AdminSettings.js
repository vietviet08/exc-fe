/**
 * AdminSettings Model
 * Based on the database schema design
 */
export class AdminSettings {
  constructor({
    id = '',
    appVersion = '',
    adminEmailList = [],
    featureModeSetting = {},
    notifications = {}
  } = {}) {
    this.id = id;
    this.appVersion = appVersion;
    this.adminEmailList = adminEmailList;
    this.featureModeSetting = featureModeSetting;
    this.notifications = notifications;
  }

  // Convert Firestore document to AdminSettings object
  static fromFirestore(doc) {
    const data = doc.data();
    return new AdminSettings({
      id: doc.id,
      appVersion: data.appVersion || '',
      adminEmailList: data.adminEmailList || [],
      featureModeSetting: data.featureModeSetting || {},
      notifications: data.notifications || {}
    });
  }

  // Convert AdminSettings object to Firestore document
  toFirestore() {
    return {
      appVersion: this.appVersion,
      adminEmailList: this.adminEmailList,
      featureModeSetting: this.featureModeSetting,
      notifications: this.notifications
    };
  }
} 