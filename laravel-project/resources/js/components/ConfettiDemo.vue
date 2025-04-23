<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-medium mb-8 text-center">Milestone Celebration Demo</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Manual Confetti Testing -->
      <div class="card border-light shadow-sm">
        <div class="card-header pb-3">
          <h5 class="card-title">Test Confetti Animation</h5>
          <p class="text-muted small">
            Select a confetti style and trigger a celebration
          </p>
        </div>
        <div class="card-body pb-2">
          <div>
            <label class="form-label mb-2 fw-medium">Confetti Type</label>
            <select v-model="confettiType" class="form-select">
              <option value="achievement">Achievement</option>
              <option value="milestone">Milestone</option>
              <option value="completion">Completion</option>
              <option value="celebration">Celebration</option>
            </select>
          </div>
        </div>
        <div class="card-footer">
          <button 
            class="btn btn-primary btn-sm w-100" 
            @click="handleTriggerConfetti"
          >
            Trigger Confetti
          </button>
        </div>
      </div>

      <!-- Milestone Testing -->
      <div class="card border-light shadow-sm">
        <div class="card-header pb-3">
          <h5 class="card-title">Test Milestone Notifications</h5>
          <p class="text-muted small">
            Trigger milestone celebrations with toast notifications
          </p>
        </div>
        <div class="card-body pb-2">
          <div>
            <label class="form-label mb-2 fw-medium">Progress Value</label>
            <div class="d-flex align-items-center gap-3">
              <input 
                type="range" 
                class="form-range flex-grow-1" 
                min="0" 
                max="100" 
                step="5" 
                v-model="progress"
              >
              <span class="text-end" style="width:60px">{{ progress }}%</span>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex flex-column gap-2">
          <div class="d-grid grid-cols-2 gap-2">
            <button 
              class="btn btn-outline-secondary btn-sm" 
              @click="handleCreateMilestone('objective_completion')"
            >
              <i class="bi bi-record-circle me-1"></i>
              Objective
            </button>
            <button 
              class="btn btn-outline-secondary btn-sm" 
              @click="handleCreateMilestone('key_result_completion')"
            >
              <i class="bi bi-check-circle me-1"></i>
              Key Result
            </button>
          </div>
          <div class="d-grid grid-cols-3 gap-2">
            <button 
              class="btn btn-outline-secondary btn-sm" 
              @click="handleCreateMilestone('objective_progress')"
            >
              <i class="bi bi-bar-chart me-1"></i>
              Progress
            </button>
            <button 
              class="btn btn-outline-secondary btn-sm" 
              @click="handleCreateMilestone('team_achievement')"
            >
              <i class="bi bi-people me-1"></i>
              Team
            </button>
            <button 
              class="btn btn-outline-secondary btn-sm" 
              @click="handleCreateMilestone('personal_achievement')"
            >
              <i class="bi bi-star me-1"></i>
              Personal
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Explanation -->
    <div class="mt-4 p-4 bg-light rounded border">
      <h5 class="mb-2">How to Use Celebrations</h5>
      <p class="text-muted mb-2 small">
        The confetti celebration system provides visual feedback when users complete important milestones:
      </p>
      <ul class="text-muted small ms-4">
        <li>Different celebration styles based on achievement type</li>
        <li>Customizable animation patterns and colors</li>
        <li>Toast notifications with acknowledgment option</li>
        <li>Auto-dismissal to prevent notification overload</li>
      </ul>
    </div>
    
    <!-- Milestone Toast Component -->
    <MilestoneToast ref="milestoneToast" />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import MilestoneToast from './MilestoneToast.vue';
import { milestoneStore } from '../stores/milestone';

export default defineComponent({
  name: 'ConfettiDemo',
  components: {
    MilestoneToast
  },
  
  setup() {
    const milestoneToast = ref(null);
    const confettiType = ref('celebration');
    const progress = ref(50);
    
    // Function to trigger confetti directly
    const handleTriggerConfetti = () => {
      if (milestoneToast.value) {
        // Manually trigger celebration via the ref
        milestoneToast.value.playMilestoneCelebration(confettiType.value);
      }
    };
    
    // Create a milestone and trigger celebration
    const handleCreateMilestone = (type) => {
      let milestoneData;
      
      switch (type) {
        case 'objective_completion':
          milestoneData = {
            type,
            title: 'Objective Complete',
            description: 'You have completed an important objective',
            entityId: 1,
          };
          break;
        
        case 'key_result_completion':
          milestoneData = {
            type,
            title: 'Key Result Achieved',
            description: 'You have achieved a key result',
            entityId: 1,
          };
          break;
        
        case 'objective_progress':
          milestoneData = {
            type,
            title: `Progress: ${progress.value}%`,
            description: `You've reached ${progress.value}% progress on your objective`,
            entityId: 1,
            threshold: progress.value,
          };
          break;
        
        case 'team_achievement':
          milestoneData = {
            type,
            title: 'Team Achievement',
            description: 'Your team has reached an important milestone',
            entityId: 1,
          };
          break;
        
        case 'personal_achievement':
          milestoneData = {
            type,
            title: 'Personal Achievement',
            description: 'You have reached a personal achievement',
            entityId: 1,
          };
          break;
      }
      
      // Add to milestone store
      milestoneStore.addMilestone(milestoneData);
    };

    return {
      milestoneToast,
      confettiType,
      progress,
      handleTriggerConfetti,
      handleCreateMilestone
    };
  }
});
</script>

<style scoped>
.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
</style>