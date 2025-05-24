/**
 * Sub Category Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.SubCategory
 */
export class SubCategory {
  constructor({
    sub_category_id = '',
    category_id = '',
    name = '',
    name_en = '',
    description = '',
    target_body_parts = [],
    color = '',
    icon_url = '',
    sort_order = 0,
    is_active = true,
    created_at = null
  } = {}) {
    this.sub_category_id = sub_category_id;
    this.category_id = category_id;
    this.name = name;
    this.name_en = name_en;
    this.description = description;
    this.target_body_parts = target_body_parts;
    this.color = color;
    this.icon_url = icon_url;
    this.sort_order = sort_order;
    this.is_active = is_active;
    this.created_at = created_at;
  }

  // Convert Firestore document to SubCategory object
  static fromFirestore(doc) {
    const data = doc.data();
    return new SubCategory({
      sub_category_id: doc.id,
      category_id: data.category_id || '',
      name: data.name || '',
      name_en: data.name_en || '',
      description: data.description || '',
      target_body_parts: data.target_body_parts || [],
      color: data.color || '',
      icon_url: data.icon_url || '',
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== false, // default to true if not specified
      created_at: data.created_at ? data.created_at.toDate() : null
    });
  }

  // Convert SubCategory object to Firestore document
  toFirestore() {
    return {
      category_id: this.category_id,
      name: this.name,
      name_en: this.name_en,
      description: this.description,
      target_body_parts: this.target_body_parts,
      color: this.color,
      icon_url: this.icon_url,
      sort_order: this.sort_order,
      is_active: this.is_active,
      created_at: this.created_at ? new Date(this.created_at) : new Date()
    };
  }
} 