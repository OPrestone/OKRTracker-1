<template>
  <div class="okr-template-generator">
    <div class="card shadow-sm">
      <div class="card-header pb-3 border-bottom">
        <h5 class="card-title mb-0">One-Click OKR Generator</h5>
        <p class="text-muted small mb-0">Quickly create OKRs from pre-built templates</p>
      </div>
      
      <div class="card-body">
        <!-- Template Selection Section -->
        <div class="mb-4">
          <label class="form-label fw-medium">Department/Category</label>
          <div class="d-flex flex-wrap gap-2">
            <button 
              v-for="category in categories" 
              :key="category.name"
              class="btn btn-sm" 
              :class="selectedCategory === category.name ? 'btn-primary' : 'btn-outline-secondary'"
              @click="selectCategory(category.name)"
            >
              <i :class="category.icon" class="me-1"></i>
              {{ category.label }}
            </button>
          </div>
        </div>
        
        <!-- Template List -->
        <div v-if="filteredTemplates.length > 0" class="mb-4">
          <label class="form-label fw-medium">Select an OKR Template</label>
          <div class="list-group">
            <a 
              v-for="template in filteredTemplates" 
              :key="template.id"
              href="#"
              class="list-group-item list-group-item-action"
              :class="{'active': selectedTemplate && selectedTemplate.id === template.id}"
              @click.prevent="selectTemplate(template)"
            >
              <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">{{ template.name }}</h6>
                <small v-if="template.is_system" class="badge bg-info">System</small>
                <small v-else class="badge bg-secondary">Custom</small>
              </div>
              <p class="mb-1 small">{{ template.description }}</p>
              <small>
                {{ getTemplateStats(template) }}
              </small>
            </a>
          </div>
        </div>
        
        <div v-else-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading templates...</p>
        </div>
        
        <div v-else-if="selectedCategory" class="text-center py-4">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            No templates found for {{ selectedCategory }}. Try selecting a different category.
          </div>
        </div>
      </div>
      
      <!-- Template Preview and Generation Options -->
      <div v-if="selectedTemplate" class="border-top p-3">
        <h6 class="mb-3">Configuration</h6>
        
        <div class="mb-3">
          <label class="form-label">Timeframe</label>
          <select class="form-select" v-model="templateConfig.timeframeId">
            <option value="" disabled>Select a timeframe</option>
            <option 
              v-for="timeframe in timeframes" 
              :key="timeframe.id" 
              :value="timeframe.id"
            >
              {{ timeframe.name }} ({{ formatDate(timeframe.start_date) }} - {{ formatDate(timeframe.end_date) }})
            </option>
          </select>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Team (Optional)</label>
          <select class="form-select" v-model="templateConfig.teamId">
            <option :value="null">No team (personal OKR)</option>
            <option 
              v-for="team in teams" 
              :key="team.id" 
              :value="team.id"
            >
              {{ team.name }}
            </option>
          </select>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Customize Title (Optional)</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="templateConfig.customTitle" 
            :placeholder="selectedTemplate.template_data.objective.title"
          >
        </div>
        
        <div class="mb-3">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="showPreview" id="previewCheck">
            <label class="form-check-label" for="previewCheck">
              Show Preview
            </label>
          </div>
        </div>
        
        <!-- Template Preview (if enabled) -->
        <div v-if="showPreview && selectedTemplate" class="template-preview mb-3">
          <div class="alert alert-secondary">
            <h6 class="alert-heading">Template Preview</h6>
            
            <div class="mb-2">
              <strong>Objective:</strong> {{ templateConfig.customTitle || selectedTemplate.template_data.objective.title }}
            </div>
            
            <div class="mb-2">
              <strong>Key Results:</strong>
              <ul class="mb-0 ps-3">
                <li v-for="(kr, index) in selectedTemplate.template_data.key_results" :key="index">
                  {{ kr.title }}
                </li>
              </ul>
            </div>
            
            <div v-if="selectedTemplate.template_data.initiatives && selectedTemplate.template_data.initiatives.length > 0">
              <strong>Initiatives:</strong>
              <ul class="mb-0 ps-3">
                <li v-for="(initiative, index) in selectedTemplate.template_data.initiatives" :key="index">
                  {{ initiative.title }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="d-grid gap-2">
          <button 
            class="btn btn-primary" 
            @click="generateOkr"
            :disabled="!templateConfig.timeframeId || isGenerating"
          >
            <span v-if="isGenerating" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {{ isGenerating ? 'Generating...' : 'Generate OKR' }}
          </button>
          <button class="btn btn-outline-secondary" @click="resetForm">
            Cancel
          </button>
        </div>
      </div>
    </div>
    
    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success mt-3">
      <div class="d-flex align-items-center">
        <i class="bi bi-check-circle-fill me-2 fs-4"></i>
        <div>
          <strong>Success!</strong>
          <p class="mb-0">{{ successMessage }}</p>
        </div>
      </div>
      <div class="mt-2">
        <a :href="'/objectives/' + createdObjectiveId" class="btn btn-sm btn-success">
          View Objective
        </a>
      </div>
    </div>
    
    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-danger mt-3">
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
        <div>
          <strong>Error</strong>
          <p class="mb-0">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'OkrTemplateGenerator',
  
  setup() {
    // State
    const templates = ref([]);
    const teams = ref([]);
    const timeframes = ref([]);
    const loading = ref(true);
    const isGenerating = ref(false);
    const selectedCategory = ref(null);
    const selectedTemplate = ref(null);
    const showPreview = ref(false);
    const successMessage = ref('');
    const errorMessage = ref('');
    const createdObjectiveId = ref(null);
    
    // Form configuration
    const templateConfig = reactive({
      timeframeId: '',
      teamId: null,
      customTitle: '',
      customDescription: ''
    });
    
    // Available categories
    const categories = [
      { name: 'Sales', label: 'Sales', icon: 'bi bi-graph-up-arrow' },
      { name: 'Marketing', label: 'Marketing', icon: 'bi bi-megaphone' },
      { name: 'Product', label: 'Product', icon: 'bi bi-box' },
      { name: 'Engineering', label: 'Engineering', icon: 'bi bi-code-square' },
      { name: 'Customer Success', label: 'Customer Success', icon: 'bi bi-people' },
      { name: 'Finance', label: 'Finance', icon: 'bi bi-currency-dollar' },
      { name: 'HR', label: 'HR', icon: 'bi bi-person-badge' },
      { name: 'Custom', label: 'Custom', icon: 'bi bi-pencil-square' }
    ];
    
    // Computed properties
    const filteredTemplates = computed(() => {
      if (!selectedCategory.value) return [];
      
      if (selectedCategory.value === 'Custom') {
        return templates.value.filter(template => !template.is_system);
      } else if (selectedCategory.value === 'All') {
        return templates.value;
      } else {
        return templates.value.filter(template => 
          template.category === selectedCategory.value || 
          template.department === selectedCategory.value
        );
      }
    });
    
    // Methods
    const fetchTemplates = async () => {
      loading.value = true;
      try {
        const response = await axios.get('/api/okr-templates');
        templates.value = response.data;
      } catch (error) {
        console.error('Error fetching templates:', error);
        errorMessage.value = 'Failed to load OKR templates. Please try again.';
      } finally {
        loading.value = false;
      }
    };
    
    const fetchTimeframes = async () => {
      try {
        const response = await axios.get('/api/timeframes');
        timeframes.value = response.data;
        
        // Find current/upcoming timeframe and set as default
        const now = new Date();
        const currentTimeframe = timeframes.value.find(tf => {
          const startDate = new Date(tf.start_date);
          const endDate = new Date(tf.end_date);
          return startDate <= now && endDate >= now;
        });
        
        if (currentTimeframe) {
          templateConfig.timeframeId = currentTimeframe.id;
        } else if (timeframes.value.length > 0) {
          // Set the most recent timeframe as fallback
          templateConfig.timeframeId = timeframes.value[0].id;
        }
      } catch (error) {
        console.error('Error fetching timeframes:', error);
      }
    };
    
    const fetchTeams = async () => {
      try {
        const response = await axios.get('/api/teams');
        teams.value = response.data;
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    
    const selectCategory = (category) => {
      selectedCategory.value = category;
      selectedTemplate.value = null;
    };
    
    const selectTemplate = (template) => {
      selectedTemplate.value = template;
      showPreview.value = true;
      
      // Reset custom values
      templateConfig.customTitle = '';
      templateConfig.customDescription = '';
    };
    
    const getTemplateStats = (template) => {
      const keyResultsCount = template.template_data.key_results?.length || 0;
      const initiativesCount = template.template_data.initiatives?.length || 0;
      
      return `${keyResultsCount} Key Results · ${initiativesCount} Initiatives`;
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };
    
    const generateOkr = async () => {
      errorMessage.value = '';
      successMessage.value = '';
      isGenerating.value = true;
      
      try {
        const response = await axios.post(`/api/okr-templates/${selectedTemplate.value.id}/generate`, {
          timeframe_id: templateConfig.timeframeId,
          team_id: templateConfig.teamId,
          custom_title: templateConfig.customTitle,
          custom_description: templateConfig.customDescription
        });
        
        successMessage.value = 'OKR has been successfully generated!';
        createdObjectiveId.value = response.data.objective.id;
        
        // Reset form
        selectedTemplate.value = null;
        showPreview.value = false;
        
      } catch (error) {
        console.error('Error generating OKR:', error);
        errorMessage.value = error.response?.data?.errors?.template?.[0] 
          || 'Failed to generate OKR. Please try again.';
      } finally {
        isGenerating.value = false;
      }
    };
    
    const resetForm = () => {
      selectedTemplate.value = null;
      templateConfig.customTitle = '';
      templateConfig.customDescription = '';
      showPreview.value = false;
      errorMessage.value = '';
      successMessage.value = '';
    };
    
    // Lifecycle hooks
    onMounted(() => {
      fetchTemplates();
      fetchTimeframes();
      fetchTeams();
    });
    
    return {
      templates,
      teams,
      timeframes,
      loading,
      isGenerating,
      selectedCategory,
      selectedTemplate,
      templateConfig,
      showPreview,
      successMessage,
      errorMessage,
      createdObjectiveId,
      categories,
      filteredTemplates,
      selectCategory,
      selectTemplate,
      getTemplateStats,
      formatDate,
      generateOkr,
      resetForm
    };
  }
};
</script>

<style scoped>
.okr-template-generator {
  max-width: 800px;
  margin: 0 auto;
}

.template-preview {
  max-height: 300px;
  overflow-y: auto;
}
</style>