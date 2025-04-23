<template>
  <div class="container py-5 text-center">
    <div class="error-container">
      <h1 class="display-1 text-muted">404</h1>
      <h2 class="mb-4">Page Not Found</h2>
      <p class="lead mb-5">The page you are looking for doesn't exist or has been moved.</p>
      <router-link :to="{ name: 'dashboard' }" class="btn btn-primary btn-lg">
        <i class="bi bi-house-door me-2"></i>Return to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundPage'
}
</script>

<style scoped>
.error-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 40px 0;
}
</style>