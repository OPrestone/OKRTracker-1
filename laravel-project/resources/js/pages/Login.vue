<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card mt-5">
          <div class="card-header bg-white p-4 border-bottom">
            <h4 class="mb-0">Login</h4>
          </div>
          
          <div class="card-body p-4">
            <div v-if="error" class="alert alert-danger">
              {{ error }}
            </div>
            
            <form @submit.prevent="handleLogin">
              <div class="mb-3">
                <label for="email" class="form-label">Email Address</label>
                <input 
                  type="email" 
                  class="form-control" 
                  id="email" 
                  v-model="form.email" 
                  required 
                  autofocus
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
              
              <div class="mb-3 form-check">
                <input 
                  type="checkbox" 
                  class="form-check-input" 
                  id="remember" 
                  v-model="form.remember"
                >
                <label class="form-check-label" for="remember">Remember Me</label>
              </div>
              
              <div class="d-grid">
                <button 
                  type="submit" 
                  class="btn btn-primary py-2" 
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ loading ? 'Logging in...' : 'Login' }}
                </button>
              </div>
            </form>
            
            <div class="mt-4 text-center">
              <p>
                Don't have an account? 
                <router-link :to="{ name: 'register' }" class="text-decoration-none">Register</router-link>
              </p>
            </div>
          </div>
        </div>
        
        <!-- Demo Mode Notice -->
        <div class="alert alert-info mt-4">
          <p class="mb-0">
            <strong>Demo Mode:</strong> For testing purposes, you can simply click the Login button without entering credentials.
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
  name: 'LoginPage',
  
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const error = ref('');
    
    const form = reactive({
      email: '',
      password: '',
      remember: false
    });
    
    const handleLogin = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        // In a real app, this would be an actual API call
        // This is just simulating successful login for the demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard or the page user was trying to access
        const redirectPath = router.currentRoute.value.query.redirect || '/';
        router.push(redirectPath);
        
      } catch (err) {
        console.error('Login error:', err);
        error.value = 'Invalid credentials. Please try again.';
      } finally {
        loading.value = false;
      }
    };
    
    return {
      form,
      loading,
      error,
      handleLogin
    };
  }
};
</script>