import { create } from "zustand";

const AUTO_DISMISS_MS = 4000;

const useNotificationStore = create((set) => ({
  notifications: [],

  pushNotification: (notification) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextNotification = {
      id,
      type: notification.type || "info",
      title: notification.title || "Update",
      message: notification.message || "",
    };

    set((state) => ({
      notifications: [...state.notifications, nextNotification],
    }));

    window.setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((item) => item.id !== id),
      }));
    }, AUTO_DISMISS_MS);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    })),
}));

export default useNotificationStore;
