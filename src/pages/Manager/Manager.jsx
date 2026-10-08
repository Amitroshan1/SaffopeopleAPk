import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ManagerTeamAttendance } from "./ManagerTeamAttendance";
import { ManagerProfileCard } from "./comps/ManagerProfileCard/ManagerProfileCard";
import { fetchPendingCounts, fetchManagerProfile, fetchProbationReviewsDue } from "./api";
import { managerCanViewNhqEngineeringTeamAttendance } from "./managerTeamAttendanceEligibility";
import "./Manager.css";
import { usePersistedView } from "../../hooks/usePersistedView";
import { useRefreshOnNavigate } from "../../hooks/useRefreshOnNavigate";

const MENU_VIEW = "menu";

const MANAGER_TABS = [MENU_VIEW, "attendance"];

const MENU_CARDS = [
  { key: "leave", label: "Leaves", countKey: "leave" },
  { key: "wfh", label: "Work From Home", countKey: "wfh" },
  { key: "resignation", label: "Resignation", countKey: "resignation" },
  { key: "probation", label: "Probation", countKey: "probation" },
];

const MENU_ROUTES = {
  leave: "/manager/leaves",
  wfh: "/manager/wfh",
  resignation: "/manager/resignation",
  probation: "/manager/probation",
};
const ATTENDANCE_TAB = { key: "attendance", label: "Attendance", countKey: "attendance" };

export const Manager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = usePersistedView({
    storageKey: "manager_panel_view",
    defaultView: MENU_VIEW,
    validViews: MANAGER_TABS,
    syncUrl: false,
    getParentView: (view) => (view && view !== MENU_VIEW ? MENU_VIEW : null),
  });
  const [statusFilter, setStatusFilter] = useState("All");
  const [updateSignal, setUpdateSignal] = useState(null);
  const [counts, setCounts] = useState({
    leave: 0,
    wfh: 0,
    claim: 0,
    resignation: 0,
    noc: 0,
  });
  const [probationCount, setProbationCount] = useState(0);
  const [managerProfile, setManagerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const reloadCounts = async () => {
    try {
      const pending = await fetchPendingCounts();
      setCounts(pending);
    } catch (error) {
      console.error("Manager counts load error:", error);
    }
  };

  useEffect(() => {
    if (location.state?.updatedId && location.state?.newStatus) {
      setUpdateSignal({
        id: location.state.updatedId,
        status: location.state.newStatus,
      });
    }
  }, [location.state]);

  useRefreshOnNavigate(() => {
    reloadCounts();
  }, [activeTab]);

  useRefreshOnNavigate(() => {
    (async () => {
      try {
        const profile = await fetchManagerProfile();
        setManagerProfile(profile);
      } catch (error) {
        console.error("Manager profile error:", error);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  const showTeamAttendance =
    !profileLoading && managerCanViewNhqEngineeringTeamAttendance(managerProfile?.scope);

  useEffect(() => {
    if (!showTeamAttendance && activeTab === ATTENDANCE_TAB.key) {
      setActiveTab(MENU_VIEW);
    }
  }, [showTeamAttendance, activeTab, setActiveTab]);

  useEffect(() => {
    let isMounted = true;
    const loadProbation = async () => {
      try {
        const list = await fetchProbationReviewsDue();
        if (isMounted) setProbationCount(Array.isArray(list) ? list.length : 0);
      } catch {
        if (isMounted) setProbationCount(0);
      }
    };
    loadProbation();
    return () => { isMounted = false; };
  }, []);

  const getCount = (countKey) => {
    if (countKey === "probation") return probationCount;
    if (countKey === "attendance") return 0;
    return counts[countKey] ?? 0;
  };

  const showMenu = activeTab === MENU_VIEW;

  return (
    <div className="manager-dashboard-wrapper">
      <ManagerProfileCard profile={managerProfile} loading={profileLoading} />

      {showMenu ? (
        <div className="manager-menu">
          {MENU_CARDS.map((card) => (
            <button
              key={card.key}
              type="button"
              className="manager-menu-card"
              onClick={() => navigate(MENU_ROUTES[card.key])}
            >
              <span className="manager-menu-card__label">{card.label}</span>
              <span className="manager-menu-card__count">{getCount(card.countKey)}</span>
              <FaChevronRight className="manager-menu-card__arrow" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <>
          <button
            type="button"
            className="manager-menu-back"
            onClick={() => setActiveTab(MENU_VIEW)}
          >
            <FaChevronLeft aria-hidden="true" />
            Attendance
          </button>
          <div className="manager-tab-content" role="tabpanel">
            <ManagerTeamAttendance scope={managerProfile?.scope} />
          </div>
        </>
      )}
    </div>
  );
};
