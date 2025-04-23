<template>
  <div class="app-container">
    <!-- Navigation -->
    <nav class="navbar navbar-expand-md navbar-light bg-white shadow-sm">
      <div class="container">
        <a class="navbar-brand" href="/">
          OKR Platform
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <!-- Left Side Of Navbar -->
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" :to="{ name: 'dashboard' }">Dashboard</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" :to="{ name: 'confetti-demo' }">Confetti Demo</router-link>
            </li>
          </ul>

          <!-- Right Side Of Navbar -->
          <ul class="navbar-nav ms-auto">
            <!-- Authentication Links -->
            <template v-if="!isLoggedIn">
              <li class="nav-item">
                <router-link class="nav-link" :to="{ name: 'login' }">Login</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" :to="{ name: 'register' }">Register</router-link>
              </li>
            </template>
            <template v-else>
              <li class="nav-item dropdown">
                <a id="navbarDropdown" class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" v-pre>
                  {{ user.name || 'User' }}
                </a>

                <div class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <a class="dropdown-item" href="#" @click.prevent="logout">
                    Logout
                  </a>
                </div>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="py-4">
      <div class="container">
        <transition name="fade" mode="out-in">
          <router-view />
        </transition>
      </div>
    </main>

    <!-- Global Components -->
    <MilestoneToast />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default defineComponent({
  name: 'App',
  
  setup() {
    const router = useRouter();
    const isLoggedIn = ref(false);
    const user = ref({});
    
    // Check authentication status on mount
    onMounted(() => {
      // Check local storage for logged in state
      isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true';
      
      // Try to get user data if logged in
      if (isLoggedIn.value) {
        fetchUserData();
      }
    });
    
    // Fetch user data from the API
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/user');
        user.value = response.data;
      } catch (error) {
        console.error('Failed to fetch user data', error);
        // If unauthorized, logout
        if (error.response?.status === 401) {
          logout();
        }
      }
    };
    
    // Logout function
    const logout = async () => {
      try {
        await axios.post('/logout');
      } catch (error) {
        console.error('Error during logout', error);
      } finally {
        // Clear local storage and reset state
        localStorage.removeItem('isLoggedIn');
        isLoggedIn.value = false;
        user.value = {};
        
        // Redirect to login
        router.push({ name: 'login' });
      }
    };
    
    return {
      isLoggedIn,
      user,
      logout
    };
  }
});
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>