<template>
  <div class="templates-page">
    <div class="row mb-4">
      <div class="col-md-8">
        <h1 class="mb-3">OKR Templates</h1>
        <p class="lead text-muted">
          Browse and use pre-made OKR templates, or generate custom templates with AI assistance.
        </p>
      </div>
      <div class="col-md-4 d-flex justify-content-md-end align-items-center">
        <button 
          @click="showGeneratorModal = true" 
          class="btn btn-primary"
        >
          <i class="bi bi-magic me-2"></i>Generate Template with AI
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" v-model="filters.category">
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Department</label>
              <select class="form-select" v-model="filters.department">
                <option value="">All Departments</option>
                <option v-for="department in departments" :key="department" :value="department">
                  {{ department }}
                </option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">Search</label>
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Search templates..." 
                  v-model="filters.search"
                >
                <button 
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="searchTemplates"
                >
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading templates...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="templates.length === 0" class="text-center py-5">
      <div class="empty-state">
        <i class="bi bi-folder2-open display-1 text-muted"></i>
        <h3 class="mt-4">No Templates Found</h3>
        <p class="text-muted mb-4">
          Try adjusting your filters or create a new template.
        </p>
        <button @click="showGeneratorModal = true" class="btn btn-primary">
          <i class="bi bi-magic me-2"></i>Generate Template with AI
        </button>
      </div>
    </div>

    <!-- Templates Grid -->
    <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-4">
      <div v-for="template in templates" :key="template.id" class="col">
        <div class="card h-100 template-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h5 class="card-title mb-0">{{ template.name }}</h5>
              <span 
                v-if="template.is_ai_generated" 
                class="badge bg-primary rounded-pill"
                title="Generated with AI"
              >
                <i class="bi bi-magic"></i> AI
              </span>
            </div>
            <p class="card-text text-muted small mb-2">
              <span class="fw-bold">Category:</span> {{ template.category }}
            </p>
            <p class="card-text text-muted small mb-3">
              <span class="fw-bold">Department:</span> {{ template.department }}
            </p>
            <p class="card-text">{{ template.description }}</p>
          </div>
          <div class="card-footer bg-white border-0 pt-0">
            <div class="d-grid gap-2">
              <button 
                @click="viewTemplate(template)" 
                class="btn btn-outline-primary"
              >
                View Details
              </button>
              <button 
                @click="useTemplate(template)" 
                class="btn btn-outline-success"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total > pagination.perPage" class="d-flex justify-content-center">
      <nav aria-label="Page navigation">
        <ul class="pagination">
          <li :class="['page-item', { disabled: pagination.currentPage === 1 }]">
            <a 
              class="page-link" 
              href="#" 
              @click.prevent="changePage(pagination.currentPage - 1)"
            >
              Previous
            </a>
          </li>
          <li 
            v-for="page in paginationPages" 
            :key="page" 
            :class="['page-item', { active: pagination.currentPage === page }]"
          >
            <a 
              class="page-link" 
              href="#" 
              @click.prevent="changePage(page)"
            >
              {{ page }}
            </a>
          </li>
          <li :class="['page-item', { disabled: pagination.currentPage === pagination.lastPage }]">
            <a 
              class="page-link" 
              href="#" 
              @click.prevent="changePage(pagination.currentPage + 1)"
            >
              Next
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- AI Generator Modal -->
    <div 
      class="modal fade" 
      :class="{ show: showGeneratorModal }" 
      tabindex="-1" 
      :style="{ display: showGeneratorModal ? 'block' : 'none' }"
      id="generatorModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Generate OKR Template with AI</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showGeneratorModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="!generatedTemplate">
              <form @submit.prevent="generateTemplate">
                <div class="mb-3">
                  <label for="description" class="form-label">Goal Description</label>
                  <textarea 
                    id="description" 
                    class="form-control" 
                    rows="3" 
                    placeholder="Describe your goal or objective in detail..."
                    v-model="generatorForm.description"
                    required
                  ></textarea>
                  <div class="form-text">
                    Provide a clear description of what you want to achieve.
                  </div>
                </div>
                
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="department" class="form-label">Department</label>
                    <select 
                      id="department" 
                      class="form-select" 
                      v-model="generatorForm.department"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Product">Product</option>
                      <option value="Design">Design</option>
                      <option value="Customer Success">Customer Success</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  
                  <div class="col-md-6">
                    <label for="level" class="form-label">OKR Level</label>
                    <select 
                      id="level" 
                      class="form-select" 
                      v-model="generatorForm.level"
                      required
                    >
                      <option value="">Select Level</option>
                      <option value="company">Company</option>
                      <option value="department">Department</option>
                      <option value="team">Team</option>
                      <option value="individual">Individual</option>
                    </select>
                  </div>
                </div>
                
                <div class="d-grid gap-2">
                  <button 
                    type="submit" 
                    class="btn btn-primary" 
                    :disabled="generatingTemplate"
                  >
                    <span v-if="generatingTemplate">
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Generating...
                    </span>
                    <span v-else>
                      <i class="bi bi-magic me-2"></i>Generate Template
                    </span>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    @click="showGeneratorModal = false"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
            
            <!-- Generated Template Preview -->
            <div v-else>
              <div class="alert alert-success mb-4">
                <div class="d-flex">
                  <i class="bi bi-check-circle-fill fs-4 me-2"></i>
                  <div>
                    <h5 class="alert-heading mb-1">Template Generated Successfully!</h5>
                    <p class="mb-0">Review the generated template below. You can use it as is or make adjustments.</p>
                  </div>
                </div>
              </div>
              
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="mb-0">{{ generatedTemplate.name }}</h5>
                </div>
                <div class="card-body">
                  <p class="text-muted small mb-3">
                    <span class="fw-bold">Category:</span> {{ generatedTemplate.category }}<br>
                    <span class="fw-bold">Department:</span> {{ generatedTemplate.department }}
                  </p>
                  
                  <p>{{ generatedTemplate.description }}</p>
                  
                  <div class="mt-4">
                    <h6 class="mb-3">Objective</h6>
                    <div class="card mb-4">
                      <div class="card-body">
                        <h5>{{ generatedTemplate.template_data.objective.title }}</h5>
                        <p class="mb-0">{{ generatedTemplate.template_data.objective.description }}</p>
                      </div>
                    </div>
                    
                    <h6 class="mb-3">Key Results</h6>
                    <div class="list-group mb-4">
                      <div 
                        v-for="(kr, index) in generatedTemplate.template_data.key_results" 
                        :key="index"
                        class="list-group-item"
                      >
                        <h6>{{ kr.title }}</h6>
                        <p class="mb-0">{{ kr.description }}</p>
                      </div>
                    </div>
                    
                    <h6 class="mb-3">Initiatives</h6>
                    <div class="list-group">
                      <div 
                        v-for="(initiative, index) in generatedTemplate.template_data.initiatives" 
                        :key="index"
                        class="list-group-item"
                      >
                        <h6>{{ initiative.title }}</h6>
                        <p class="mb-0">{{ initiative.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between">
                <button 
                  class="btn btn-outline-secondary" 
                  @click="resetGenerator"
                >
                  <i class="bi bi-arrow-left me-2"></i>Back
                </button>
                
                <div>
                  <button 
                    class="btn btn-outline-primary me-2" 
                    @click="saveTemplate"
                    :disabled="savingTemplate"
                  >
                    <span v-if="savingTemplate">
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </span>
                    <span v-else>
                      <i class="bi bi-save me-2"></i>Save Template
                    </span>
                  </button>
                  
                  <button 
                    class="btn btn-success" 
                    @click="useTemplate(generatedTemplate)"
                  >
                    <i class="bi bi-check2 me-2"></i>Use Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="showGeneratorModal" 
      class="modal-backdrop fade show"
      @click="showGeneratorModal = false"
    ></div>

    <!-- Template Details Modal -->
    <div 
      class="modal fade" 
      :class="{ show: showDetailsModal }" 
      tabindex="-1" 
      :style="{ display: showDetailsModal ? 'block' : 'none' }"
      id="detailsModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Template Details</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showDetailsModal = false"
            ></button>
          </div>
          <div class="modal-body" v-if="selectedTemplate">
            <div class="card mb-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">{{ selectedTemplate.name }}</h5>
                <span 
                  v-if="selectedTemplate.is_ai_generated" 
                  class="badge bg-primary rounded-pill"
                  title="Generated with AI"
                >
                  <i class="bi bi-magic"></i> AI
                </span>
              </div>
              <div class="card-body">
                <p class="text-muted small mb-3">
                  <span class="fw-bold">Category:</span> {{ selectedTemplate.category }}<br>
                  <span class="fw-bold">Department:</span> {{ selectedTemplate.department }}
                </p>
                
                <p>{{ selectedTemplate.description }}</p>
                
                <div class="mt-4">
                  <h6 class="mb-3">Objective</h6>
                  <div class="card mb-4">
                    <div class="card-body">
                      <h5>{{ selectedTemplate.template_data.objective.title }}</h5>
                      <p class="mb-0">{{ selectedTemplate.template_data.objective.description }}</p>
                    </div>
                  </div>
                  
                  <h6 class="mb-3">Key Results</h6>
                  <div class="list-group mb-4">
                    <div 
                      v-for="(kr, index) in selectedTemplate.template_data.key_results" 
                      :key="index"
                      class="list-group-item"
                    >
                      <h6>{{ kr.title }}</h6>
                      <p class="mb-0">{{ kr.description }}</p>
                    </div>
                  </div>
                  
                  <h6 class="mb-3">Initiatives</h6>
                  <div class="list-group">
                    <div 
                      v-for="(initiative, index) in selectedTemplate.template_data.initiatives" 
                      :key="index"
                      class="list-group-item"
                    >
                      <h6>{{ initiative.title }}</h6>
                      <p class="mb-0">{{ initiative.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-outline-secondary" 
              @click="showDetailsModal = false"
            >
              Close
            </button>
            <button 
              type="button" 
              class="btn btn-success"
              @click="useTemplate(selectedTemplate)"
            >
              <i class="bi bi-check2 me-2"></i>Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
    <div 
      v-if="showDetailsModal" 
      class="modal-backdrop fade show"
      @click="showDetailsModal = false"
    ></div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'TemplatesPage',
  
  setup() {
    // State
    const templates = ref([]);
    const categories = ref([]);
    const departments = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    // Pagination
    const pagination = reactive({
      currentPage: 1,
      perPage: 12,
      total: 0,
      lastPage: 1
    });
    
    // Filters
    const filters = reactive({
      category: '',
      department: '',
      search: ''
    });
    
    // Template Generator
    const showGeneratorModal = ref(false);
    const generatingTemplate = ref(false);
    const savingTemplate = ref(false);
    const generatedTemplate = ref(null);
    const generatorForm = reactive({
      description: '',
      department: '',
      level: ''
    });
    
    // Template Details
    const showDetailsModal = ref(false);
    const selectedTemplate = ref(null);
    
    // Computed
    const paginationPages = computed(() => {
      const pages = [];
      const total = pagination.lastPage;
      const current = pagination.currentPage;
      
      // Always show first page
      pages.push(1);
      
      // Add pages around current page
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      
      // Always show last page if there are more than 1 page
      if (total > 1) {
        pages.push(total);
      }
      
      // Sort and remove duplicates
      return [...new Set(pages)].sort((a, b) => a - b);
    });
    
    // Methods
    const loadTemplates = async (page = 1) => {
      loading.value = true;
      error.value = null;
      
      try {
        const params = {
          page,
          category: filters.category,
          department: filters.department,
          search: filters.search
        };
        
        const response = await axios.get('/api/okr-templates', { params });
        templates.value = response.data.data.data; // Get the actual items
        
        // Update pagination
        pagination.currentPage = response.data.data.current_page;
        pagination.total = response.data.data.total;
        pagination.perPage = response.data.data.per_page;
        pagination.lastPage = response.data.data.last_page;
      } catch (err) {
        console.error('Error loading templates:', err);
        error.value = 'Failed to load templates. Please try again.';
        templates.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    const loadCategories = async () => {
      try {
        const response = await axios.get('/api/okr-templates/categories');
        categories.value = response.data.data;
      } catch (err) {
        console.error('Error loading categories:', err);
        categories.value = [];
      }
    };
    
    const loadDepartments = async () => {
      try {
        const response = await axios.get('/api/okr-templates/departments');
        departments.value = response.data.data;
      } catch (err) {
        console.error('Error loading departments:', err);
        departments.value = [];
      }
    };
    
    const changePage = (page) => {
      if (page < 1 || page > pagination.lastPage) return;
      pagination.currentPage = page;
      loadTemplates(page);
    };
    
    const searchTemplates = () => {
      pagination.currentPage = 1;
      loadTemplates(1);
    };
    
    const generateTemplate = async () => {
      generatingTemplate.value = true;
      
      try {
        const response = await axios.post('/api/okr-templates/generate', {
          description: generatorForm.description,
          department: generatorForm.department,
          level: generatorForm.level,
          save: false
        });
        
        generatedTemplate.value = response.data.data;
      } catch (err) {
        console.error('Error generating template:', err);
        alert('Failed to generate template. Please try again.');
      } finally {
        generatingTemplate.value = false;
      }
    };
    
    const saveTemplate = async () => {
      savingTemplate.value = true;
      
      try {
        const response = await axios.post('/api/okr-templates/generate', {
          description: generatorForm.description,
          department: generatorForm.department,
          level: generatorForm.level,
          save: true
        });
        
        // Close modal and refresh templates
        showGeneratorModal.value = false;
        resetGenerator();
        loadTemplates();
        
        alert('Template saved successfully!');
      } catch (err) {
        console.error('Error saving template:', err);
        alert('Failed to save template. Please try again.');
      } finally {
        savingTemplate.value = false;
      }
    };
    
    const resetGenerator = () => {
      generatedTemplate.value = null;
      generatorForm.description = '';
      generatorForm.department = '';
      generatorForm.level = '';
    };
    
    const viewTemplate = (template) => {
      selectedTemplate.value = template;
      showDetailsModal.value = true;
    };
    
    const useTemplate = (template) => {
      // In a real application, this would create an OKR from the template
      // For now, just show an alert
      alert(`Using template: ${template.name}\n\nIn a real application, this would create a new OKR from the template.`);
      
      // Close modals
      showDetailsModal.value = false;
      showGeneratorModal.value = false;
    };
    
    // Lifecycle hooks
    onMounted(() => {
      loadTemplates();
      loadCategories();
      loadDepartments();
    });
    
    return {
      // State
      templates,
      categories,
      departments,
      loading,
      error,
      pagination,
      filters,
      showGeneratorModal,
      generatingTemplate,
      savingTemplate,
      generatedTemplate,
      generatorForm,
      showDetailsModal,
      selectedTemplate,
      
      // Computed
      paginationPages,
      
      // Methods
      loadTemplates,
      changePage,
      searchTemplates,
      generateTemplate,
      saveTemplate,
      resetGenerator,
      viewTemplate,
      useTemplate
    };
  }
};
</script>

<style scoped>
.templates-page {
  padding-bottom: 50px;
}

.template-card {
  transition: all 0.2s ease;
}

.template-card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
}

.empty-state {
  padding: 40px 0;
  max-width: 500px;
  margin: 0 auto;
}

/* Modal backdrop for demonstration */
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

/* For demonstration without Bootstrap's JS */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  outline: 0;
}
</style>