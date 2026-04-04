import { Bell, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotificationStore from "../../store/notificationStore";

const typeStyles = {
  success: {
    icon: CheckCircle2,
    shell:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    iconClass: "text-emerald-600 dark:text-emerald-300",
  },
  warning: {
    icon: AlertTriangle,
    shell:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    iconClass: "text-amber-600 dark:text-amber-300",
  },
  info: {
    icon: Info,
    shell:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100",
    iconClass: "text-sky-600 dark:text-sky-300",
  },
};

export const NotificationCenter = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const panelOpen = useNotificationStore((state) => state.panelOpen);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const closePanel = useNotificationStore((state) => state.closePanel);
  const navigate = useNavigate();

  if (!panelOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/10"
        onClick={closePanel}
        aria-label="Close notifications"
      />
      <div className="absolute right-4 top-20 z-[101] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-[#020617]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent complaint updates
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                Mark all read
              </button>
            ) : null}
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Close notifications"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto p-3">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
              <Bell size={18} className="mx-auto text-slate-400 dark:text-slate-500" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                No notifications yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Complaint updates will show here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const meta = typeStyles[notification.type] || typeStyles.info;
                const Icon = meta.icon || Bell;

                return (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${meta.shell} ${
                      !notification.read ? "ring-1 ring-indigo-400/40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Icon
                          size={18}
                          className={`mt-0.5 shrink-0 ${meta.iconClass}`}
                        />
                        {!notification.read ? (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.link) {
                              navigate(notification.link);
                              closePanel();
                            }
                          }}
                          className="block w-full text-left"
                        >
                          <p className="text-sm font-semibold">{notification.title}</p>
                          {notification.message ? (
                            <p className="mt-1 text-sm opacity-90">
                              {notification.message}
                            </p>
                          ) : null}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                        aria-label="Dismiss notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
