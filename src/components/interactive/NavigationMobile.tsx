import { createSignal, Show, For } from 'solid-js';

interface NavLink {
  href: string;
  label: string;
}

interface NavigationMobileProps {
  isAuthenticated: boolean;
  links: NavLink[];
}

export default function NavigationMobile(props: NavigationMobileProps) {
  const [isOpen, setIsOpen] = createSignal(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen());
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        class="navigation__hamburger"
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isOpen()}
      >
        <span class={`navigation__hamburger-line ${isOpen() ? 'navigation__hamburger-line--open-1' : ''}`}></span>
        <span class={`navigation__hamburger-line ${isOpen() ? 'navigation__hamburger-line--open-2' : ''}`}></span>
        <span class={`navigation__hamburger-line ${isOpen() ? 'navigation__hamburger-line--open-3' : ''}`}></span>
      </button>

      {/* Backdrop */}
      <Show when={isOpen()}>
        <div class="navigation__backdrop" onClick={closeMenu}></div>
      </Show>

      {/* Mobile Menu Drawer */}
      <div class={`navigation__drawer ${isOpen() ? 'navigation__drawer--open' : ''}`}>
        <nav class="navigation__drawer-nav">
          <For each={props.links}>
            {(link) => (
              <a href={link.href} class="navigation__drawer-link" onClick={closeMenu}>
                {link.label}
              </a>
            )}
          </For>
        </nav>

        <div class="navigation__drawer-actions">
          {props.isAuthenticated ? (
            <form action="/api/auth/sign-out" method="post">
              <button type="submit" class="navigation__drawer-button navigation__drawer-button--secondary">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <a href="/sign-in" class="navigation__drawer-button navigation__drawer-button--secondary" onClick={closeMenu}>
                Sign in
              </a>
              <a href="/sign-up" class="navigation__drawer-button navigation__drawer-button--primary" onClick={closeMenu}>
                Start Creating
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
