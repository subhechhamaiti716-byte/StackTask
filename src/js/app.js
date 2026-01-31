import { store } from './state/store.js';
import { authService } from './state/auth.js';
import { initializeBoard } from './view/board.js';
import { initializeModal } from './view/taskModal.js';
import { initializeAnalytics } from './view/analytics.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Setup Theme 
  const initialTheme = store.state.theme;
  document.documentElement.setAttribute('data-theme', initialTheme);

  const themeToggleBtn = document.getElementById('themeToggle');
  themeToggleBtn.addEventListener('click', () => {
    store.dispatch('TOGGLE_THEME');
    document.documentElement.setAttribute('data-theme', store.state.theme);
  });

  // 2. Auth Flow Initialization Layer
  const authWrapper = document.getElementById('authWrapper');
  const mainApp = document.getElementById('mainApp');
  
  // App views
  const kanbanBoard = document.querySelector('.kanban-board');
  const analyticsDashboard = document.getElementById('analyticsDashboard');
  const analyticsToggle = document.getElementById('analyticsToggle');
  const boardToolbar = document.querySelector('.board-toolbar');
  let isAnalyticsView = false;
  
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  const toggleToSignup = document.getElementById('toggleToSignup');
  const toggleToLogin = document.getElementById('toggleToLogin');
  
  const authError = document.getElementById('authError');
  const logoutBtn = document.getElementById('logoutBtn');
  const displayUserName = document.getElementById('displayUserName');

  function showError(msg) {
    authError.textContent = msg;
    authError.classList.add('active');
  }

  function clearError() {
    authError.textContent = '';
    authError.classList.remove('active');
  }

  // Initialize views exactly once!
  initializeBoard();
  initializeModal();
  initializeAnalytics();

  // Auth Routing
  const checkAuthState = async () => {
    if (authService.isAuthenticated()) {
      // User is logged in
      const user = authService.getCurrentUser();
      authWrapper.classList.add('hidden');
      mainApp.classList.remove('hidden');
      displayUserName.textContent = `@${user.username}`;
      
      // Hydrate store for this specific user
      await store.init(user.id);
    } else {
      // User is NOT logged in
      authWrapper.classList.remove('hidden');
      mainApp.classList.add('hidden');
      
      // Cleanup DOM data if logging out
      document.querySelectorAll('.column-content').forEach(col => col.innerHTML = '');
    }
  };

  // Switch Auth Modes
  toggleToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    clearError();
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'block';
  });

  toggleToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    clearError();
    document.getElementById('signupView').style.display = 'none';
    document.getElementById('loginView').style.display = 'block';
  });

  // Log In Logic
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    try {
      await authService.login(
        document.getElementById('loginEmail').value,
        document.getElementById('loginPassword').value
      );
      loginForm.reset();
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // Sign Up Logic
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const btn = signupForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    try {
      await authService.signup(
        document.getElementById('signupUsername').value,
        document.getElementById('signupEmail').value,
        document.getElementById('signupPassword').value,
        document.getElementById('signupConfirm').value
      );
      
      // Automatically login after signup
      await authService.login(
        document.getElementById('signupEmail').value,
        document.getElementById('signupPassword').value
      );
      signupForm.reset();
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // Logout Logic
  logoutBtn.addEventListener('click', async () => {
    await authService.logout();
  });

  // View Toggling logic
  analyticsToggle.addEventListener('click', () => {
    isAnalyticsView = !isAnalyticsView;
    if (isAnalyticsView) {
      kanbanBoard.classList.add('hidden');
      boardToolbar.classList.add('hidden');
      analyticsDashboard.classList.remove('hidden');
      analyticsToggle.textContent = '📋 Board';
    } else {
      kanbanBoard.classList.remove('hidden');
      boardToolbar.classList.remove('hidden');
      analyticsDashboard.classList.add('hidden');
      analyticsToggle.textContent = '📊 Stats';
    }
  });

  // Listen to Global Auth changes and trigger router
  window.addEventListener('auth-changed', checkAuthState);

  // Initialize checks immediately
  await checkAuthState();
});
