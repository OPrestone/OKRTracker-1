<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card mt-5">
          <div class="card-header bg-white p-4 border-bottom">
            <h4 class="mb-0">Register</h4>
          </div>
          
          <div class="card-body p-4">
            <div v-if="error" class="alert alert-danger">
              {{ error }}
            </div>
            
            <form @submit.prevent="handleRegister">
              <div class="mb-3">
                <label for="name" class="form-label">Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="name" 
                  v-model="form.name" 
                  required 
                  autofocus
                >
              </div>
              
              <div class="mb-3">
                <label for="email" class="form-label">Email Address</label>
                <input 
                  type="email" 
                  class="form-control" 
                  id="email" 
                  v-model="form.email" 
                  required
                >
              </div>
              
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="password" 
                  v-model="form.password" 
                  required
                >
              </div>
              
              <div class="mb-3">
                <label for="password_confirmation" class="form-label">Confirm Password</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="password_confirmation" 
                  v-model="form.password_confirmation" 
                  required
                >
              </div>
              
              <div class="d-grid">
                <button 
                  type="submit" 
                  class="btn btn-primary py-2" 
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ loading ? 'Creating Account...' : 'Register' }}
                </button>
              </div>
            </form>
            
            <div class="mt-4 text-center">
              <p>
                Already have an account? 
                <router-link :to="{ name: 'login' }" class="text-decoration-none">Login</router-link>
              </p>
            </div>
          </div>
        </div>
        
        <!-- Demo Mode Notice -->
        <div class="alert alert-info mt-4">
          <p class="mb-0">
            <strong>Demo Mode:</strong> For testing purposes, you can simply click the Register button without entering credentials.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'RegisterPage',
  
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const error = ref('');
    
    const form = reactive({
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    });
    
    const handleRegister = async () => {
      loading.value = true;
      error.value = '';
      
      // Simple validation
      if (form.password !== form.password_confirmation) {
        error.value = 'Passwords do not match.';
        loading.value = false;
        return;
      }
      
      try {
        // In a real app, this would be an actual API call
        // This is just simulating successful registration for the demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard
        router.push('/');
        
      } catch (err) {
        console.error('Registration error:', err);
        error.value = 'Failed to create account. Please try again.';
      } finally {
        loading.value = false;
      }
    };
    
    return {
      form,
      loading,
      error,
      handleRegister
    };
  }
};
</script>