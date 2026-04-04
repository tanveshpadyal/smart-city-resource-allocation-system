import { useEffect } from "react";
import socketService from "../services/socketService";

export const useRealtimeComplaints = ({
  onAssigned,
  onStatusChanged,
  complaintId,
}) => {
  useEffect(() => {
    if (complaintId) {
      socketService.subscribeToComplaint(complaintId);
    }

    const unsubscribeAssigned = onAssigned
      ? socketService.on("complaint:assigned", onAssigned)
      : () => {};

    const unsubscribeStatusChanged = onStatusChanged
      ? socketService.on("complaint:status-changed", onStatusChanged)
      : () => {};

    return () => {
      unsubscribeAssigned();
      unsubscribeStatusChanged();
      if (complaintId) {
        socketService.unsubscribeFromComplaint(complaintId);
      }
    };
  }, [complaintId, onAssigned, onStatusChanged]);
};

export default useRealtimeComplaints;
