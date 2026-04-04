import { create } from "zustand";

const MAX_NOTIFICATIONS = 20;

const createNotification = (notification) => ({
  id: notification.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: notification.type || "info",
  title: notification.title || "Update",
  message: notification.message || "",
  createdAt: notification.createdAt || new Date().toISOString(),
  read: Boolean(notification.read),
  link: notification.link || null,
});

const useNotificationStore = create((set) => ({
  notifications: [],
  panelOpen: false,

  pushNotification: (notification) => {
    const nextNotification = createNotification(notification);

    set((state) => ({
      notifications: [nextNotification, ...state.notifications].slice(
        0,
        MAX_NOTIFICATIONS,
      ),
    }));
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        read: true,
      })),
    })),

  clearNotifications: () =>
    set({
      notifications: [],
    }),

  togglePanel: () =>
    set((state) => ({
      panelOpen: !state.panelOpen,
    })),

  closePanel: () =>
    set({
      panelOpen: false,
    }),
}));

export default useNotificationStore;
