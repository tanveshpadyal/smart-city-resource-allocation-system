import { useEffect } from "react";
import useAuthStore from "../store/authStore";
import socketService from "../services/socketService";
import useNotificationStore from "../store/notificationStore";

export const SocketProvider = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const pushNotification = useNotificationStore(
    (state) => state.pushNotification,
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketService.disconnect();
      return;
    }

    socketService.connect(accessToken);
  }, [accessToken, isAuthenticated]);

  useEffect(() => () => {
    socketService.disconnect();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return undefined;

    const unsubscribeCreated = socketService.on("complaint:created", (payload) => {
      if (user.role === "ADMIN") {
        pushNotification({
          type: "info",
          title: "New complaint registered",
          message: payload?.message || "A citizen submitted a new complaint.",
          link: payload?.complaintId ? `/complaints/${payload.complaintId}` : null,
        });
      }
    });

    const unsubscribeAssigned = socketService.on("complaint:assigned", (payload) => {
      if (payload?.assignedTo === user.id) {
        pushNotification({
          type: "success",
          title: "Complaint assigned",
          message:
            payload?.complaintCategory && payload?.status
              ? `${payload.complaintCategory} complaint is now assigned to you.`
              : "A complaint has been assigned to you.",
          link: payload?.complaintId ? `/complaints/${payload.complaintId}` : null,
        });
        return;
      }

      if (payload?.citizenId === user.id) {
        pushNotification({
          type: "info",
          title: "Complaint assigned",
          message: payload.assignedOperator?.name
            ? `Your complaint was assigned to ${payload.assignedOperator.name}.`
            : "Your complaint was assigned.",
          link: payload?.complaintId ? `/complaints/${payload.complaintId}` : null,
        });
        return;
      }

      if (user.role === "ADMIN") {
        pushNotification({
          type: "info",
          title: "Assignment updated",
          message: payload.assignedOperator?.name
            ? `Complaint assigned to ${payload.assignedOperator.name}.`
            : "A complaint assignment was updated.",
          link: payload?.complaintId ? `/complaints/${payload.complaintId}` : null,
        });
      }
    });

    const unsubscribeStatus = socketService.on(
      "complaint:status-changed",
      (payload) => {
        const readableStatus = String(payload?.status || "")
          .replace(/_/g, " ")
          .toLowerCase();

        if (payload?.assignedTo === user.id || payload?.citizenId === user.id) {
          pushNotification({
            type: payload?.status === "RESOLVED" ? "success" : "info",
            title: "Complaint status updated",
            message: readableStatus
              ? `Complaint moved to ${readableStatus}.`
              : "A complaint status changed.",
            link: payload?.complaintId ? `/complaints/${payload.complaintId}` : null,
          });
          return;
        }

        if (user.role === "ADMIN") {
          pushNotification({
            type: payload?.status === "RESOLVED" ? "success" : "info",
            title: "Complaint updated",
            message: readableStatus
              ? `A complaint moved to ${readableStatus}.`
              : "A complaint status changed.",
            link: payload?.complaintId ? `/complaints/${payload.complaintId}` : null,
          });
        }
      },
    );

    return () => {
      unsubscribeCreated();
      unsubscribeAssigned();
      unsubscribeStatus();
    };
  }, [isAuthenticated, pushNotification, user?.id, user?.role]);

  return children;
};

export default SocketProvider;
