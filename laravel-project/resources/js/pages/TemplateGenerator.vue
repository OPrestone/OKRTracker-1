<template>
  <div class="container py-4">
    <h1 class="mb-4">OKR Template Generator</h1>
    
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card bg-light border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <div class="d-flex align-items-center mb-3">
              <div class="feature-icon bg-primary text-white rounded-circle p-3 me-3">
                <i class="bi bi-magic fs-4"></i>
              </div>
              <div>
                <h3 class="mb-1">One-Click OKR Creation</h3>
                <p class="text-muted mb-0">
                  Generate complete OKR sets instantly from pre-built templates.
                </p>
              </div>
            </div>
            <p>
              Save time and ensure alignment by using our curated templates. Each template includes a well-structured 
              objective with key results and initiatives, allowing you to quickly set up OKRs that follow best practices.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <div class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill text-success me-2"></i>
                <span>Pre-built templates for different departments</span>
              </div>
              <div class="d-flex align-items-center ms-4">
                <i class="bi bi-check-circle-fill text-success me-2"></i>
                <span>Customizable for your specific needs</span>
              </div>
              <div class="d-flex align-items-center ms-4">
                <i class="bi bi-check-circle-fill text-success me-2"></i>
                <span>Create your own templates from existing OKRs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-12">
        <div class="mb-4">
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <a 
                class="nav-link" 
                :class="{ active: activeTab === 'generate' }"
                href="#" 
                @click.prevent="activeTab = 'generate'"
              >
                <i class="bi bi-lightning-charge me-1"></i>
                Generate OKRs
              </a>
            </li>
            <li class="nav-item">
              <a 
                class="nav-link" 
                :class="{ active: activeTab === 'manage' }"
                href="#" 
                @click.prevent="activeTab = 'manage'"
              >
                <i class="bi bi-pencil-square me-1"></i>
                Manage Templates
              </a>
            </li>
            <li class="nav-item">
              <a 
                class="nav-link" 
                :class="{ active: activeTab === 'create' }"
                href="#" 
                @click.prevent="activeTab = 'create'"
              >
                <i class="bi bi-plus-lg me-1"></i>
                Create Template
              </a>
            </li>
          </ul>
        </div>
        
        <!-- Generator Tab -->
        <div v-if="activeTab === 'generate'" class="tab-content">
          <OkrTemplateGenerator />
        </div>
        
        <!-- Manage Templates Tab -->
        <div v-else-if="activeTab === 'manage'" class="tab-content">
          <div class="card shadow-sm">
            <div class="card-header bg-light pb-3 border-bottom">
              <h5 class="card-title mb-0">Manage OKR Templates</h5>
              <p class="text-muted small mb-0">View, edit, and delete your templates</p>
            </div>
            <div class="card-body">
              <p class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Template management functionality will be available soon.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Create Template Tab -->
        <div v-else-if="activeTab === 'create'" class="tab-content">
          <div class="card shadow-sm">
            <div class="card-header bg-light pb-3 border-bottom">
              <h5 class="card-title mb-0">Create New Template</h5>
              <p class="text-muted small mb-0">Build a custom OKR template</p>
            </div>
            <div class="card-body">
              <p class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Template creation functionality will be available soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import OkrTemplateGenerator from '../components/OkrTemplateGenerator.vue';

export default {
  name: 'TemplateGeneratorPage',
  
  components: {
    OkrTemplateGenerator
  },
  
  setup() {
    const activeTab = ref('generate');
    
    return {
      activeTab
    };
  }
};
</script>

<style scoped>
.feature-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>