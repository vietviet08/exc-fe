/**
 * Exercise Model
 * Based on the database schema design
 */
export class Exercise {
  constructor({
    id = '',
    levelId = '',
    name = '',
    description = '',
    instructions = [],
    duration = 0,
    reps = 0,
    sets = 0,
    restTime = 0,
    image = '',
    video = '',
    tips = [],
    muscleGroups = [],
    equipment = '',
    caloriesBurn = 0,
    order = 0,
    isActive = true,
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id;
    this.levelId = levelId;
    this.name = name;
    this.description = description;
    this.instructions = instructions;
    this.duration = duration;
    this.reps = reps;
    this.sets = sets;
    this.restTime = restTime;
    this.image = image;
    this.video = video;
    this.tips = tips;
    this.muscleGroups = muscleGroups;
    this.equipment = equipment;
    this.caloriesBurn = caloriesBurn;
    this.order = order;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Convert Firestore document to Exercise object
  static fromFirestore(doc) {
    const data = doc.data();
    return new Exercise({
      id: doc.id,
      levelId: data.levelId || '',
      name: data.name || '',
      description: data.description || '',
      instructions: data.instructions || [],
      duration: data.duration || 0,
      reps: data.reps || 0,
      sets: data.sets || 0,
      restTime: data.restTime || 0,
      image: data.image || '',
      video: data.video || '',
      tips: data.tips || [],
      muscleGroups: data.muscleGroups || [],
      equipment: data.equipment || '',
      caloriesBurn: data.caloriesBurn || 0,
      order: data.order || 0,
      isActive: data.isActive !== false,
      createdAt: data.createdAt ? data.createdAt.toDate() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
    });
  }

  // Convert Exercise object to Firestore document
  toFirestore() {
    return {
      levelId: this.levelId,
      name: this.name,
      description: this.description,
      instructions: this.instructions,
      duration: this.duration,
      reps: this.reps,
      sets: this.sets,
      restTime: this.restTime,
      image: this.image,
      video: this.video,
      tips: this.tips,
      muscleGroups: this.muscleGroups,
      equipment: this.equipment,
      caloriesBurn: this.caloriesBurn,
      order: this.order,
      isActive: this.isActive,
      createdAt: this.createdAt ? new Date(this.createdAt) : new Date(),
      updatedAt: new Date()
    };
  }
} 