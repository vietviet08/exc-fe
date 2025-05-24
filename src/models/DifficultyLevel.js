/**
 * Difficulty Level Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.DifficultyLevel
 */
export class DifficultyLevel {
  constructor({
    level_id = '',
    sub_category_id = '',
    name = '',
    description = '',
    icon_url = '',
    color = '',
    level_requirements = '',
    is_active = true,
    created_at = null
  } = {}) {
    this.level_id = level_id;
    this.sub_category_id = sub_category_id;
    this.name = name;
    this.description = description;
    this.icon_url = icon_url;
    this.color = color;
    this.level_requirements = level_requirements;
    this.is_active = is_active;
    this.created_at = created_at;
  }

  // Convert Firestore document to DifficultyLevel object
  static fromFirestore(doc) {
    const data = doc.data();
    return new DifficultyLevel({
      level_id: doc.id,
      sub_category_id: data.sub_category_id || '',
      name: data.name || '',
      description: data.description || '',
      icon_url: data.icon_url || '',
      color: data.color || '',
      level_requirements: data.level_requirements || '',
      is_active: data.is_active !== false, // default to true if not specified
      created_at: data.created_at ? data.created_at.toDate() : null
    });
  }

  // Convert DifficultyLevel object to Firestore document
  toFirestore() {
    return {
      sub_category_id: this.sub_category_id,
      name: this.name,
      description: this.description,
      icon_url: this.icon_url,
      color: this.color,
      level_requirements: this.level_requirements,
      is_active: this.is_active,
      created_at: this.created_at ? new Date(this.created_at) : new Date()
    };
  }
} 