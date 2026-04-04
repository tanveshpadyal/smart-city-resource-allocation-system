/**
 * Operator Dashboard Page
 */

import { useEffect } from "react";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { ErrorAlert } from "../../components/common/Alert";
import useRequest from "../../hooks/useRequest";
import useAuth from "../../hooks/useAuth";
import useRealtimeComplaints from "../../hooks/useRealtimeComplaints";
import OperatorDashboard from "../../components/operator/OperatorDashboard";

export const OperatorDashboardPage = () => {
  const { user } = useAuth();
  const { requests, loading, error, getOperatorComplaints } = useRequest();

  useEffect(() => {
    getOperatorComplaints();
  }, [getOperatorComplaints]);

  useRealtimeComplaints({
    onAssigned: (payload) => {
      if (payload?.assignedTo === user?.id) {
        getOperatorComplaints();
      }
    },
    onStatusChanged: (payload) => {
      if (payload?.assignedTo === user?.id) {
        getOperatorComplaints();
      }
    },
  });

  return (
    <OperatorLayout>
      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <OperatorDashboard requests={requests || []} loading={loading} />
      )}
    </OperatorLayout>
  );
};

export default OperatorDashboardPage;
