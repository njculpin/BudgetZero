import { createSignal, createResource, For, Show } from "solid-js";
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
        return `/products/edit/${snapshot.product_handle}`;
      case "asset":
        return `/assets/${snapshot.asset_handle}`;
      case "document":
        return `/documents/${snapshot.document_handle}`;
      case "sale":
        return `/dashboard?tab=sales`;
      default:
        return "/dashboard";
    }
  };

  return (
    <div class="notification-center">
      <button
        class="notification-center__trigger"
        onClick={toggleDropdown}
        aria-label="Notifications"
        aria-expanded={isOpen()}
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
        <div class="notification-center__dropdown">
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
            <Show
              when={!notifications.loading && notifications()?.length}
              fallback={
                <div class="notification-center__empty">
                  <span class="notification-center__empty-icon">🔔</span>
                  <p class="notification-center__empty-text">
                    No notifications yet
                  </p>
                </div>
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
