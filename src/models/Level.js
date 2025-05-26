/**
 * Level Model
 * Based on the database schema design
 */
export class Level {
  constructor({
    id = '',
    workoutTypeId = '',
    name = '',
    description = '',
    difficulty = '',
    extraDescription = '',
    caloriesBurn = 0,
    order = 0,
    isActive = true,
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.workoutTypeId = workoutTypeId;
    this.name = name;
    this.description = description;
    this.difficulty = difficulty;
    this.extraDescription = extraDescription;
    this.caloriesBurn = caloriesBurn;
    this.order = order;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Convert Firestore document to Level object
  static fromFirestore(doc) {
    const data = doc.data();
    return new Level({
      id: doc.id,
      workoutTypeId: data.workoutTypeId || '',
      name: data.name || '',
      description: data.description || '',
      difficulty: data.difficulty || '',
      extraDescription: data.extraDescription || '',
      caloriesBurn: data.caloriesBurn || 0,
      order: data.order || 0,
      isActive: data.isActive !== false,
      createdAt: data.createdAt ? data.createdAt.toDate() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
    });
  }

  // Convert Level object to Firestore document
  toFirestore() {
    return {
      workoutTypeId: this.workoutTypeId,
      name: this.name,
      description: this.description,
      difficulty: this.difficulty,
      extraDescription: this.extraDescription,
      caloriesBurn: this.caloriesBurn,
      order: this.order,
      isActive: this.isActive,
      createdAt: this.createdAt ? new Date(this.createdAt) : new Date(),
      updatedAt: new Date()
    };
  }
} 