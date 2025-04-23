import { reactive, readonly } from 'vue';

// Define initial state
const state = reactive({
  recentMilestone: null,
  milestoneHistory: [],
  isShowingConfetti: false
});

// Store actions
export const milestoneStore = {
  // Get readonly state
  getState() {
    return readonly(state);
  },
  
  // Add a new milestone to celebrate
  addMilestone(milestone) {
    // Generate a random ID if not provided
    const id = milestone.id || Date.now();
    
    // Create the milestone object
    const newMilestone = {
      ...milestone,
      id,
      acknowledged: false,
      createdAt: new Date().toISOString()
    };
    
    // Set as recent and add to history
    state.recentMilestone = newMilestone;
    state.milestoneHistory.unshift(newMilestone);
    
    // Keep history to a reasonable size (last 20 items)
    if (state.milestoneHistory.length > 20) {
      state.milestoneHistory = state.milestoneHistory.slice(0, 20);
    }
    
    // Save to local storage for persistence
    saveToStorage();
    
    return newMilestone;
  },
  
  // Acknowledge a milestone
  acknowledgeMilestone(id) {
    if (state.recentMilestone && state.recentMilestone.id === id) {
      state.recentMilestone.acknowledged = true;
      
      // Update the milestone in history
      const index = state.milestoneHistory.findIndex(m => m.id === id);
      if (index !== -1) {
        state.milestoneHistory[index].acknowledged = true;
      }
      
      // Save to local storage
      saveToStorage();
    }
  },
  
  // Clear all milestones
  clearMilestones() {
    state.recentMilestone = null;
    state.milestoneHistory = [];
    localStorage.removeItem('milestoneStore');
  },
  
  // Set the confetti state
  setConfettiState(isShowing) {
    state.isShowingConfetti = isShowing;
  },
  
  // Load milestones from storage
  loadFromStorage() {
    try {
      const storedData = localStorage.getItem('milestoneStore');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Set milestone history
        if (Array.isArray(parsedData.milestoneHistory)) {
          state.milestoneHistory = parsedData.milestoneHistory;
        }
        
        // Set recent milestone if it hasn't been acknowledged
        if (parsedData.recentMilestone && !parsedData.recentMilestone.acknowledged) {
          state.recentMilestone = parsedData.recentMilestone;
        }
      }
    } catch (e) {
      console.error('Error loading milestone data from storage', e);
      // Reset if there's an error
      localStorage.removeItem('milestoneStore');
    }
  }
};

// Helper function to save state to localStorage
function saveToStorage() {
  const dataToStore = {
    recentMilestone: state.recentMilestone,
    milestoneHistory: state.milestoneHistory
  };
  
  localStorage.setItem('milestoneStore', JSON.stringify(dataToStore));
}

// Initialize by loading from storage
milestoneStore.loadFromStorage();