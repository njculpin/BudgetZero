// Budget Zero - Minimal App
// Simple, fast, no bloat - Pure vanilla TypeScript

import './styles/app.css';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { DashboardPage } from './components/DashboardPage';
import { ProjectsPage } from './components/ProjectsPage';
import { apiClient } from './utils/apiClient';
import type { User, AuthResponse } from './types/api';

// App state
const app = {
  user: null as User | null,
  currentView: 'landing' as string,
  
  async authenticate(email: string, inviteCode: string): Promise<void> {
    try {
      const response: AuthResponse = await apiClient.authInvite({
        email,
        inviteCode
      });
      
      this.user = response.user;
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      
      this.showView('dashboard');
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed. Please check your invite code.');
    }
  },
  
  logout(): void {
    this.user = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.showView('landing');
  },
  
  showView(viewName: string): void {
    console.log('Showing view:', viewName); // Debug log
    this.currentView = viewName;
    window.history.pushState({ view: viewName }, '', `/${viewName}`);
    this.render();
  },
  
  loadUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
        this.showView('dashboard');
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  },
  
  render(): void {
    console.log('Rendering view:', this.currentView); // Debug log
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('App container not found!'); // Debug log
      return;
    }
    
    // Add BEM app class
    appContainer.className = 'app';
    appContainer.innerHTML = '';
    
    let currentComponent: HTMLElement;
    
    try {
      switch (this.currentView) {
        case 'landing':
          currentComponent = LandingPage({ onGetStarted: () => this.showView('auth') });
          break;
        case 'auth':
          currentComponent = AuthPage({ onAuthenticate: (email, code) => this.authenticate(email, code) });
          break;
        case 'dashboard':
          if (!this.user) {
            this.showView('landing');
            return;
          }
          currentComponent = DashboardPage({ user: this.user, onLogout: () => this.logout(), onViewProjects: () => this.showView('projects') });
          break;
        case 'projects':
          if (!this.user) {
            this.showView('landing');
            return;
          }
          currentComponent = ProjectsPage({ user: this.user, onBack: () => this.showView('dashboard') });
          break;
        default:
          console.log('Default case, showing landing'); // Debug log
          currentComponent = LandingPage({ onGetStarted: () => this.showView('auth') });
      }
      
      appContainer.appendChild(currentComponent);
      console.log('Component rendered successfully'); // Debug log
    } catch (error) {
      console.error('Error rendering component:', error); // Debug log
      // Fallback to landing page
      const fallbackComponent = LandingPage({ onGetStarted: () => this.showView('auth') });
      appContainer.appendChild(fallbackComponent);
    }
  }
};

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
  console.log('Popstate event:', event.state); // Debug log
  if (event.state?.view) {
    app.currentView = event.state.view;
    app.render();
  }
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...'); // Debug log
  
  // Check if there's a route in the URL
  const path = window.location.pathname.slice(1); // Remove leading slash
  console.log('Initial path:', path); // Debug log
  
  if (path && ['landing', 'auth', 'dashboard', 'projects'].includes(path)) {
    app.currentView = path;
    console.log('Setting initial view to:', path); // Debug log
  }
  
  app.loadUser();
  app.render();
  
  console.log('App initialization complete'); // Debug log
});

// Also try to initialize if DOM is already loaded
if (document.readyState === 'loading') {
  console.log('DOM still loading, waiting...'); // Debug log
} else {
  console.log('DOM already loaded, initializing immediately...'); // Debug log
  
  const path = window.location.pathname.slice(1);
  if (path && ['landing', 'auth', 'dashboard', 'projects'].includes(path)) {
    app.currentView = path;
  }
  
  app.loadUser();
  app.render();
}