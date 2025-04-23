<template>
  <div>
    <!-- Confetti wrapper - dynamically rendered when triggered -->
    <div ref="confettiContainer" class="fixed inset-0 pointer-events-none z-50"></div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, reactive, toRefs, watch } from 'vue';
import confetti from 'canvas-confetti';

export default defineComponent({
  name: 'MilestoneToast',
  
  setup() {
    const confettiContainer = ref(null);
    const state = reactive({
      recentMilestone: null,
      isShowingConfetti: false
    });

    // Load existing milestone from local storage if it hasn't been acknowledged
    onMounted(() => {
      const savedMilestone = localStorage.getItem('recentMilestone');
      if (savedMilestone) {
        try {
          const milestone = JSON.parse(savedMilestone);
          if (!milestone.acknowledged) {
            state.recentMilestone = milestone;
            playMilestoneCelebration(milestone.type);
          } else {
            // Clear if already acknowledged
            localStorage.removeItem('recentMilestone');
          }
        } catch (e) {
          console.error('Failed to parse milestone from storage', e);
          localStorage.removeItem('recentMilestone');
        }
      }
    });

    // Watch for milestone changes and trigger celebration
    watch(() => state.recentMilestone, (newMilestone) => {
      if (newMilestone && !newMilestone.acknowledged) {
        showToast(newMilestone);
        playMilestoneCelebration(newMilestone.type);
        
        // Store the milestone
        localStorage.setItem('recentMilestone', JSON.stringify(newMilestone));
      }
    });

    /**
     * Show a toast notification for the milestone
     */
    function showToast(milestone) {
      // This would connect to your toast library
      // For example using a custom toast event or notifying a toast store
      const event = new CustomEvent('show-milestone-toast', { detail: milestone });
      window.dispatchEvent(event);
    }

    /**
     * Acknowledge a milestone so it won't show again
     */
    function acknowledgeMilestone(id) {
      if (state.recentMilestone && state.recentMilestone.id === id) {
        state.recentMilestone.acknowledged = true;
        localStorage.setItem('recentMilestone', JSON.stringify(state.recentMilestone));
      }
    }

    /**
     * Add a new milestone to be celebrated
     */
    function addMilestone(milestone) {
      // Generate a random ID if not provided
      const id = milestone.id || Date.now();
      state.recentMilestone = {
        ...milestone,
        id,
        acknowledged: false,
        createdAt: new Date().toISOString()
      };
    }

    /**
     * Play the appropriate confetti celebration based on milestone type
     */
    function playMilestoneCelebration(type) {
      if (!confettiContainer.value) return;
      
      state.isShowingConfetti = true;
      
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '100';
      
      confettiContainer.value.appendChild(canvas);
      
      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true
      });
      
      // Different celebration styles based on type
      switch (type) {
        case 'objective_completion':
          playCelebrationCompletion(myConfetti);
          break;
          
        case 'key_result_completion':
          playCelebrationMilestone(myConfetti);
          break;
          
        case 'objective_progress':
          playCelebrationAchievement(myConfetti);
          break;
          
        case 'team_achievement':
          playCelebrationTeam(myConfetti);
          break;
          
        case 'personal_achievement':
          playCelebrationPersonal(myConfetti);
          break;
          
        default:
          playCelebrationDefault(myConfetti);
      }
      
      // Clean up after animation completes
      setTimeout(() => {
        state.isShowingConfetti = false;
        confettiContainer.value.removeChild(canvas);
      }, 5000);
    }

    // Different celebration patterns

    function playCelebrationCompletion(confettiInstance) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confettiInstance({
          particleCount: 3,
          angle: 60,
          spread: 75,
          origin: { x: 0, y: 0.8 },
          colors: ['#26a69a', '#00897b', '#00796b'],
          shapes: ['circle', 'square'],
          gravity: 0.7,
        });
        
        confettiInstance({
          particleCount: 3,
          angle: 120,
          spread: 75,
          origin: { x: 1, y: 0.8 },
          colors: ['#26a69a', '#00897b', '#00796b'],
          shapes: ['circle', 'square'],
          gravity: 0.7,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }

    function playCelebrationMilestone(confettiInstance) {
      confettiInstance({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#4caf50', '#66bb6a', '#81c784'],
      });
    }

    function playCelebrationAchievement(confettiInstance) {
      confettiInstance({
        particleCount: 80,
        angle: 130,
        spread: 55,
        origin: { x: 0.2, y: 0.9 },
        colors: ['#2196f3', '#42a5f5', '#64b5f6'],
      });
    }

    function playCelebrationTeam(confettiInstance) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 100, zIndex: 0 };
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      
      const interval = setInterval(() => {
        const timeLeft = 2000;
        
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        
        confettiInstance({
          ...defaults,
          particleCount: 60,
          origin: { x: randomInRange(0.2, 0.8), y: Math.random() - 0.2 },
          colors: ['#ffa000', '#ffb300', '#ffc107'],
        });
      }, 250);
    }

    function playCelebrationPersonal(confettiInstance) {
      const end = Date.now() + 1000;
      const colors = ['#9c27b0', '#ab47bc', '#ba68c8'];

      (function frame() {
        confettiInstance({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: colors,
        });
        
        confettiInstance({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: colors,
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }

    function playCelebrationDefault(confettiInstance) {
      confettiInstance({
        particleCount: 100,
        spread: 160,
        origin: { y: 0.6 }
      });
    }

    return {
      confettiContainer,
      ...toRefs(state),
      addMilestone,
      acknowledgeMilestone
    };
  }
});
</script>