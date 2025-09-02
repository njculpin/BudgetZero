interface AuthPageProps {
  onAuthenticate: (email: string, inviteCode: string) => void;
}

export function AuthPage({ onAuthenticate }: AuthPageProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'view';
  
  const card = document.createElement('div');
  card.className = 'card';
  
  const header = document.createElement('div');
  header.className = 'card__header';
  
  const title = document.createElement('h2');
  title.className = 'card__title';
  title.textContent = 'Welcome';
  
  const subtitle = document.createElement('p');
  subtitle.className = 'card__subtitle';
  subtitle.textContent = 'Enter your invite code to get started';
  
  const form = document.createElement('div');
  form.className = 'form';
  
  const emailGroup = document.createElement('div');
  emailGroup.className = 'form__group';
  
  const emailLabel = document.createElement('label');
  emailLabel.className = 'form__label';
  emailLabel.textContent = 'Email';
  emailLabel.htmlFor = 'email';
  
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'email';
  emailInput.placeholder = 'Email';
  emailInput.className = 'form__input';
  
  const inviteGroup = document.createElement('div');
  inviteGroup.className = 'form__group';
  
  const inviteLabel = document.createElement('label');
  inviteLabel.className = 'form__label';
  inviteLabel.textContent = 'Invite Code';
  inviteLabel.htmlFor = 'inviteCode';
  
  const inviteInput = document.createElement('input');
  inviteInput.type = 'text';
  inviteInput.id = 'inviteCode';
  inviteInput.placeholder = 'Invite Code';
  inviteInput.className = 'form__input';
  
  const continueBtn = document.createElement('button');
  continueBtn.className = 'form__button';
  continueBtn.textContent = 'Continue';
  continueBtn.addEventListener('click', () => {
    const inviteCode = inviteInput.value;
    const email = emailInput.value;
    if (inviteCode && email) {
      onAuthenticate(email, inviteCode);
    } else {
      alert('Please enter both invite code and email');
    }
  });
  
  const backBtn = document.createElement('button');
  backBtn.className = 'button button--secondary';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => {
    window.history.back();
  });
  
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);
  inviteGroup.appendChild(inviteLabel);
  inviteGroup.appendChild(inviteInput);
  
  form.appendChild(emailGroup);
  form.appendChild(inviteGroup);
  form.appendChild(continueBtn);
  
  header.appendChild(title);
  header.appendChild(subtitle);
  
  card.appendChild(header);
  card.appendChild(form);
  card.appendChild(backBtn);
  
  container.appendChild(card);
  
  return container;
}
