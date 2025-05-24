<script>
import { ref, onMounted, computed } from 'vue';
import DataTable from '@/components/dashboard/DataTable.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import ImageUploader from '@/components/dashboard/ImageUploader.vue';
import { db } from '@/firebase/config';
import { 
  collection, getDocs, doc, addDoc, updateDoc, deleteDoc, 
  query, orderBy, where, writeBatch, getDoc
} from 'firebase/firestore';
import { Exercise } from '@/models/Exercise';
import { Modal } from 'bootstrap';

export default {
  components: {
    DataTable,
    StatCard,
    ImageUploader
  },
  setup() {
// State
const exercises = ref([]);
const loading = ref(true);
    const currentExercise = ref(new Exercise({}));
    const isEditing = ref(false);
    const targetMuscleOptions = ref([
      'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 
      'Abs', 'Legs', 'Calves', 'Glutes', 'Cardio', 'Full Body'
    ]);
    const equipmentOptions = ref([
      'None', 'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Bands', 
      'Pull-up Bar', 'Bench', 'Swiss Ball', 'Yoga Mat'
    ]);
    const searchTerm = ref('');
    const selectedMuscleFilter = ref('');

    // Modal refs
    const exerciseModal = ref(null);
    const deleteModal = ref(null);

    // Computed
    const filteredExercises = computed(() => {
      return exercises.value.filter(exercise => {
        const matchesSearch = searchTerm.value === '' || 
                             exercise.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                             exercise.name_en.toLowerCase().includes(searchTerm.value.toLowerCase());
                             
        const matchesMuscle = selectedMuscleFilter.value === '' || 
                             (exercise.target_muscles && 
                              exercise.target_muscles.includes(selectedMuscleFilter.value));
                              
        return matchesSearch && matchesMuscle;
      });
    });

    const columns = [
      { key: 'thumbnail_url', label: 'Image' },
      { key: 'name', label: 'Name' },
      { key: 'target_muscles', label: 'Target Muscles' },
      { key: 'equipment_needed', label: 'Equipment' },
      { key: 'calories_per_minute', label: 'Calories/Min' },
      { key: 'is_reps_based', label: 'Type' }
    ];

    const stats = computed(() => [
      {
        title: 'Total Exercises',
        value: exercises.value.length,
        icon: 'fa-dumbbell',
        color: 'primary'
      },
      {
        title: 'No Equipment',
        value: exercises.value.filter(ex => 
          !ex.equipment_needed || 
          ex.equipment_needed.length === 0 || 
          (ex.equipment_needed.length === 1 && ex.equipment_needed[0] === 'None')
        ).length,
        icon: 'fa-running',
        color: 'success'
      },
      {
        title: 'Time Based',
        value: exercises.value.filter(ex => ex.is_time_default).length,
        icon: 'fa-stopwatch',
        color: 'info'
      },
      {
        title: 'Reps Based',
        value: exercises.value.filter(ex => ex.is_reps_based).length,
        icon: 'fa-list-ol',
        color: 'warning'
      }
    ]);

    // Fetch exercises from Firestore
const fetchExercises = async () => {
      try {
  loading.value = true;
        const exerciseCollection = collection(db, 'exercises');
        const exerciseQuery = query(exerciseCollection, orderBy('name'));
        const querySnapshot = await getDocs(exerciseQuery);
        
        const exerciseList = [];
        querySnapshot.forEach((doc) => {
          exerciseList.push(Exercise.fromFirestore(doc));
        });
        
        exercises.value = exerciseList;
      } catch (error) {
        console.error('Error fetching exercises:', error);
  } finally {
    loading.value = false;
  }
};

    // Open modal for creating/editing
    const openExerciseModal = (exercise = null) => {
      if (exercise) {
        currentExercise.value = { ...exercise };
        isEditing.value = true;
      } else {
        currentExercise.value = new Exercise({});
        isEditing.value = false;
      }
      
      const modalElement = document.getElementById('exerciseModal');
      if (modalElement) {
        exerciseModal.value = new Modal(modalElement);
        exerciseModal.value.show();
      }
    };

    // Open delete confirmation modal
    const openDeleteModal = (exercise) => {
      currentExercise.value = { ...exercise };
      
      const modalElement = document.getElementById('deleteModal');
      if (modalElement) {
        deleteModal.value = new Modal(modalElement);
        deleteModal.value.show();
      }
    };

    // Save exercise to Firestore
    const saveExercise = async () => {
      try {
        if (!currentExercise.value.name) {
          alert('Exercise name is required');
          return;
        }

        if (!currentExercise.value.thumbnail_url) {
          alert('Exercise image is required');
          return;
        }

        if (isEditing.value) {
          // Update existing exercise
          const exerciseDoc = doc(db, 'exercises', currentExercise.value.exercise_id);
          await updateDoc(exerciseDoc, currentExercise.value.toFirestore());
        } else {
          // Create new exercise
          await addDoc(collection(db, 'exercises'), currentExercise.value.toFirestore());
        }

        // Refresh exercises list
        await fetchExercises();
        
        // Close modal
        if (exerciseModal.value) {
          exerciseModal.value.hide();
        }
      } catch (error) {
        console.error('Error saving exercise:', error);
        alert(`Error saving exercise: ${error.message}`);
      }
    };

    // Delete exercise from Firestore
    const deleteExercise = async () => {
      try {
        if (!currentExercise.value.exercise_id) {
          return;
        }

        // First check if exercise is used in any workout plan
        const planExercisesRef = collection(db, 'plan_exercises');
        const q = query(planExercisesRef, where('exercise_id', '==', currentExercise.value.exercise_id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          alert(`Cannot delete this exercise because it's used in ${querySnapshot.size} workout plans.`);
          return;
        }

        // Delete the exercise
        await deleteDoc(doc(db, 'exercises', currentExercise.value.exercise_id));
        
        // Refresh exercises list
        await fetchExercises();
        
        // Close modal
        if (deleteModal.value) {
          deleteModal.value.hide();
        }
      } catch (error) {
        console.error('Error deleting exercise:', error);
        alert(`Error deleting exercise: ${error.message}`);
      }
    };

    // Handle image upload success
    const handleImageUpload = (imageData) => {
      currentExercise.value.thumbnail_url = imageData.url;
    };

    // Toggle a value in array
    const toggleArrayValue = (array, value) => {
      const index = array.indexOf(value);
      if (index === -1) {
        array.push(value);
      } else {
        array.splice(index, 1);
      }
    };

    // Initialize
    onMounted(() => {
      fetchExercises();
    });

    return {
      exercises,
      filteredExercises,
      loading,
      columns,
      stats,
      currentExercise,
      isEditing,
      targetMuscleOptions,
      equipmentOptions,
      searchTerm,
      selectedMuscleFilter,
      openExerciseModal,
      openDeleteModal,
      saveExercise,
      deleteExercise,
      handleImageUpload,
      toggleArrayValue
    };
  }
};
</script>

<template>
  <div class="content-container">
    <h1 class="page-title">Exercise Management</h1>
    
    <!-- Stats Row -->
    <div class="row">
      <div class="col-md-6 col-xl-3" v-for="(stat, index) in stats" :key="index">
        <StatCard
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
        />
      </div>
    </div>
    
    <!-- Filters and Add Button -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="input-group">
          <span class="input-group-text"><i class="fa fa-search"></i></span>
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search exercises..." 
            v-model="searchTerm"
          />
        </div>
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="selectedMuscleFilter">
          <option value="">All Target Muscles</option>
          <option v-for="muscle in targetMuscleOptions" :key="muscle" :value="muscle">
            {{ muscle }}
          </option>
        </select>
      </div>
      <div class="col-md-5 text-end">
        <button class="btn btn-primary" @click="openExerciseModal()">
          <i class="fa fa-plus"></i> Add Exercise
      </button>
      </div>
    </div>
    
    <!-- Exercises Table -->
    <DataTable
      title="Exercises"
      :columns="columns"
      :items="filteredExercises"
      :loading="loading"
    >
      <template #thumbnail_url="{ value }">
        <div class="exercise-thumbnail">
          <img :src="value || 'https://via.placeholder.com/50'" alt="Exercise" />
        </div>
      </template>
      
      <template #target_muscles="{ value }">
        <div class="d-flex flex-wrap gap-1">
          <span 
            v-for="muscle in value" 
            :key="muscle" 
            class="badge bg-info"
          >
            {{ muscle }}
          </span>
          <span v-if="!value || value.length === 0">-</span>
        </div>
      </template>
      
      <template #equipment_needed="{ value }">
        <div class="d-flex flex-wrap gap-1">
          <span 
            v-for="equipment in value" 
            :key="equipment" 
            class="badge bg-secondary"
          >
            {{ equipment }}
          </span>
          <span v-if="!value || value.length === 0">None</span>
        </div>
      </template>
      
      <template #is_reps_based="{ value, item }">
        <span v-if="item.is_time_default" class="badge bg-warning">Time</span>
        <span v-else-if="value" class="badge bg-success">Reps</span>
        <span v-else class="badge bg-secondary">Other</span>
      </template>
      
      <template #actions="{ item }">
        <div class="btn-group">
          <button 
            class="btn btn-sm btn-primary" 
            @click="openExerciseModal(item)" 
            title="Edit"
          >
            <i class="fa fa-edit"></i>
          </button>
          <button 
            class="btn btn-sm btn-danger" 
            @click="openDeleteModal(item)" 
            title="Delete"
          >
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </template>
    </DataTable>
    
    <!-- Exercise Modal -->
    <div class="modal fade" id="exerciseModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Edit Exercise' : 'Add Exercise' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveExercise">
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Exercise Name (Vietnamese) *</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="currentExercise.name" 
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Exercise Name (English)</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="currentExercise.name_en"
                    />
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea 
                  class="form-control" 
                  v-model="currentExercise.description" 
                  rows="3"
                ></textarea>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Image *</label>
                    <ImageUploader
                      v-model:value="currentExercise.thumbnail_url"
                      folder="exercises"
                      @upload-success="handleImageUpload"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Video URL</label>
                    <input 
                      type="url" 
                      class="form-control" 
                      v-model="currentExercise.video_url"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">GIF URL</label>
                    <input 
                      type="url" 
                      class="form-control" 
                      v-model="currentExercise.gif_url"
                      placeholder="https://example.com/animation.gif"
                    />
                  </div>
                </div>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Calories per Minute</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model="currentExercise.calories_per_minute"
                      min="0" 
                      step="0.1"
                    />
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-check mt-4">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="isTimeDefault" 
                      v-model="currentExercise.is_time_default"
                    />
                    <label class="form-check-label" for="isTimeDefault">
                      Time Based Exercise
                    </label>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-check mt-4">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="isRepsBased" 
                      v-model="currentExercise.is_reps_based"
                    />
                    <label class="form-check-label" for="isRepsBased">
                      Reps Based Exercise
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Target Muscles</label>
                  <div class="target-muscle-options">
                    <div 
                      v-for="muscle in targetMuscleOptions" 
                      :key="muscle" 
                      class="form-check"
                    >
                      <input 
                        :id="`muscle-${muscle}`" 
                        type="checkbox" 
                        class="form-check-input" 
                        :checked="currentExercise.target_muscles?.includes(muscle)" 
                        @change="toggleArrayValue(currentExercise.target_muscles = currentExercise.target_muscles || [], muscle)"
                      />
                      <label :for="`muscle-${muscle}`" class="form-check-label">{{ muscle }}</label>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <label class="form-label">Equipment Needed</label>
                  <div class="equipment-options">
                    <div 
                      v-for="equipment in equipmentOptions" 
                      :key="equipment" 
                      class="form-check"
                    >
                      <input 
                        :id="`equipment-${equipment}`" 
                        type="checkbox" 
                        class="form-check-input" 
                        :checked="currentExercise.equipment_needed?.includes(equipment)" 
                        @change="toggleArrayValue(currentExercise.equipment_needed = currentExercise.equipment_needed || [], equipment)"
                      />
                      <label :for="`equipment-${equipment}`" class="form-check-label">{{ equipment }}</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Instructions</label>
                <div v-for="(instruction, index) in (currentExercise.instructions || [])" :key="index" class="input-group mb-2">
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="currentExercise.instructions[index]"
                  />
                  <button 
                    type="button" 
                    class="btn btn-outline-danger" 
                    @click="currentExercise.instructions.splice(index, 1)"
                  >
                    <i class="fa fa-times"></i>
                  </button>
                </div>
                <button 
                  type="button" 
                  class="btn btn-outline-secondary btn-sm"
                  @click="currentExercise.instructions = currentExercise.instructions || []; currentExercise.instructions.push('')"
                >
                  <i class="fa fa-plus"></i> Add Instruction
                </button>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveExercise">Save</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Delete Exercise</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete the exercise <strong>{{ currentExercise.name }}</strong>?</p>
            <p class="text-danger">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" @click="deleteExercise">Delete</button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template> 

<style scoped>
.content-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.exercise-thumbnail {
  width: 50px;
  height: 50px;
  overflow: hidden;
  border-radius: 4px;
}

.exercise-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.target-muscle-options,
.equipment-options {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}
</style> 