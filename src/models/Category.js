/**
 * Category Model
 * Based on the database schema design
 */
export class Category {
  constructor({
    id = '',
    name = '',
    description = '',
    icon = '',
    order = 0,
    isActive = true,
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.icon = icon;
    this.order = order;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Convert Firestore document to Category object
  static fromFirestore(doc) {
    const data = doc.data();
    return new Category({
      id: doc.id,
      name: data.name || '',
      description: data.description || '',
      icon: data.icon || '',
      order: data.order || 0,
      isActive: data.isActive !== false,
      createdAt: data.createdAt ? data.createdAt.toDate() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
    });
  }

  // Convert Category object to Firestore document
  toFirestore() {
    return {
      name: this.name,
      description: this.description,
      icon: this.icon,
      order: this.order,
      isActive: this.isActive,
      createdAt: this.createdAt ? new Date(this.createdAt) : new Date(),
      updatedAt: new Date()
    };
  }
} 