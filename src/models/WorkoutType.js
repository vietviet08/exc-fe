/**
 * WorkoutType Model
 * Based on the database schema design
 */
export class WorkoutType {
  constructor({
    id = '',
    categoryId = '',
    name = '',
    description = '',
    equipment = '',
    duration = '',
    difficulty = '',
    image = '',
    order = 0,
    isActive = true,
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.categoryId = categoryId;
    this.name = name;
    this.description = description;
    this.equipment = equipment;
    this.duration = duration;
    this.difficulty = difficulty;
    this.image = image;
    this.order = order;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Convert Firestore document to WorkoutType object
  static fromFirestore(doc) {
    const data = doc.data();
    return new WorkoutType({
      id: doc.id,
      categoryId: data.categoryId || '',
      name: data.name || '',
      description: data.description || '',
      equipment: data.equipment || '',
      duration: data.duration || '',
      difficulty: data.difficulty || '',
      image: data.image || '',
      order: data.order || 0,
      isActive: data.isActive !== false,
      createdAt: data.createdAt ? data.createdAt.toDate() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
    });
  }

  // Convert WorkoutType object to Firestore document
  toFirestore() {
    return {
      categoryId: this.categoryId,
      name: this.name,
      description: this.description,
      equipment: this.equipment,
      duration: this.duration,
      difficulty: this.difficulty,
      image: this.image,
      order: this.order,
      isActive: this.isActive,
      createdAt: this.createdAt ? new Date(this.createdAt) : new Date(),
      updatedAt: new Date()
    };
  }
} 