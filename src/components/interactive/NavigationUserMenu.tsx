import { createSignal, Show, For, onCleanup } from "solid-js";
import "./navigation-user-menu.css";

export interface NavigationUserMenuLink {
  href?: string;
  label: string;
  isDivider?: boolean;
  isSignOut?: boolean;
}

export interface NavigationUserMenuProps {
  userHandle: string;
  links: NavigationUserMenuLink[];
}

export default function NavigationUserMenu(props: NavigationUserMenuProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  let menuRef: HTMLDivElement | undefined;

  const toggleMenu = () => {
    setIsOpen(!isOpen());
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Close menu when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef && !menuRef.contains(event.target as Node)) {
      closeMenu();
    }
  };

  // Close menu on Escape key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  };

  // Set up event listeners
  if (typeof window !== "undefined") {
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    });
  }

  return (
    <div class="nav-user-menu" ref={menuRef}>
      <button
        class="nav-user-menu__trigger"
        onClick={toggleMenu}
        aria-expanded={isOpen()}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        <span class="nav-user-menu__avatar">
          {props.userHandle.charAt(0).toUpperCase()}
        </span>
        <span class="nav-user-menu__handle">@{props.userHandle}</span>
        <svg
          class={`nav-user-menu__icon ${isOpen() ? "nav-user-menu__icon--open" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <Show when={isOpen()}>
        <div class="nav-user-menu__dropdown" role="menu">
          <For each={props.links}>
            {(link) => (
              <>
                <Show when={link.isDivider}>
                  <div class="nav-user-menu__divider" role="separator"></div>
                </Show>
                <Show when={!link.isDivider && !link.isSignOut}>
                  <a
                    href={link.href}
                    class="nav-user-menu__item"
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                </Show>
                <Show when={link.isSignOut}>
                  <form action="/api/auth/sign-out" method="post" class="nav-user-menu__signout">
                    <button
                      type="submit"
                      class="nav-user-menu__item nav-user-menu__item--signout"
                      role="menuitem"
                    >
                      {link.label}
                    </button>
                  </form>
                </Show>
              </>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
