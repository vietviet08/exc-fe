/**
 * Workout Plan Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.WorkoutPlan
 */
export class WorkoutPlan {
  constructor({
    plan_id = '',
    level_id = '',
    name = '',
    description = '',
    thumbnail_url = '',
    estimated_duration = 0,
    estimated_calories = 0,
    equipment_needed = [],
    sort_order = 0,
    is_premium = false,
    is_active = true,
    created_at = null
  } = {}) {
    this.plan_id = plan_id;
    this.level_id = level_id;
    this.name = name;
    this.description = description;
    this.thumbnail_url = thumbnail_url;
    this.estimated_duration = estimated_duration;
    this.estimated_calories = estimated_calories;
    this.equipment_needed = equipment_needed;
    this.sort_order = sort_order;
    this.is_premium = is_premium;
    this.is_active = is_active;
    this.created_at = created_at;
  }

  // Convert Firestore document to WorkoutPlan object
  static fromFirestore(doc) {
    const data = doc.data();
    return new WorkoutPlan({
      plan_id: doc.id,
      level_id: data.level_id || '',
      name: data.name || '',
      description: data.description || '',
      thumbnail_url: data.thumbnail_url || '',
      estimated_duration: data.estimated_duration || 0,
      estimated_calories: data.estimated_calories || 0,
      equipment_needed: data.equipment_needed || [],
      sort_order: data.sort_order || 0,
      is_premium: data.is_premium === true,
      is_active: data.is_active !== false, // default to true if not specified
      created_at: data.created_at ? data.created_at.toDate() : null
    });
  }

  // Convert WorkoutPlan object to Firestore document
  toFirestore() {
    return {
      level_id: this.level_id,
      name: this.name,
      description: this.description,
      thumbnail_url: this.thumbnail_url,
      estimated_duration: this.estimated_duration,
      estimated_calories: this.estimated_calories,
      equipment_needed: this.equipment_needed,
      sort_order: this.sort_order,
      is_premium: this.is_premium,
      is_active: this.is_active,
      created_at: this.created_at ? new Date(this.created_at) : new Date()
    };
  }
} 