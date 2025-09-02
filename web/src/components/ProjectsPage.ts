import type { User } from '../types/api';

interface ProjectsPageProps {
  user: User;
  onBack: () => void;
}

export function ProjectsPage({ user, onBack }: ProjectsPageProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view';
  
  const card = document.createElement('div');
  card.className = 'card';
  
  const header = document.createElement('div');
  header.className = 'card__header';
  
  const title = document.createElement('h2');
  title.className = 'card__title';
  title.textContent = 'Projects';
  
  const subtitle = document.createElement('p');
  subtitle.className = 'card__subtitle';
  subtitle.textContent = `Welcome back, ${user.name}!`;
  
  const content = document.createElement('div');
  content.className = 'card__content';
  
  const description = document.createElement('p');
  description.className = 'text';
  description.textContent = 'Your game design projects';
  
  const footer = document.createElement('div');
  footer.className = 'card__footer';
  
  const backBtn = document.createElement('button');
  backBtn.className = 'button button--secondary';
  backBtn.textContent = 'Back to Dashboard';
  backBtn.addEventListener('click', onBack);
  
  header.appendChild(title);
  header.appendChild(subtitle);
  content.appendChild(description);
  footer.appendChild(backBtn);
  
  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(footer);
  container.appendChild(card);
  
  return container;
}
