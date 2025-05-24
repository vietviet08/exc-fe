/**
 * Main Category Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.MainCategory
 */
export class MainCategory {
  constructor({
    category_id = '',
    name = '',
    name_en = '',
    description = '',
    icon_url = '',
    color = '',
    sort_order = 0,
    is_active = true,
    updated_at = null
  } = {}) {
    this.category_id = category_id;
    this.name = name;
    this.name_en = name_en;
    this.description = description;
    this.icon_url = icon_url;
    this.color = color;
    this.sort_order = sort_order;
    this.is_active = is_active;
    this.updated_at = updated_at;
  }

  // Convert Firestore document to MainCategory object
  static fromFirestore(doc) {
    const data = doc.data();
    return new MainCategory({
      category_id: doc.id,
      name: data.name || '',
      name_en: data.name_en || '',
      description: data.description || '',
      icon_url: data.icon_url || '',
      color: data.color || '',
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== false, // default to true if not specified
      updated_at: data.updated_at ? data.updated_at.toDate() : null
    });
  }

  // Convert MainCategory object to Firestore document
  toFirestore() {
    return {
      name: this.name,
      name_en: this.name_en,
      description: this.description,
      icon_url: this.icon_url,
      color: this.color,
      sort_order: this.sort_order,
      is_active: this.is_active,
      updated_at: this.updated_at ? new Date(this.updated_at) : new Date()
    };
  }
} 