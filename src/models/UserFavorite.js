/**
 * User Favorite Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.UserFavorite
 */
export class UserFavorite {
  constructor({
    favorite_id = '',
    user_id = '',
    plan_id = '',
    created_at = null
  } = {}) {
    this.favorite_id = favorite_id;
    this.user_id = user_id;
    this.plan_id = plan_id;
    this.created_at = created_at;
    
    // Additional fields to store related data (not saved to Firestore)
    this._workout_plan = null; // Reference to the related WorkoutPlan
  }

  // Convert Firestore document to UserFavorite object
  static fromFirestore(doc) {
    const data = doc.data();
    return new UserFavorite({
      favorite_id: doc.id,
      user_id: data.user_id || '',
      plan_id: data.plan_id || '',
      created_at: data.created_at ? data.created_at.toDate() : null
    });
  }

  // Convert UserFavorite object to Firestore document
  toFirestore() {
    const now = new Date();
    return {
      user_id: this.user_id,
      plan_id: this.plan_id,
      created_at: this.created_at ? new Date(this.created_at) : now
    };
  }
  
  // Set the related workout plan
  setWorkoutPlan(workoutPlan) {
    this._workout_plan = workoutPlan;
  }
  
  // Get the related workout plan
  getWorkoutPlan() {
    return this._workout_plan;
  }
} 