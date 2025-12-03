import { createSignal, Show, For, onCleanup } from "solid-js";
import "./navigation-dropdown.css";

export interface NavigationDropdownLink {
  href: string;
  label: string;
}

export interface NavigationDropdownProps {
  label: string;
  links: NavigationDropdownLink[];
  variant?: "default" | "user";
}

export default function NavigationDropdown(props: NavigationDropdownProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  let dropdownRef: HTMLDivElement | undefined;

  const toggleDropdown = () => {
    setIsOpen(!isOpen());
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      closeDropdown();
    }
  };

  // Close dropdown on Escape key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeDropdown();
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
    <div class="nav-dropdown" ref={dropdownRef}>
      <button
        class={`nav-dropdown__trigger ${props.variant === "user" ? "nav-dropdown__trigger--user" : ""}`}
        onClick={toggleDropdown}
        aria-expanded={isOpen()}
        aria-haspopup="true"
      >
        <span class="nav-dropdown__label">{props.label}</span>
        <svg
          class={`nav-dropdown__icon ${isOpen() ? "nav-dropdown__icon--open" : ""}`}
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
        <div class="nav-dropdown__menu" role="menu">
          <For each={props.links}>
            {(link) => (
              <a
                href={link.href}
                class="nav-dropdown__item"
                role="menuitem"
                onClick={closeDropdown}
              >
                {link.label}
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
