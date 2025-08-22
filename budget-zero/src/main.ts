// Import design system styles in order of cascade
import './styles/design-tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/utilities.css'
import './styles/animations.css'
import './styles/app.css'

// Import components
import './components/index.ts'

// Import HTML template directly
import appTemplate from './templates/app.html?raw'

// Budget Zero App Initialization - PURE HTML IMPORT!
document.querySelector<HTMLDivElement>('#app')!.innerHTML = appTemplate;

// Setup event handlers
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.querySelector<HTMLElement>('#toggle-loading');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const isLoading = toggleButton.hasAttribute('loading');
      if (isLoading) {
        toggleButton.removeAttribute('loading');
        toggleButton.textContent = 'Toggle Loading';
      } else {
        toggleButton.setAttribute('loading', '');
        toggleButton.textContent = 'Loading...';
      }
    });
  }
  
  document.addEventListener('bz-click', (event: any) => {
    console.log('Button clicked:', event.detail);
  });
});