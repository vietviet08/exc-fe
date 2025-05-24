/**
 * User Progress Model
 * Matches the Android model: com.example.nammoadidaphat.domain.model.UserProgress
 */
export class UserProgress {
  constructor({
    progress_id = '',
    user_id = '',
    date = null,
    weight = 0,
    body_measurements = {},
    photos = [],
    notes = '',
    created_at = null
  } = {}) {
    this.progress_id = progress_id;
    this.user_id = user_id;
    this.date = date;
    this.weight = weight;
    this.body_measurements = body_measurements;
    this.photos = photos;
    this.notes = notes;
    this.created_at = created_at;
  }

  // Convert Firestore document to UserProgress object
  static fromFirestore(doc) {
    const data = doc.data();
    return new UserProgress({
      progress_id: doc.id,
      user_id: data.user_id || '',
      date: data.date ? data.date.toDate() : null,
      weight: data.weight || 0,
      body_measurements: data.body_measurements || {},
      photos: data.photos || [],
      notes: data.notes || '',
      created_at: data.created_at ? data.created_at.toDate() : null
    });
  }

  // Convert UserProgress object to Firestore document
  toFirestore() {
    const now = new Date();
    return {
      user_id: this.user_id,
      date: this.date ? new Date(this.date) : now,
      weight: this.weight,
      body_measurements: this.body_measurements,
      photos: this.photos,
      notes: this.notes,
      created_at: this.created_at ? new Date(this.created_at) : now
    };
  }
} 