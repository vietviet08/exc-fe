/**
 * Plan Exercise Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.PlanExercise
 */
export class PlanExercise {
  constructor({
    plan_exercise_id = '',
    plan_id = '',
    exercise_id = '',
    order_index = 0,
    reps = 0,
    sets = 0,
    rest_time_seconds = 0,
    weight_default = 0,
    notes = '',
    is_warmup = false,
    is_cooldown = false
  } = {}) {
    this.plan_exercise_id = plan_exercise_id;
    this.plan_id = plan_id;
    this.exercise_id = exercise_id;
    this.order_index = order_index;
    this.reps = reps;
    this.sets = sets;
    this.rest_time_seconds = rest_time_seconds;
    this.weight_default = weight_default;
    this.notes = notes;
    this.is_warmup = is_warmup;
    this.is_cooldown = is_cooldown;
    
    // Additional fields to store related data (not saved to Firestore)
    this._exercise = null; // Reference to the Exercise object
  }

  // Convert Firestore document to PlanExercise object
  static fromFirestore(doc) {
    const data = doc.data();
    return new PlanExercise({
      plan_exercise_id: doc.id,
      plan_id: data.plan_id || '',
      exercise_id: data.exercise_id || '',
      order_index: data.order_index || 0,
      reps: data.reps || 0,
      sets: data.sets || 0,
      rest_time_seconds: data.rest_time_seconds || 0,
      weight_default: data.weight_default || 0,
      notes: data.notes || '',
      is_warmup: data.is_warmup === true,
      is_cooldown: data.is_cooldown === true
    });
  }

  // Convert PlanExercise object to Firestore document
  toFirestore() {
    return {
      plan_id: this.plan_id,
      exercise_id: this.exercise_id,
      order_index: this.order_index,
      reps: this.reps,
      sets: this.sets,
      rest_time_seconds: this.rest_time_seconds,
      weight_default: this.weight_default,
      notes: this.notes,
      is_warmup: this.is_warmup,
      is_cooldown: this.is_cooldown
    };
  }
  
  // Set the related exercise object
  setExercise(exercise) {
    this._exercise = exercise;
  }
  
  // Get the related exercise
  getExercise() {
    return this._exercise;
  }
} 