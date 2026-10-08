import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import { ManagerProbationReviews } from "./ManagerProbationReviews";
import { fetchManagerProbationReviews } from "./api";
import { useRefreshOnNavigate } from "../../hooks/useRefreshOnNavigate";
import "./Manager.css";

const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
];

export const ManagerProbation = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [counts, setCounts] = useState({ pending: 0, submitted: 0 });

  const reloadCounts = async () => {
    try {
      const { summary } = await fetchManagerProbationReviews({ status: "all" });
      setCounts({
        pending: summary.pending ?? 0,
        submitted: summary.submitted ?? 0,
      });
    } catch (error) {
      console.error("Manager probation counts error:", error);
    }
  };

  useRefreshOnNavigate(() => {
    reloadCounts();
  }, []);

  return (
    <div className="manager-dashboard-wrapper manager-leaves-screen">
      <div className="manager-leaves-nav">
        <button
          type="button"
          className="manager-menu-back"
          onClick={() => navigate("/manager")}
          aria-label="Back to Manager Panel"
        >
          <FaChevronLeft aria-hidden="true" />
          Probation
        </button>
      </div>
      <div className="manager-status-filters manager-status-filters--orange">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status.value}
            type="button"
            className={statusFilter === status.value ? "active" : ""}
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label} {counts[status.value]}
          </button>
        ))}
      </div>
      <div className="manager-tab-content" role="tabpanel">
        <ManagerProbationReviews
          embedded
          statusFilter={statusFilter}
          onCountsChange={reloadCounts}
        />
      </div>
    </div>
  );
};
