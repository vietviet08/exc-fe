/**
 * WorkoutSession Model
 * Based on the database schema design
 */
export class WorkoutSession {
  constructor({
    id = '',
    userId = '',
    levelId = '',
    startTime = null,
    endTime = null,
    duration = 0,
    totalCaloriesBurned = 0,
    completedExercises = [],
    status = 'pending',
    notes = '',
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.levelId = levelId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = duration;
    this.totalCaloriesBurned = totalCaloriesBurned;
    this.completedExercises = completedExercises;
    this.status = status;
    this.notes = notes;
  }

  // Convert Firestore document to WorkoutSession object
  static fromFirestore(doc) {
    const data = doc.data();
    return new WorkoutSession({
      id: doc.id,
      userId: data.userId || '',
      levelId: data.levelId || '',
      startTime: data.startTime ? data.startTime.toDate() : null,
      endTime: data.endTime ? data.endTime.toDate() : null,
      duration: data.duration || 0,
      totalCaloriesBurned: data.totalCaloriesBurned || 0,
      completedExercises: data.completedExercises || [],
      status: data.status || 'pending',
      notes: data.notes || '',
    });
  }

  // Convert WorkoutSession object to Firestore document
  toFirestore() {
    return {
      userId: this.userId,
      levelId: this.levelId,
      startTime: this.startTime ? new Date(this.startTime) : new Date(),
      endTime: this.endTime ? new Date(this.endTime) : null,
      duration: this.duration,
      totalCaloriesBurned: this.totalCaloriesBurned,
      completedExercises: this.completedExercises,
      status: this.status,
      notes: this.notes,
    };
  }
} 