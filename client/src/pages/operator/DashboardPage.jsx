/**
 * Operator Dashboard Page
 */

import { useEffect } from "react";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { ErrorAlert } from "../../components/common/Alert";
import useRequest from "../../hooks/useRequest";
import OperatorDashboard from "../../components/operator/OperatorDashboard";

export const OperatorDashboardPage = () => {
  const { requests, loading, error, getOperatorComplaints } = useRequest();

  useEffect(() => {
    getOperatorComplaints();
  }, [getOperatorComplaints]);

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
