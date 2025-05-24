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
import { WorkoutPlan } from '@/models/WorkoutPlan';
import { PlanExercise } from '@/models/PlanExercise';
import { Exercise } from '@/models/Exercise';
import { DifficultyLevel } from '@/models/DifficultyLevel';
import { Modal } from 'bootstrap';

export default {
  components: {
    DataTable,
    StatCard,
    ImageUploader
  },
  setup() {
// State
const workoutPlans = ref([]);
    const difficultyLevels = ref([]);
    const exercises = ref([]);
    const planExercises = ref([]);
const loading = ref(true);
    const currentPlan = ref(new WorkoutPlan({}));
    const isEditing = ref(false);
    const selectedLevelFilter = ref('');
    const searchTerm = ref('');
    
    // For managing exercises in a plan
    const currentPlanExercises = ref([]);
    const availableExercises = ref([]);
    const selectedExercise = ref(null);
    const exerciseReps = ref(10);
    const exerciseSets = ref(3);
    const exerciseRestTime = ref(60);
    const exerciseOrderIndex = ref(0);

    // Modal refs
    const planModal = ref(null);
    const deleteModal = ref(null);
    const exercisesModal = ref(null);

    // Computed
    const filteredPlans = computed(() => {
      return workoutPlans.value.filter(plan => {
        const matchesSearch = searchTerm.value === '' || 
                             plan.name.toLowerCase().includes(searchTerm.value.toLowerCase());
                             
        const matchesLevel = selectedLevelFilter.value === '' || 
                            plan.level_id === selectedLevelFilter.value;
                              
        return matchesSearch && matchesLevel;
      });
    });

    const columns = [
      { key: 'thumbnail_url', label: 'Image' },
      { key: 'name', label: 'Name' },
      { key: 'level', label: 'Level' },
      { key: 'estimated_duration', label: 'Duration (mins)' },
      { key: 'estimated_calories', label: 'Calories' },
      { key: 'exercise_count', label: 'Exercises' }
    ];

    const stats = computed(() => [
      {
        title: 'Total Plans',
        value: workoutPlans.value.length,
        icon: 'fa-calendar-alt',
        color: 'primary'
      },
      {
        title: 'Beginner Plans',
        value: workoutPlans.value.filter(plan => {
          const level = difficultyLevels.value.find(l => l.level_id === plan.level_id);
          return level && level.level <= 2;
        }).length,
        icon: 'fa-child',
        color: 'success'
      },
      {
        title: 'Intermediate Plans',
        value: workoutPlans.value.filter(plan => {
          const level = difficultyLevels.value.find(l => l.level_id === plan.level_id);
          return level && level.level > 2 && level.level <= 4;
        }).length,
        icon: 'fa-running',
        color: 'info'
      },
      {
        title: 'Advanced Plans',
        value: workoutPlans.value.filter(plan => {
          const level = difficultyLevels.value.find(l => l.level_id === plan.level_id);
          return level && level.level > 4;
        }).length,
        icon: 'fa-fire',
        color: 'danger'
      }
    ]);

    // Fetch data
    const fetchData = async () => {
      try {
  loading.value = true;
        
        // Get difficulty levels
        const levelsCollection = collection(db, 'difficulty_levels');
        const levelsQuery = query(levelsCollection, orderBy('level'));
        const levelsSnapshot = await getDocs(levelsQuery);
        
        const levelsList = [];
        levelsSnapshot.forEach((doc) => {
          levelsList.push(DifficultyLevel.fromFirestore(doc));
        });
        difficultyLevels.value = levelsList;
        
        // Get exercises
        const exercisesCollection = collection(db, 'exercises');
        const exercisesQuery = query(exercisesCollection, orderBy('name'));
        const exercisesSnapshot = await getDocs(exercisesQuery);
        
        const exercisesList = [];
        exercisesSnapshot.forEach((doc) => {
          exercisesList.push(Exercise.fromFirestore(doc));
        });
        exercises.value = exercisesList;
        
        // Get workout plans
        const plansCollection = collection(db, 'workout_plans');
        const plansQuery = query(plansCollection, orderBy('name'));
        const plansSnapshot = await getDocs(plansQuery);
        
        const plansList = [];
        plansSnapshot.forEach((doc) => {
          plansList.push(WorkoutPlan.fromFirestore(doc));
        });
        workoutPlans.value = plansList;
        
        // Get plan exercises
        const planExercisesCollection = collection(db, 'plan_exercises');
        const planExercisesSnapshot = await getDocs(planExercisesCollection);
        
        const planExercisesList = [];
        planExercisesSnapshot.forEach((doc) => {
          const planExercise = PlanExercise.fromFirestore(doc);
          // Attach the related exercise
          const exercise = exercises.value.find(e => e.exercise_id === planExercise.exercise_id);
          if (exercise) {
            planExercise.setExercise(exercise);
          }
          planExercisesList.push(planExercise);
        });
        planExercises.value = planExercisesList;
        
      } catch (error) {
        console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
};

    // Get plan exercises count
    const getPlanExercisesCount = (planId) => {
      return planExercises.value.filter(pe => pe.plan_id === planId).length;
    };

    // Get difficulty level name
    const getLevelName = (levelId) => {
      const level = difficultyLevels.value.find(l => l.level_id === levelId);
      return level ? level.name : 'Unknown';
    };

    // Open modal for creating/editing
    const openPlanModal = (plan = null) => {
      if (plan) {
        currentPlan.value = { ...plan };
        isEditing.value = true;
      } else {
        currentPlan.value = new WorkoutPlan({});
        isEditing.value = false;
      }
      
      const modalElement = document.getElementById('planModal');
      if (modalElement) {
        planModal.value = new Modal(modalElement);
        planModal.value.show();
      }
    };

    // Open delete confirmation modal
    const openDeleteModal = (plan) => {
      currentPlan.value = { ...plan };
      
      const modalElement = document.getElementById('deleteModal');
      if (modalElement) {
        deleteModal.value = new Modal(modalElement);
        deleteModal.value.show();
      }
    };

    // Open exercises modal
    const openExercisesModal = (plan) => {
      currentPlan.value = { ...plan };
      
      // Load plan exercises
      currentPlanExercises.value = planExercises.value
        .filter(pe => pe.plan_id === plan.plan_id)
        .sort((a, b) => a.order_index - b.order_index);
      
      // Set available exercises
      availableExercises.value = exercises.value;
      
      const modalElement = document.getElementById('exercisesModal');
      if (modalElement) {
        exercisesModal.value = new Modal(modalElement);
        exercisesModal.value.show();
      }
    };

    // Save plan to Firestore
    const savePlan = async () => {
      try {
        if (!currentPlan.value.name) {
          alert('Workout plan name is required');
          return;
        }

        if (!currentPlan.value.level_id) {
          alert('Difficulty level is required');
          return;
        }

        if (isEditing.value) {
          // Update existing plan
          const planDoc = doc(db, 'workout_plans', currentPlan.value.plan_id);
          await updateDoc(planDoc, currentPlan.value.toFirestore());
        } else {
          // Create new plan
          await addDoc(collection(db, 'workout_plans'), currentPlan.value.toFirestore());
        }

        // Refresh data
        await fetchData();
        
        // Close modal
        if (planModal.value) {
          planModal.value.hide();
        }
      } catch (error) {
        console.error('Error saving workout plan:', error);
        alert(`Error saving workout plan: ${error.message}`);
      }
    };

    // Delete plan from Firestore
    const deletePlan = async () => {
      try {
        if (!currentPlan.value.plan_id) {
          return;
        }

        // First delete all plan exercises
        const planExercisesToDelete = planExercises.value.filter(pe => pe.plan_id === currentPlan.value.plan_id);
        if (planExercisesToDelete.length > 0) {
          const batch = writeBatch(db);
          planExercisesToDelete.forEach(pe => {
            batch.delete(doc(db, 'plan_exercises', pe.plan_exercise_id));
          });
          await batch.commit();
        }

        // Then delete the plan
        await deleteDoc(doc(db, 'workout_plans', currentPlan.value.plan_id));
        
        // Refresh data
        await fetchData();
        
        // Close modal
        if (deleteModal.value) {
          deleteModal.value.hide();
        }
      } catch (error) {
        console.error('Error deleting workout plan:', error);
        alert(`Error deleting workout plan: ${error.message}`);
      }
    };

    // Handle image upload success
    const handleImageUpload = (imageData) => {
      currentPlan.value.thumbnail_url = imageData.url;
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

    // Add exercise to plan
    const addExerciseToPlan = async () => {
      try {
        if (!selectedExercise.value) {
          alert('Please select an exercise');
          return;
        }

        // Create new plan exercise
        const newPlanExercise = new PlanExercise({
          plan_id: currentPlan.value.plan_id,
          exercise_id: selectedExercise.value,
          order_index: exerciseOrderIndex.value,
          reps: exerciseReps.value,
          sets: exerciseSets.value,
          rest_time_seconds: exerciseRestTime.value
        });

        // Save to Firestore
        await addDoc(collection(db, 'plan_exercises'), newPlanExercise.toFirestore());

        // Refresh data
        await fetchData();
        
        // Reset form
        selectedExercise.value = null;
        
        // Update current plan exercises
        currentPlanExercises.value = planExercises.value
          .filter(pe => pe.plan_id === currentPlan.value.plan_id)
          .sort((a, b) => a.order_index - b.order_index);
          
        // Update next order index
        exerciseOrderIndex.value = currentPlanExercises.value.length;

      } catch (error) {
        console.error('Error adding exercise to plan:', error);
        alert(`Error adding exercise to plan: ${error.message}`);
      }
    };

    // Remove exercise from plan
    const removeExerciseFromPlan = async (planExerciseId) => {
      try {
        await deleteDoc(doc(db, 'plan_exercises', planExerciseId));
        
        // Refresh data
        await fetchData();
        
        // Update current plan exercises
        currentPlanExercises.value = planExercises.value
          .filter(pe => pe.plan_id === currentPlan.value.plan_id)
          .sort((a, b) => a.order_index - b.order_index);
          
        // Update next order index
        exerciseOrderIndex.value = currentPlanExercises.value.length;

      } catch (error) {
        console.error('Error removing exercise from plan:', error);
        alert(`Error removing exercise from plan: ${error.message}`);
      }
    };

    // Initialize
    onMounted(() => {
      fetchData();
    });

    return {
      workoutPlans,
      filteredPlans,
      difficultyLevels,
      exercises,
      planExercises,
      loading,
      columns,
      stats,
      currentPlan,
      isEditing,
      selectedLevelFilter,
      searchTerm,
      currentPlanExercises,
      availableExercises,
      selectedExercise,
      exerciseReps,
      exerciseSets,
      exerciseRestTime,
      exerciseOrderIndex,
      openPlanModal,
      openDeleteModal,
      openExercisesModal,
      savePlan,
      deletePlan,
      handleImageUpload,
      toggleArrayValue,
      addExerciseToPlan,
      removeExerciseFromPlan,
      getPlanExercisesCount,
      getLevelName
    };
  }
};
</script>

<template>
  <div class="content-container">
    <h1 class="page-title">Workout Plans Management</h1>
    
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
            placeholder="Search workout plans..." 
            v-model="searchTerm"
          />
        </div>
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="selectedLevelFilter">
          <option value="">All Difficulty Levels</option>
          <option v-for="level in difficultyLevels" :key="level.level_id" :value="level.level_id">
            {{ level.name }}
          </option>
        </select>
      </div>
      <div class="col-md-5 text-end">
        <button class="btn btn-primary" @click="openPlanModal()">
          <i class="fa fa-plus"></i> Add Workout Plan
      </button>
      </div>
    </div>
    
    <!-- Workout Plans Table -->
    <DataTable
      title="Workout Plans"
      :columns="columns"
      :items="filteredPlans"
      :loading="loading"
    >
      <template #thumbnail_url="{ value }">
        <div class="plan-thumbnail">
          <img :src="value || 'https://via.placeholder.com/50'" alt="Workout Plan" />
        </div>
      </template>
      
      <template #level="{ item }">
        {{ getLevelName(item.level_id) }}
      </template>
      
      <template #exercise_count="{ item }">
        <span class="badge bg-primary">{{ getPlanExercisesCount(item.plan_id) }}</span>
      </template>
      
      <template #actions="{ item }">
        <div class="btn-group">
          <button 
            class="btn btn-sm btn-success" 
            @click="openExercisesModal(item)" 
            title="Manage Exercises"
          >
            <i class="fa fa-list"></i>
          </button>
          <button 
            class="btn btn-sm btn-primary" 
            @click="openPlanModal(item)" 
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
    
    <!-- Workout Plan Modal -->
    <div class="modal fade" id="planModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Edit Workout Plan' : 'Add Workout Plan' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="savePlan">
              <div class="row mb-3">
                <div class="col-md-8">
                  <div class="mb-3">
                    <label class="form-label">Plan Name *</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="currentPlan.name" 
                      required
                    />
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Difficulty Level *</label>
                    <select 
                      class="form-select" 
                      v-model="currentPlan.level_id"
                      required
                    >
                      <option value="">Select Level</option>
                      <option v-for="level in difficultyLevels" :key="level.level_id" :value="level.level_id">
                        {{ level.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea 
                  class="form-control" 
                  v-model="currentPlan.description" 
                  rows="3"
                ></textarea>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Thumbnail</label>
                    <ImageUploader
                      v-model:value="currentPlan.thumbnail_url"
                      folder="workout_plans"
                      @upload-success="handleImageUpload"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label">Estimated Duration (mins)</label>
                        <input 
                          type="number" 
                          class="form-control" 
                          v-model="currentPlan.estimated_duration"
                          min="0"
                        />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label">Estimated Calories</label>
                        <input 
                          type="number" 
                          class="form-control" 
                          v-model="currentPlan.estimated_calories"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label">Sort Order</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model="currentPlan.sort_order"
                      min="0"
                    />
                  </div>
                  
                  <div class="form-check mt-4">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="isPremium" 
                      v-model="currentPlan.is_premium"
                    />
                    <label class="form-check-label" for="isPremium">
                      Premium Plan
                    </label>
                  </div>
                  
                  <div class="form-check mt-2">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="isActive" 
                      v-model="currentPlan.is_active"
                    />
                    <label class="form-check-label" for="isActive">
                      Active Plan
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Equipment Needed</label>
                <div class="d-flex flex-wrap gap-2">
                  <div 
                    v-for="equipment in ['None', 'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Bands', 'Pull-up Bar', 'Bench', 'Swiss Ball', 'Yoga Mat']" 
                    :key="equipment" 
                    class="form-check form-check-inline"
                  >
                    <input 
                      :id="`equipment-${equipment}`" 
                      type="checkbox" 
                      class="form-check-input" 
                      :checked="currentPlan.equipment_needed?.includes(equipment)" 
                      @change="toggleArrayValue(currentPlan.equipment_needed = currentPlan.equipment_needed || [], equipment)"
                    />
                    <label :for="`equipment-${equipment}`" class="form-check-label">{{ equipment }}</label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="savePlan">Save</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Delete Workout Plan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete the workout plan <strong>{{ currentPlan.name }}</strong>?</p>
            <p>This will also delete all exercises associated with this plan.</p>
            <p class="text-danger">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" @click="deletePlan">Delete</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Plan Exercises Modal -->
    <div class="modal fade" id="exercisesModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Manage Exercises for {{ currentPlan.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Add new exercise to plan -->
            <div class="card mb-4">
              <div class="card-header bg-light">
                <h6 class="mb-0">Add Exercise to Plan</h6>
              </div>
              <div class="card-body">
                <form @submit.prevent="addExerciseToPlan" class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Select Exercise *</label>
                      <select 
                        class="form-select" 
                        v-model="selectedExercise" 
                        required
                      >
                        <option value="">Select Exercise</option>
                        <option 
                          v-for="exercise in availableExercises" 
                          :key="exercise.exercise_id" 
                          :value="exercise.exercise_id"
                        >
                          {{ exercise.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="mb-3">
                      <label class="form-label">Sets</label>
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model="exerciseSets" 
                        min="1"
                      />
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="mb-3">
                      <label class="form-label">Reps</label>
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model="exerciseReps" 
                        min="1"
                      />
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="mb-3">
                      <label class="form-label">Rest (sec)</label>
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model="exerciseRestTime" 
                        min="0"
                      />
                    </div>
                  </div>
                  <div class="col-12 text-end">
                    <button type="submit" class="btn btn-success">
                      <i class="fa fa-plus"></i> Add Exercise
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <!-- Current plan exercises -->
            <div class="card">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Plan Exercises</h6>
                <span class="badge bg-primary">{{ currentPlanExercises.length }} Exercises</span>
              </div>
              <div class="card-body">
                <div v-if="currentPlanExercises.length === 0" class="text-center p-4">
                  <p class="mb-0 text-muted">No exercises added to this plan yet.</p>
                </div>
                <div v-else class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Image</th>
                        <th>Exercise</th>
                        <th>Sets</th>
                        <th>Reps</th>
                        <th>Rest</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(planExercise, index) in currentPlanExercises" :key="planExercise.plan_exercise_id">
                        <td>{{ index + 1 }}</td>
                        <td>
                          <div class="exercise-thumbnail">
                            <img 
                              :src="planExercise._exercise?.thumbnail_url || 'https://via.placeholder.com/40'" 
                              alt="Exercise" 
                            />
                          </div>
                        </td>
                        <td>
                          {{ planExercise._exercise?.name || 'Unknown Exercise' }}
                          <div v-if="planExercise.notes" class="small text-muted">
                            {{ planExercise.notes }}
                          </div>
                        </td>
                        <td>{{ planExercise.sets }}</td>
                        <td>{{ planExercise.reps }}</td>
                        <td>{{ planExercise.rest_time_seconds }}s</td>
                        <td>
                          <button 
                            class="btn btn-sm btn-danger" 
                            @click="removeExerciseFromPlan(planExercise.plan_exercise_id)"
                          >
                            <i class="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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

.plan-thumbnail {
  width: 50px;
  height: 50px;
  overflow: hidden;
  border-radius: 4px;
}

.plan-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.exercise-thumbnail {
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 4px;
}

.exercise-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style> 