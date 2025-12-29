import { createSignal, Show, For, onCleanup } from "solid-js";
import type { ProductStatus } from "@/types";
import "./navigation-user-menu.css";

export interface NavigationUserMenuLink {
  href?: string;
  label: string;
  isDivider?: boolean;
  isSignOut?: boolean;
}

export interface ProductSummary {
  id: string;
  handle: string;
  title: string;
  status: ProductStatus;
  updated_at: string;
  thumbnail_url: string | null;
}

export interface DocumentSummary {
  id: string;
  handle: string;
  title: string;
  updated_at: string;
}

export interface NavigationUserMenuProps {
  userHandle: string;
  links: NavigationUserMenuLink[];
  recentProducts?: ProductSummary[];
  totalProductCount?: number;
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

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  // Get status badge text
  const getStatusBadge = (status: string): string | null => {
    if (status === 'draft') return 'Draft';
    if (status === 'private') return 'Private';
    if (status === 'archived') return 'Archived';
    return null; // Don't show badge for public
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
          {/* Create Project Button */}
          <a
            href="/products/new"
            class="nav-user-menu__create-button"
            role="menuitem"
            onClick={closeMenu}
          >
            <svg
              class="nav-user-menu__create-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Project
          </a>

          {/* Projects Section */}
          <Show
            when={props.recentProducts && props.recentProducts.length > 0}
            fallback={
              <div class="nav-user-menu__empty-state">
                <svg
                  class="nav-user-menu__empty-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p class="nav-user-menu__empty-title">No projects yet</p>
                <p class="nav-user-menu__empty-text">Create your first game to start selling</p>
              </div>
            }
          >
            <div class="nav-user-menu__projects">
              <For each={props.recentProducts}>
                {(product) => (
                  <a
                    href={`/products/${product.handle}`}
                    class="nav-user-menu__project-item"
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    <div class="nav-user-menu__project-thumbnail">
                      <Show
                        when={product.thumbnail_url}
                        fallback={
                          <div class="nav-user-menu__project-placeholder">
                            {product.title.charAt(0).toUpperCase()}
                          </div>
                        }
                      >
                        <img src={product.thumbnail_url!} alt={product.title} />
                      </Show>
                    </div>
                    <div class="nav-user-menu__project-content">
                      <div class="nav-user-menu__project-header">
                        <span class="nav-user-menu__project-title">{product.title}</span>
                        <Show when={getStatusBadge(product.status)}>
                          <span class={`nav-user-menu__project-badge nav-user-menu__project-badge--${product.status}`}>
                            {getStatusBadge(product.status)}
                          </span>
                        </Show>
                      </div>
                      <span class="nav-user-menu__project-meta">
                        Updated {formatRelativeTime(product.updated_at)}
                      </span>
                    </div>
                  </a>
                )}
              </For>
            </div>

            {/* View All Link (only show if more than 3 products) */}
            <Show when={props.totalProductCount && props.totalProductCount > 3}>
              <a
                href="/products"
                class="nav-user-menu__view-all"
                role="menuitem"
                onClick={closeMenu}
              >
                View all {props.totalProductCount} projects →
              </a>
            </Show>
          </Show>

          <div class="nav-user-menu__divider" role="separator"></div>

          {/* Regular Menu Links */}
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
