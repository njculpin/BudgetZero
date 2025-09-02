interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view';
  
  const card = document.createElement('div');
  card.className = 'card';
  
  const header = document.createElement('div');
  header.className = 'card__header';
  
  const title = document.createElement('h1');
  title.className = 'card__title';
  title.textContent = 'Budget Zero';
  
  const subtitle = document.createElement('p');
  subtitle.className = 'card__subtitle';
  subtitle.textContent = 'Collaborative game design platform with zero upfront investment';
  
  const footer = document.createElement('div');
  footer.className = 'card__footer';
  
  const button = document.createElement('button');
  button.className = 'button button--primary';
  button.textContent = 'Get Started';
  button.addEventListener('click', onGetStarted);
  
  header.appendChild(title);
  header.appendChild(subtitle);
  footer.appendChild(button);
  
  card.appendChild(header);
  card.appendChild(footer);
  container.appendChild(card);
  
  return container;
}
