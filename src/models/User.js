/**
 * User Model
 * Based on the database schema design
 */
export class User {
  constructor({
    id = '',
    email = '',
    displayName = '',
    avatar = '',
    age = null,
    gender = '',
    height = null,
    weight = null,
    fitnessLevel = '',
    goals = [],
    preferences = {},
    createdAt = null,
    updatedAt = null,
    authProvider = 'password', // "password", "google.com", "facebook.com"
    role = 'user' // "user" or "admin" - specific for web admin panel
  } = {}) {
    this.id = id;
    this.email = email;
    this.displayName = displayName;
    this.avatar = avatar;
    this.age = age;
    this.gender = gender;
    this.height = height;
    this.weight = weight;
    this.fitnessLevel = fitnessLevel;
    this.goals = goals;
    this.preferences = preferences;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.authProvider = authProvider;
    this.role = role;
  }

  // Convert Firestore document to User object
  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      id: doc.id,
      email: data.email || '',
      displayName: data.displayName || '',
      avatar: data.avatar || '',
      age: data.age || null,
      gender: data.gender || '',
      height: data.height || null,
      weight: data.weight || null,
      fitnessLevel: data.fitnessLevel || '',
      goals: data.goals || [],
      preferences: data.preferences || {},
      createdAt: data.createdAt ? data.createdAt.toDate() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      authProvider: data.authProvider || 'password',
      role: data.role || 'user'
    });
  }

  // Convert User object to Firestore document
  toFirestore() {
    return {
      email: this.email,
      displayName: this.displayName,
      avatar: this.avatar,
      age: this.age,
      gender: this.gender,
      height: this.height,
      weight: this.weight,
      fitnessLevel: this.fitnessLevel,
      goals: this.goals,
      preferences: this.preferences,
      createdAt: this.createdAt ? new Date(this.createdAt) : new Date(),
      updatedAt: new Date(),
      authProvider: this.authProvider,
      role: this.role
    };
  }

  // Check if all required profile fields are present
  hasCompleteProfile() {
    return this.displayName && 
           this.gender && 
           this.age !== null && 
           this.height !== null && 
           this.weight !== null && 
           this.fitnessLevel;
  }
  
  // Check if user is admin
  isAdmin() {
    return this.role === 'admin';
  }
  
  // Create a safe user object with just the essential fields
  static createMinimalUser(userId, email, authProvider = 'password', role = 'user') {
    return new User({
      id: userId,
      email,
      authProvider,
      role
    });
  }
} 