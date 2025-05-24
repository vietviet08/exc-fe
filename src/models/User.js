/**
 * User Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.User
 */
export class User {
  constructor({
    userId = '',
    email = '',
    passwordHash = '',
    fullName = '',
    avatarUrl = '',
    age = null,
    gender = '',
    height = null,
    weight = null,
    fitnessLevel = '',
    goals = '',
    isPremium = false,
    createdAt = '',
    updatedAt = '',
    authProvider = 'password', // "password", "google.com", "facebook.com"
    role = 'user' // "user" or "admin" - specific for web admin panel
  } = {}) {
    this.userId = userId;
    this.email = email;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.avatarUrl = avatarUrl;
    this.age = age;
    this.gender = gender;
    this.height = height;
    this.weight = weight;
    this.fitnessLevel = fitnessLevel;
    this.goals = goals;
    this.isPremium = isPremium;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.authProvider = authProvider;
    this.role = role;
  }

  // Convert Firestore document to User object
  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      userId: doc.id,
      email: data.email || '',
      passwordHash: data.password_hash || '',
      fullName: data.full_name || '',
      avatarUrl: data.avatar_url || '',
      age: data.age || null,
      gender: data.gender || '',
      height: data.height || null,
      weight: data.weight || null,
      fitnessLevel: data.fitness_level || '',
      goals: data.goals || '',
      isPremium: data.is_premium === true,
      createdAt: data.created_at || '',
      updatedAt: data.updated_at || '',
      authProvider: data.auth_provider || 'password',
      role: data.role || 'user'
    });
  }

  // Convert User object to Firestore document
  toFirestore() {
    const now = new Date().toISOString();
    return {
      user_id: this.userId,
      email: this.email,
      password_hash: this.passwordHash,
      full_name: this.fullName,
      avatar_url: this.avatarUrl,
      age: this.age,
      gender: this.gender,
      height: this.height,
      weight: this.weight,
      fitness_level: this.fitnessLevel,
      goals: this.goals,
      is_premium: this.isPremium,
      created_at: this.createdAt || now,
      updated_at: now,
      auth_provider: this.authProvider,
      role: this.role
    };
  }

  // Check if all required profile fields are present
  hasCompleteProfile() {
    return this.fullName && 
           this.gender && 
           this.age !== null && 
           this.height !== null && 
           this.weight !== null && 
           this.fitnessLevel && 
           this.goals;
  }
  
  // Check if user is admin
  isAdmin() {
    return this.role === 'admin';
  }
  
  // Create a safe user object with just the essential fields
  static createMinimalUser(userId, email, authProvider = 'password', role = 'user') {
    return new User({
      userId,
      email,
      authProvider,
      role
    });
  }
} 