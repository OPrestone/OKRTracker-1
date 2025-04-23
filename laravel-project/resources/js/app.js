import './bootstrap';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

// Import global components
import MilestoneToast from './components/MilestoneToast.vue';

// Import pages
import ConfettiDemo from './components/ConfettiDemo.vue';
import Dashboard from './pages/Dashboard.vue';
import Login from './pages/Login.vue';
import Register from './pages/Register.vue';
import TemplateGenerator from './pages/TemplateGenerator.vue';
import NotFound from './pages/NotFound.vue';

// Create the router
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'dashboard',
            component: Dashboard,
            meta: { requiresAuth: true }
        },
        {
            path: '/confetti-demo',
            name: 'confetti-demo',
            component: ConfettiDemo,
            meta: { requiresAuth: false }
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { guest: true }
        },
        {
            path: '/register',
            name: 'register',
            component: Register,
            meta: { guest: true }
        },
        {
            path: '/templates',
            name: 'templates',
            component: TemplateGenerator,
            meta: { requiresAuth: true }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: NotFound
        }
    ]
});

// Navigation guards
router.beforeEach((to, from, next) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (to.matched.some(record => record.meta.requiresAuth) && !isLoggedIn) {
        next({ name: 'login', query: { redirect: to.fullPath } });
    } else if (to.matched.some(record => record.meta.guest) && isLoggedIn) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

// Create and mount the Vue application
const app = createApp(App);

// Register global components
app.component('MilestoneToast', MilestoneToast);

// Use the router
app.use(router);

// Mount the app
app.mount('#app');