import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import { LeaveRequests } from "./comps/LeaveRequests/LeaveRequests";
import { fetchManagerRequests } from "./api";
import { useRefreshOnNavigate } from "../../hooks/useRefreshOnNavigate";
import "./Manager.css";

const STATUS_FILTERS = ["Pending", "Approved", "Rejected"];

export const ManagerLeaves = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [counts, setCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0 });

  const reloadCounts = async () => {
    try {
      const lists = await Promise.all(
        STATUS_FILTERS.map((status) => fetchManagerRequests("leave", status)),
      );
      setCounts({
        Pending: lists[0].length,
        Approved: lists[1].length,
        Rejected: lists[2].length,
      });
    } catch (error) {
      console.error("Manager leave counts error:", error);
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
          Leaves
        </button>
      </div>
      <div className="manager-status-filters manager-status-filters--orange">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            className={statusFilter === status ? "active" : ""}
            onClick={() => setStatusFilter(status)}
          >
            {status} {counts[status]}
          </button>
        ))}
      </div>
      <div className="manager-tab-content" role="tabpanel">
        <LeaveRequests statusFilter={statusFilter} onRequestUpdated={reloadCounts} />
      </div>
    </div>
  );
};
