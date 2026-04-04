import { Bell, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
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
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );

  if (!notifications.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => {
        const meta = typeStyles[notification.type] || typeStyles.info;
        const Icon = meta.icon || Bell;

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-lg shadow-slate-900/10 ${meta.shell}`}
          >
            <div className="flex items-start gap-3">
              <Icon size={18} className={`mt-0.5 shrink-0 ${meta.iconClass}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{notification.title}</p>
                {notification.message ? (
                  <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeNotification(notification.id)}
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
  );
};

export default NotificationCenter;
