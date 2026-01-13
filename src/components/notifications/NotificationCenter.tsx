import { createSignal, createResource, For, Show, onCleanup, createEffect } from "solid-js";
import type { Notification } from "@/types";
import "./notification-center.css";

interface NotificationCenterProps {
  userId: string;
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

export default function NotificationCenter(props: NotificationCenterProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [unreadCount, setUnreadCount] = createSignal(
    props.initialUnreadCount || 0
  );

  // Refs for focus management
  let triggerRef: HTMLButtonElement | undefined;
  let dropdownRef: HTMLDivElement | undefined;

  // Fetch notifications from API
  const [notifications, { refetch }] = createResource(async () => {
    const response = await fetch("/api/notifications");
    if (!response.ok) return props.initialNotifications || [];
    const data = await response.json();
    return data.notifications as Notification[];
  });

  // Fetch unread count
  const [unreadCountResource] = createResource(async () => {
    const response = await fetch("/api/notifications/unread-count");
    if (!response.ok) return props.initialUnreadCount || 0;
    const data = await response.json();
    setUnreadCount(data.count);
    return data.count as number;
  });

  const toggleDropdown = () => {
    setIsOpen(!isOpen());
  };

  const markAsRead = async (notificationId: string) => {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "POST",
    });

    if (response.ok) {
      refetch();
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const response = await fetch("/api/notifications/mark-all-read", {
      method: "POST",
    });

    if (response.ok) {
      refetch();
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      refetch();
    }
  };

  // Keyboard event handler for Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen()) {
      setIsOpen(false);
      triggerRef?.focus();
    }
  };

  // Focus trap handler
  const handleFocusTrap = (e: KeyboardEvent) => {
    if (!isOpen() || e.key !== "Tab") return;

    const focusableElements = dropdownRef?.querySelectorAll(
      'button, a, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  // Effect to manage keyboard listeners and focus
  createEffect(() => {
    if (isOpen()) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keydown", handleFocusTrap);
      // Move focus to first interactive element in dropdown
      setTimeout(() => {
        const firstFocusable = dropdownRef?.querySelector(
          'button, a, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 0);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleFocusTrap);
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keydown", handleFocusTrap);
  });

  const getNotificationIcon = (actionType: string) => {
    switch (actionType) {
      case "product_price_conflict":
        return "⚠️";
      case "asset_price_changed":
        return "💰";
      case "asset_files_changed":
        return "📁";
      case "sale_completed":
        return "🎉";
      case "royalty_payment_received":
        return "💵";
      case "document_shared":
        return "📄";
      case "jam_submission_approved":
        return "🏆";
      default:
        return "🔔";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification: Notification) => {
    const entityType = notification.entity_type;
    const snapshot = notification.snapshot as Record<string, unknown>;

    switch (entityType) {
      case "product":
        return `/products/${snapshot.product_handle}`;
      case "document":
        return `/documents/${snapshot.document_handle}`;
      case "sale":
        return `/purchases`;
      default:
        return "/products";
    }
  };

  return (
    <div class="notification-center">
      <button
        ref={triggerRef}
        class="notification-center__trigger"
        onClick={toggleDropdown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleDropdown();
          }
        }}
        aria-label="Notifications"
        aria-expanded={isOpen()}
        aria-haspopup="true"
      >
        <svg
          class="notification-center__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <Show when={unreadCount() > 0}>
          <span class="notification-center__badge">
            {unreadCount() > 99 ? "99+" : unreadCount()}
          </span>
        </Show>
      </button>

      <Show when={isOpen()}>
        <div
          ref={dropdownRef}
          class="notification-center__dropdown"
          role="dialog"
          aria-label="Notifications menu"
          aria-modal="false"
        >
          <div class="notification-center__header">
            <h3 class="notification-center__title">Notifications</h3>
            <Show when={unreadCount() > 0}>
              <button
                class="notification-center__mark-all"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            </Show>
          </div>

          <div class="notification-center__list">
            <Show when={notifications.loading}>
              <div class="notification-center__loading">
                <div class="notification-center__skeleton" />
                <div class="notification-center__skeleton" />
                <div class="notification-center__skeleton" />
              </div>
            </Show>

            <Show when={notifications.error}>
              <div class="notification-center__error">
                <span class="notification-center__error-icon">⚠️</span>
                <p class="notification-center__error-text">
                  Failed to load notifications
                </p>
                <button
                  class="notification-center__retry-button"
                  onClick={() => refetch()}
                >
                  Try again
                </button>
              </div>
            </Show>

            <Show
              when={!notifications.loading && !notifications.error && notifications()?.length}
              fallback={
                <Show when={!notifications.loading && !notifications.error}>
                  <div class="notification-center__empty">
                    <span class="notification-center__empty-icon">🔔</span>
                    <p class="notification-center__empty-text">
                      No notifications yet
                    </p>
                  </div>
                </Show>
              }
            >
              <For each={notifications()}>
                {(notification) => (
                  <div
                    class={`notification-center__item ${
                      !notification.read
                        ? "notification-center__item--unread"
                        : ""
                    }`}
                  >
                    <a
                      href={getNotificationLink(notification)}
                      class="notification-center__item-link"
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                    >
                      <span class="notification-center__item-icon">
                        {getNotificationIcon(notification.action_type)}
                      </span>
                      <div class="notification-center__item-content">
                        <p class="notification-center__item-title">
                          {notification.title}
                        </p>
                        <p class="notification-center__item-message">
                          {notification.message}
                        </p>
                        <span class="notification-center__item-time">
                          {getTimeAgo(notification.created_at)}
                        </span>
                      </div>
                    </a>
                    <button
                      class="notification-center__item-delete"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteNotification(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                )}
              </For>
            </Show>
          </div>

          <div class="notification-center__footer">
            <a
              href="/settings/notifications"
              class="notification-center__settings-link"
              onClick={() => setIsOpen(false)}
            >
              Notification settings
            </a>
          </div>
        </div>
      </Show>

      {/* Backdrop */}
      <Show when={isOpen()}>
        <div
          class="notification-center__backdrop"
          onClick={() => setIsOpen(false)}
        />
      </Show>
    </div>
  );
}
