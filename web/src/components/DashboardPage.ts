import type { User } from '../types/api';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  onViewProjects: () => void;
}

export function DashboardPage({ user, onLogout, onViewProjects }: DashboardPageProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view';
  
  const card = document.createElement('div');
  card.className = 'card';
  
  const header = document.createElement('div');
  header.className = 'card__header';
  
  const title = document.createElement('h2');
  title.className = 'card__title';
  title.textContent = 'Dashboard';
  
  const subtitle = document.createElement('p');
  subtitle.className = 'card__subtitle';
  subtitle.textContent = `Welcome back, ${user.name}!`;
  
  const content = document.createElement('div');
  content.className = 'card__content';
  
  const projectsBtn = document.createElement('button');
  projectsBtn.className = 'button button--primary';
  projectsBtn.textContent = 'View Projects';
  projectsBtn.addEventListener('click', onViewProjects);
  
  const footer = document.createElement('div');
  footer.className = 'card__footer';
  
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'button button--secondary';
  logoutBtn.textContent = 'Logout';
  logoutBtn.addEventListener('click', onLogout);
  
  header.appendChild(title);
  header.appendChild(subtitle);
  content.appendChild(projectsBtn);
  footer.appendChild(logoutBtn);
  
  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(footer);
  container.appendChild(card);
  
  return container;
}
