/**
 * Exercise Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.Exercise
 */
export class Exercise {
  constructor({
    exercise_id = '',
    name = '',
    name_en = '',
    description = '',
    instructions = [],
    thumbnail_url = '',
    video_url = '',
    gif_url = '',
    target_muscles = [],
    equipment_needed = [],
    calories_per_minute = 0,
    is_time_default = false,
    is_reps_based = true,
    created_at = null,
    updated_at = null
  } = {}) {
    this.exercise_id = exercise_id;
    this.name = name;
    this.name_en = name_en;
    this.description = description;
    this.instructions = instructions;
    this.thumbnail_url = thumbnail_url;
    this.video_url = video_url;
    this.gif_url = gif_url;
    this.target_muscles = target_muscles;
    this.equipment_needed = equipment_needed;
    this.calories_per_minute = calories_per_minute;
    this.is_time_default = is_time_default;
    this.is_reps_based = is_reps_based;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Convert Firestore document to Exercise object
  static fromFirestore(doc) {
    const data = doc.data();
    return new Exercise({
      exercise_id: doc.id,
      name: data.name || '',
      name_en: data.name_en || '',
      description: data.description || '',
      instructions: data.instructions || [],
      thumbnail_url: data.thumbnail_url || '',
      video_url: data.video_url || '',
      gif_url: data.gif_url || '',
      target_muscles: data.target_muscles || [],
      equipment_needed: data.equipment_needed || [],
      calories_per_minute: data.calories_per_minute || 0,
      is_time_default: data.is_time_default === true,
      is_reps_based: data.is_reps_based !== false, // default to true if not specified
      created_at: data.created_at ? data.created_at.toDate() : null,
      updated_at: data.updated_at ? data.updated_at.toDate() : null
    });
  }

  // Convert Exercise object to Firestore document
  toFirestore() {
    const now = new Date();
    return {
      name: this.name,
      name_en: this.name_en,
      description: this.description,
      instructions: this.instructions,
      thumbnail_url: this.thumbnail_url,
      video_url: this.video_url,
      gif_url: this.gif_url,
      target_muscles: this.target_muscles,
      equipment_needed: this.equipment_needed,
      calories_per_minute: this.calories_per_minute,
      is_time_default: this.is_time_default,
      is_reps_based: this.is_reps_based,
      created_at: this.created_at ? new Date(this.created_at) : now,
      updated_at: now
    };
  }
} 