import { useEffect } from "react";
import { Navigate } from "react-router-dom";

/**
 * Legacy deep links (e.g. /manager/performance-reviews) fold into the Manager panel module.
 */
export function ManagerTabRedirect({ tab = "leave" }) {
  useEffect(() => {
    try {
      localStorage.setItem("manager_active_tab", tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  return <Navigate to="/manager" replace state={{ tab }} />;
}
