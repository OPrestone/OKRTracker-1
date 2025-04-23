<template>
  <div class="container py-4">
    <h1 class="mb-4">OKR Dashboard</h1>
    
    <div class="alert alert-primary d-flex align-items-center" role="alert">
      <i class="bi bi-info-circle-fill me-3 fs-4"></i>
      <div>
        The dashboard is under development. Use the navigation menu to access the OKR Templates feature.
      </div>
    </div>
    
    <div class="card mt-4">
      <div class="card-header bg-light pb-3 border-bottom">
        <h5 class="card-title mb-0">Quick Navigation</h5>
        <p class="text-muted small mb-0">Access key features of the OKR Platform</p>
      </div>
      <div class="card-body">
        <div class="row g-4">
          <!-- OKR Templates Card -->
          <div class="col-md-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="rounded-circle bg-primary p-2 text-white me-3">
                    <i class="bi bi-magic fs-4"></i>
                  </div>
                  <h5 class="card-title mb-0">OKR Templates</h5>
                </div>
                <p class="card-text">Create OKRs instantly from pre-built templates or create your own custom templates.</p>
              </div>
              <div class="card-footer bg-white border-0 pt-0">
                <router-link :to="{ name: 'templates' }" class="btn btn-outline-primary w-100">
                  Go to Templates
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- My Objectives Card -->
          <div class="col-md-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="rounded-circle bg-success p-2 text-white me-3">
                    <i class="bi bi-bullseye fs-4"></i>
                  </div>
                  <h5 class="card-title mb-0">My Objectives</h5>
                </div>
                <p class="card-text">View and manage your personal objectives, key results, and track your progress.</p>
              </div>
              <div class="card-footer bg-white border-0 pt-0">
                <button class="btn btn-outline-success w-100" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
          
          <!-- Team OKRs Card -->
          <div class="col-md-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="rounded-circle bg-info p-2 text-white me-3">
                    <i class="bi bi-people fs-4"></i>
                  </div>
                  <h5 class="card-title mb-0">Team OKRs</h5>
                </div>
                <p class="card-text">Explore your team's objectives and key results, and see how everyone is contributing.</p>
              </div>
              <div class="card-footer bg-white border-0 pt-0">
                <button class="btn btn-outline-info w-100" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard'
}
</script>

<style scoped>
.card-title {
  font-weight: 500;
}
</style>