/**
 * User Progress Model
 * Based on the database schema design
 */
export class UserProgress {
  constructor({
    id = '',
    userId = '',
    levelId = '',
    exerciseId = '',
    completionDate = null,
    duration = 0,
    repsCompleted = 0,
    setsCompleted = 0,
    caloriesBurned = 0,
    difficulty = '',
    notes = '',
    createdAt = null
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.levelId = levelId;
    this.exerciseId = exerciseId;
    this.completionDate = completionDate;
    this.duration = duration;
    this.repsCompleted = repsCompleted;
    this.setsCompleted = setsCompleted;
    this.caloriesBurned = caloriesBurned;
    this.difficulty = difficulty;
    this.notes = notes;
    this.createdAt = createdAt;
  }

  // Convert Firestore document to UserProgress object
  static fromFirestore(doc) {
    const data = doc.data();
    return new UserProgress({
      id: doc.id,
      userId: data.userId || '',
      levelId: data.levelId || '',
      exerciseId: data.exerciseId || '',
      completionDate: data.completionDate ? data.completionDate.toDate() : null,
      duration: data.duration || 0,
      repsCompleted: data.repsCompleted || 0,
      setsCompleted: data.setsCompleted || 0,
      caloriesBurned: data.caloriesBurned || 0,
      difficulty: data.difficulty || '',
      notes: data.notes || '',
      createdAt: data.createdAt ? data.createdAt.toDate() : null
    });
  }

  // Convert UserProgress object to Firestore document
  toFirestore() {
    const now = new Date();
    return {
      userId: this.userId,
      levelId: this.levelId,
      exerciseId: this.exerciseId,
      completionDate: this.completionDate ? new Date(this.completionDate) : now,
      duration: this.duration,
      repsCompleted: this.repsCompleted,
      setsCompleted: this.setsCompleted,
      caloriesBurned: this.caloriesBurned,
      difficulty: this.difficulty,
      notes: this.notes,
      createdAt: this.createdAt ? new Date(this.createdAt) : now
    };
  }
} 