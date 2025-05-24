/**
 * User Workout Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.UserWorkout
 */
export class UserWorkout {
  constructor({
    workout_id = '',
    user_id = '',
    plan_id = '',
    start_time = null,
    end_time = null,
    total_duration = 0,
    calories_burned = 0,
    exercises_completed = 0,
    completion_status = '',
    completion_rating = 0,
    notes = '',
    difficulty_rating = 0,
    created_at = null
  } = {}) {
    this.workout_id = workout_id;
    this.user_id = user_id;
    this.plan_id = plan_id;
    this.start_time = start_time;
    this.end_time = end_time;
    this.total_duration = total_duration;
    this.calories_burned = calories_burned;
    this.exercises_completed = exercises_completed;
    this.completion_status = completion_status;
    this.completion_rating = completion_rating;
    this.notes = notes;
    this.difficulty_rating = difficulty_rating;
    this.created_at = created_at;
    
    // Additional fields to store related data (not saved to Firestore)
    this._workout_plan = null; // Reference to the related WorkoutPlan
  }

  // Convert Firestore document to UserWorkout object
  static fromFirestore(doc) {
    const data = doc.data();
    return new UserWorkout({
      workout_id: doc.id,
      user_id: data.user_id || '',
      plan_id: data.plan_id || '',
      start_time: data.start_time ? data.start_time.toDate() : null,
      end_time: data.end_time ? data.end_time.toDate() : null,
      total_duration: data.total_duration || 0,
      calories_burned: data.calories_burned || 0,
      exercises_completed: data.exercises_completed || 0,
      completion_status: data.completion_status || '',
      completion_rating: data.completion_rating || 0,
      notes: data.notes || '',
      difficulty_rating: data.difficulty_rating || 0,
      created_at: data.created_at ? data.created_at.toDate() : null
    });
  }

  // Convert UserWorkout object to Firestore document
  toFirestore() {
    const now = new Date();
    return {
      user_id: this.user_id,
      plan_id: this.plan_id,
      start_time: this.start_time ? new Date(this.start_time) : null,
      end_time: this.end_time ? new Date(this.end_time) : null,
      total_duration: this.total_duration,
      calories_burned: this.calories_burned,
      exercises_completed: this.exercises_completed,
      completion_status: this.completion_status,
      completion_rating: this.completion_rating,
      notes: this.notes,
      difficulty_rating: this.difficulty_rating,
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