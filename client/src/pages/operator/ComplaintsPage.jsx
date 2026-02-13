/**
 * Operator Complaints Page
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { ErrorAlert } from "../../components/common/Alert";
import useRequest from "../../hooks/useRequest";
import MyComplaints from "../../components/operator/MyComplaints";

export const OperatorComplaintsPage = () => {
  const navigate = useNavigate();
  const {
    requests,
    loading,
    error,
    getOperatorComplaints,
    updateComplaintStatus,
  } = useRequest();

  useEffect(() => {
    getOperatorComplaints();
  }, [getOperatorComplaints]);

  const handleStartWork = async (complaintId) => {
    try {
      await updateComplaintStatus(complaintId, "IN_PROGRESS");
      await getOperatorComplaints();
    } catch {
      // Error handled by hook state
    }
  };

  return (
    <OperatorLayout>
      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <MyComplaints
          complaints={requests || []}
          loading={loading}
          actionLoading={loading}
          onStartWork={handleStartWork}
          onViewDetails={(id) => navigate(`/complaints/${id}`)}
        />
      )}
    </OperatorLayout>
  );
};

export default OperatorComplaintsPage;
