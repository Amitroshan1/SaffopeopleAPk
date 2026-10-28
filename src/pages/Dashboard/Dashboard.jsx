import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiChevronRight,
  FiCheckCircle,
  FiUserCheck,
  FiSun,
  FiMessageSquare,
  FiHome,
  FiClock,
  FiUser,
  FiStar,
  FiRefreshCw,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import { MdBadge } from "react-icons/md";
import { GiReceiveMoney } from "react-icons/gi";
import { IoMdPerson } from "react-icons/io";
import { App as CapacitorApp } from "@capacitor/app";
import "./Dashboard.css";
import { hasFeature } from "../../utils/planFeatures";
import { useRefreshOnNavigate } from "../../hooks/useRefreshOnNavigate";
import { useNativeModalBack } from "../../hooks/useNativeSubViewBack";
import { getCurrentCoordinates } from "../../mobile/native/nativeLocation";
import { isNativeApp } from "../../mobile/native/platform";
import { formatDateDDMMYYYY } from "../../utils/dateFormat";
import { fetchEmployeeHomepage, APP_SOFT_REFRESH_EVENT } from "../../utils/homepageApi";
import { useUser } from "../../components/layout/UserContext";
import { PolicyAckModal } from "../../components/PolicyAckModal";
const formatDate = (value) => formatDateDDMMYYYY(value, "N/A");

const API_BASE_URL = "/api/auth";

async function postPunchOutRequest(token, body) {
  const response = await fetch(`${API_BASE_URL}/employee/punch-out`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let result = {};
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: `Server error (${response.status || "network"})` };
  }
  return { ok: response.ok, result };
}

async function postPunchInRequest(token, body) {
  const response = await fetch(`${API_BASE_URL}/employee/punch-in`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let result = {};
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: `Server error (${response.status || "network"})` };
  }
  return { ok: response.ok, result };
}

function coordsToPunchFields(coords) {
  if (!coords) return {};
  const fields = {
    lat: coords.lat,
    lon: coords.lon,
  };
  if (coords.accuracy_m != null && Number.isFinite(Number(coords.accuracy_m))) {
    fields.accuracy = Number(coords.accuracy_m);
    fields.accuracy_m = Number(coords.accuracy_m);
  }
  if (coords.device_class) {
    fields.device_class = coords.device_class;
  }
  return fields;
}

/** Fresh GPS for auto cap punch-out (not cached punch-in location). */
async function fetchFreshPosition() {
  try {
    return await getCurrentCoordinates({ timeout: 12000 });
  } catch {
    return null;
  }
}

const PUNCH_DISPLAY_TZ = "Asia/Kolkata";

/** Parse punch clock consistently with session segments (strip API Z suffix when present). */
const parsePunchClock = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const [h, m, sec = 0] = s.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, sec, 0);
    return d;
  }
  let normalized = s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s;
  if (/[zZ]$/.test(normalized)) {
    normalized = normalized.slice(0, -1);
  }
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

const parsePunchInToDate = (val) => parsePunchClock(val);

const formatTime = (timeString) => {
  if (!timeString) return "---";
  try {
    const s = String(timeString).trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const [h, m, sec = 0] = s.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, sec, 0);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }
    const d = parsePunchClock(timeString);
    if (!d) return "Invalid Time";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: PUNCH_DISPLAY_TZ,
    });
  } catch {
    return "Invalid Time";
  }
};

const formatWorkingHours = (val) => {
  if (!val) return "0h 00m 00s";
  const v = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return "0h 00m 00s"; // Reject datetime-like "0000-04-22 00:00:00"
  if (/^\d+h\s+\d+m\s+\d+s$/.test(v)) return v;
  const m = v.match(/^(\d+):(\d{2}):(\d{2})/);
  if (m) {
    const [, h, min, sec] = m;
    return `${parseInt(h, 10)}h ${min}m ${sec}s`;
  }
  return "0h 00m 00s";
};
const calculateExperience = (doj) => {
  if (!doj) return "N/A";
  const today = new Date();
  const joinDate = new Date(doj);
  if (isNaN(joinDate.getTime())) return "N/A";
  let totalMonths =
    (today.getFullYear() - joinDate.getFullYear()) * 12 +
    (today.getMonth() - joinDate.getMonth());
  if (today.getDate() < joinDate.getDate()) totalMonths--;
  if (totalMonths < 0) return "Less than a year";
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
  return parts.length ? parts.join(" ") : "Less than a month";
};
const formatTimeDifference = (diffMs) => {
    if (diffMs < 0) diffMs = 0;
    
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours)}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

/** Backend duration_hms is "H:MM:SS" — sum closed segments for Hours Today + live open */
const parseHmsToMs = (val) => {
    if (!val) return 0;
    const parts = String(val).trim().split(":").map((x) => Number(x));
    if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return 0;
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    return (h * 3600 + m * 60 + s) * 1000;
};

const parseIsoToMs = (iso) => {
    if (!iso) return NaN;
    const d = parsePunchClock(iso);
    return d ? d.getTime() : NaN;
};

/** Open-segment live time capped at the 10h auto-close deadline from the API. */
const cappedOpenLiveMs = (clockIn, sessionAutoCloseAt, now = Date.now()) => {
    const t0 = parseIsoToMs(clockIn);
    if (!Number.isFinite(t0)) return 0;
    let liveMs = Math.max(0, now - t0);
    const closeAt = parseIsoToMs(sessionAutoCloseAt);
    if (Number.isFinite(closeAt)) {
        liveMs = Math.min(liveMs, Math.max(0, closeAt - t0));
    }
    return liveMs;
};

const localIsoDate = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Per punch-in → punch-out segments from homepage API (closed = fixed duration; open = live). */
function PunchSessionsList({ sessions, sessionAttendanceDate, formatTime, formatWorkingHours, formatTimeDifference }) {
    const list = Array.isArray(sessions) ? sessions : [];
    if (list.length === 0) return null;
    const showDateNote =
        sessionAttendanceDate && sessionAttendanceDate !== localIsoDate();
    return (
        <div className="dashboard-punch-sessions">
            <div className="dashboard-punch-sessions-head">
                <h3 className="dashboard-punch-sessions-title">Sessions today</h3>
                {showDateNote && (
                    <span className="dashboard-punch-sessions-date-note">
                        Attendance date: {formatDate(`${sessionAttendanceDate}T12:00:00`)}
                    </span>
                )}
            </div>
            <ul className="dashboard-punch-sessions-list">
                {list.map((s, idx) => {
                    const liveMs = s.is_open
                        ? cappedOpenLiveMs(s.clock_in, s.session_auto_close_at)
                        : 0;
                    const durationLabel = s.is_open
                        ? formatTimeDifference(liveMs)
                        : formatWorkingHours(s.duration_hms || '0:00:00');
                    const rangeOut = s.clock_out ? formatTime(s.clock_out) : '—';
                    return (
                        <li key={s.id ?? idx} className={`dashboard-punch-session-row${s.is_open ? ' is-open' : ''}`}>
                            <div className="dashboard-punch-session-main">
                                <span className="dashboard-punch-session-range">
                                    {formatTime(s.clock_in)} → {rangeOut}
                                </span>
                                <span className="dashboard-punch-session-duration">
                                    {s.is_open ? (
                                        <>
                                            <span className="dashboard-punch-session-live">In progress</span>
                                            <span className="dashboard-punch-session-hms">{durationLabel}</span>
                                        </>
                                    ) : (
                                        durationLabel
                                    )}
                                </span>
                            </div>
                            {s.repeat_reason ? (
                                <p className="dashboard-punch-session-reason">Reason: {s.repeat_reason}</p>
                            ) : null}
                            {s.extended_hours_reason ? (
                                <p className="dashboard-punch-session-reason">Extended hours: {s.extended_hours_reason}</p>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/** Format a date/time for Recent Activity (e.g. "Today", "Yesterday", "2 days ago"). */
const formatTimeAgo = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (d >= todayStart) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(isoString);
};

/** Build list of recent activity items from punch, last leave, last payslip. */
function RecentActivityList({
  punchIn,
  punchOut,
  lastLeave,
  lastPayslip,
  formatTime,
  formatTimeAgo,
  formatDate,
  onNavigate,
  canViewPayslip = true,
}) {
  const items = [];
  if (punchIn) {
    items.push({
      key: "punch-in",
      dot: "green",
      text: `Punch-in at ${formatTime(punchIn)}`,
      time: "Today",
      href: "/attendance",
      ariaLabel: "Open attendance details",
    });
  }
  if (punchOut) {
    items.push({
      key: "punch-out",
      dot: "blue",
      text: `Punch-out at ${formatTime(punchOut)}`,
      time: "Today",
      href: "/attendance",
      ariaLabel: "Open attendance details",
    });
  }
  if (lastLeave) {
    const status = (lastLeave.status || "").toLowerCase();
    const leaveType = (lastLeave.leave_type || "").toLowerCase();
    const isCompOff = leaveType.includes("comp");
    const dot =
      status === "approved"
        ? "green"
        : status === "rejected"
          ? "red"
          : "orange";
    items.push({
      key: `leave-${lastLeave.id}`,
      dot,
      text: `Leave (${lastLeave.leave_type || "Leave"}): ${lastLeave.status || "Pending"}`,
      time:
        formatTimeAgo(lastLeave.created_at) || formatDate(lastLeave.start_date),
      href: isCompOff ? "/leaves/comp-off" : "/leaves",
      ariaLabel: isCompOff ? "Open Comp Off details" : "Open leave details",
      important: status === "pending" || status === "new" || status === "open",
    });
  }
  if (lastPayslip && canViewPayslip) {
    items.push({
      key: `payslip-${lastPayslip.id}`,
      dot: "blue",
      text: `Payslip updated: ${lastPayslip.month || ""} ${lastPayslip.year || ""}`,
      time:
        `${lastPayslip.month || ""} ${lastPayslip.year || ""}`.trim() || "—",
      href: "/payslip",
      ariaLabel: "Open payslip details",
    });
  }
  if (items.length === 0) {
    return (
      <ul className="activity-list">
        <li>
          <div className="left">
            <span className="dot blue"></span> No recent activity
          </div>
          <span className="time">—</span>
        </li>
      </ul>
    );
  }
  return (
    <ul className="activity-list">
      {items.map((item) => {
        const clickable = Boolean(item.href && onNavigate);
        return (
          <li
            key={item.key}
            className={`${clickable ? "activity-list__item--clickable" : ""}${item.important ? " activity-list__item--important" : ""}`.trim()}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? item.ariaLabel : undefined}
            onClick={clickable ? () => onNavigate(item.href) : undefined}
            onKeyDown={clickable ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigate(item.href);
              }
            } : undefined}
          >
            <div className="left">
              <span className={`dot ${item.dot}`}></span>
              <span className="activity-list__text">{item.text}</span>
              {item.important ? (
                <span className="activity-list__badge">Important</span>
              ) : null}
            </div>
            <span className="activity-list__meta">
              <span className="time">{item.time}</span>
              {clickable ? <FiChevronRight className="activity-list__chevron" aria-hidden size={16} /> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export const Dashboard = () => {
    const navigate = useNavigate();
    const { refreshUserData, applyHomepageResult } = useUser();
    const [loading, setLoading] = useState(true);
    const [_error, _setError] = useState(null);
    const [isPunching, setIsPunching] = useState(false);
    const [location, setLocation] = useState({ 
        lat: null, 
        lon: null, 
        error: null,
        isAvailable: false,
        isInRange: false
    });
    const [geo, setGeo] = useState({
        zone: "NO_GPS",
        requiresReason: false,
        distance: null,
        radius: null,
        grace: 100,
        message: ""
    });
    const [dynamicData, setDynamicData] = useState({
        user: {},
        employee: {},
        punch: {},
        leave_balance: { pl: 'N/A', cl: 'N/A' },
        managers: {},
        last_leave: null,
        last_payslip: null,
        probation: null,
    });
    const [punchInDateTime, setPunchInDateTime] = useState(null);
    const [repeatPunchModalOpen, setRepeatPunchModalOpen] = useState(false);
    const [repeatPunchReason, setRepeatPunchReason] = useState("");
    const [geoReasonModalOpen, setGeoReasonModalOpen] = useState(false);
    const [geoReason, setGeoReason] = useState("");
    const [geoReasonMode, setGeoReasonMode] = useState("in"); // "in" | "out"
    const [extendedHoursModalOpen, setExtendedHoursModalOpen] = useState(false);
    const [extendedHoursReason, setExtendedHoursReason] = useState("");
    const [leaveBalanceModalOpen, setLeaveBalanceModalOpen] = useState(false);
    useNativeModalBack(repeatPunchModalOpen, () => setRepeatPunchModalOpen(false));
    useNativeModalBack(extendedHoursModalOpen, () => setExtendedHoursModalOpen(false));
    useNativeModalBack(geoReasonModalOpen, () => setGeoReasonModalOpen(false));
    useNativeModalBack(leaveBalanceModalOpen, () => setLeaveBalanceModalOpen(false));
    const punchDataRef = useRef({
        sessions: [],
        punch_in: null,
        has_open_session: false,
    });
    const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
    const [isRefreshingAll, setIsRefreshingAll] = useState(false);
    const pullStartYRef = useRef(null);
    const pullTriggeredRef = useRef(false);
    const autoCapPunchOutRef = useRef(false);

    const applyHomepagePayload = useCallback((result) => {
        if (!result?.success) return false;
        applyHomepageResult(result);
        const punch = result.punch || {};
        const workingHours = punch.working_hours ? formatWorkingHours(punch.working_hours) : punch.working_hours;
        setDynamicData({
            user: result.user || {},
            employee: result.employee || {},
            punch: {
                ...punch,
                working_hours: workingHours || punch.working_hours,
                has_open_session: punch.has_open_session ?? !!(punch.punch_in && !punch.punch_out),
                requires_repeat_punch_reason: !!punch.requires_repeat_punch_reason,
                sessions: Array.isArray(punch.sessions) ? punch.sessions : [],
                session_attendance_date: punch.session_attendance_date || null,
            },
            leave_balance: result.leave_balance || { pl: 'N/A', cl: 'N/A' },
            managers: result.managers || {},
            last_leave: result.last_leave || null,
            last_payslip: result.last_payslip || null,
            probation: result.probation || null,
        });
        const open = punch.has_open_session ?? !!(punch.punch_in && !punch.punch_out);
        if (open && punch.punch_in) {
            setPunchInDateTime(parsePunchInToDate(punch.punch_in));
        } else {
            setPunchInDateTime(null);
        }
        return true;
    }, [applyHomepageResult]);

    const fetchDashboardData = useCallback(async (showAlert = false, { force = false } = {}) => {
        try {
            const result = await fetchEmployeeHomepage({
                force: force || showAlert,
                maxAgeMs: force || showAlert ? 0 : 45_000,
            });
            if (applyHomepagePayload(result)) {
                return result;
            }
            if (showAlert) {
                alert(result?.message || "Failed to load data.");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            if (showAlert) alert(err.message);
        } finally {
            setLoading(false);
        }
        return null;
    }, [applyHomepagePayload]);

    useEffect(() => {
        punchDataRef.current = {
            sessions: Array.isArray(dynamicData.punch.sessions)
                ? dynamicData.punch.sessions
                : [],
            punch_in: dynamicData.punch.punch_in || null,
            has_open_session:
                dynamicData.punch.has_open_session ??
                !!(dynamicData.punch.punch_in && !dynamicData.punch.punch_out),
        };
    }, [dynamicData.punch]);

    /** Refresh while punched in so server auto punch-out (every 2 min) updates the UI. */
    useEffect(() => {
        const open =
            dynamicData.punch.has_open_session ??
            !!(dynamicData.punch.punch_in && !dynamicData.punch.punch_out);
        if (!open || loading) return undefined;
        const id = setInterval(() => fetchDashboardData(false, { force: true }), 60_000);
        return () => clearInterval(id);
    }, [
        loading,
        dynamicData.punch.has_open_session,
        dynamicData.punch.punch_in,
        dynamicData.punch.punch_out,
        fetchDashboardData,
    ]);

    const runAutoCapPunchOut = useCallback(async (capIso) => {
        if (autoCapPunchOutRef.current) return;
        autoCapPunchOutRef.current = true;
        const token = localStorage.getItem("token");
        if (!token) {
            autoCapPunchOutRef.current = false;
            return;
        }
        setIsPunching(true);
        try {
            const fresh = await fetchFreshPosition();
            const body = { auto_system_punch_out: true };
            if (fresh?.lat != null && fresh?.lon != null) {
                body.lat = fresh.lat;
                body.lon = fresh.lon;
                setLocation((prev) => ({
                    ...prev,
                    lat: fresh.lat,
                    lon: fresh.lon,
                    isAvailable: true,
                }));
            }
            const { ok, result } = await postPunchOutRequest(token, body);
            if (ok && result.success) {
                setPunchInDateTime(null);
                const outLabel = formatTime(result.punch_out || capIso);
                const geoNote =
                    result.location_status_out === "outside_geofence"
                        ? " Location recorded: outside office geofence."
                        : result.location_status_out === "inside_geofence"
                          ? ""
                          : result.location_status_out
                            ? ` Location: ${result.location_status_out}.`
                            : "";
                alert(
                    `10-hour work cap reached. You were punched out automatically at ${outLabel}.${geoNote}`,
                );
                await fetchDashboardData(false);
                return;
            }
            const msg = String(result.message || "");
            if (msg.toLowerCase().includes("no active punch")) {
                await fetchDashboardData(false);
                return;
            }
            autoCapPunchOutRef.current = false;
            console.warn("Auto cap punch-out failed:", msg || "unknown error");
        } catch (err) {
            autoCapPunchOutRef.current = false;
            console.error("Auto cap punch-out error:", err);
        } finally {
            setIsPunching(false);
        }
    }, []);

    /** At 10h cap: punch out with live GPS (before server scheduler uses stale punch-in location). */
    useEffect(() => {
        const open =
            dynamicData.punch.has_open_session ??
            !!(dynamicData.punch.punch_in && !dynamicData.punch.punch_out);
        if (!open || loading) {
            if (!open) autoCapPunchOutRef.current = false;
            return undefined;
        }
        const sessions = Array.isArray(dynamicData.punch.sessions)
            ? dynamicData.punch.sessions
            : [];
        const openSeg = sessions.find((s) => s.is_open);
        const capMs = parseIsoToMs(openSeg?.session_auto_close_at);
        if (!Number.isFinite(capMs)) return undefined;

        const fire = () => {
            if (Date.now() >= capMs) {
                runAutoCapPunchOut(openSeg.session_auto_close_at);
            }
        };

        if (Date.now() >= capMs) {
            fire();
            return undefined;
        }
        const delay = Math.max(0, capMs - Date.now() + 250);
        const timer = setTimeout(fire, delay);
        return () => clearTimeout(timer);
    }, [
        loading,
        dynamicData.punch.has_open_session,
        dynamicData.punch.punch_in,
        dynamicData.punch.punch_out,
        dynamicData.punch.sessions,
        runAutoCapPunchOut,
    ]);

    useRefreshOnNavigate(() => {
        void fetchDashboardData(false);
    });

    useEffect(() => {
        const onSoftRefresh = () => {
            void fetchDashboardData(false, { force: true });
        };
        window.addEventListener(APP_SOFT_REFRESH_EVENT, onSoftRefresh);
        return () => window.removeEventListener(APP_SOFT_REFRESH_EVENT, onSoftRefresh);
    }, [fetchDashboardData]);

  const validateLocationRange = async (lat, lon) => {
    const token = localStorage.getItem("token");
    if (!token)
      return { in_range: false, requires_reason: true, zone: "NO_GPS" };
    try {
      const res = await fetch(
        `${API_BASE_URL}/employee/location-check?lat=${lat}&lon=${lon}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setGeo({
        zone: data.zone || "NO_GPS",
        requiresReason: !!data.requires_reason,
        distance: data.distance_meters ?? null,
        radius: data.radius_meters ?? null,
        grace: data.grace_meters ?? 100,
        message: data.message || "",
      });
      return data;
    } catch {
      setGeo({
        zone: "NO_GPS",
        requiresReason: true,
        distance: null,
        radius: null,
        grace: 100,
        message: "Location check failed",
      });
      return { in_range: false, requires_reason: true, zone: "NO_GPS" };
    }
  };

  const refreshLocation = useCallback(async (showPermissionAlert = false) => {
    setIsRefreshingLocation(true);
    try {
      const coords = await getCurrentCoordinates({ timeout: 12000 });
      const lat = coords?.lat;
      const lon = coords?.lon;
      if (lat == null || lon == null) {
        throw new Error("Location unavailable");
      }
      const locationData = await validateLocationRange(lat, lon);
      const inRange = !!locationData?.in_range;
      const requiresReason = !!locationData?.requires_reason || !inRange;
      const zone = locationData?.zone || "NO_GPS";
      const errorMessage =
        inRange || zone === "NO_OFFICE_CONFIG"
          ? null
          : "You are outside office range. Punch In/Out requires a reason.";
      setLocation({
        lat,
        lon,
        accuracy_m: coords.accuracy_m ?? null,
        device_class: coords.device_class || null,
        error: errorMessage,
        isAvailable: true,
        isInRange: inRange,
      });
      return {
        ok: true,
        lat,
        lon,
        accuracy_m: coords.accuracy_m ?? null,
        device_class: coords.device_class || null,
        inRange,
        requiresReason,
        zone,
      };
    } catch (err) {
      const denied = String(err?.message || "").toLowerCase().includes("permission");
      setLocation((prev) => ({
        ...prev,
        error: denied
          ? "Location permission denied. Enable location to use Punch In/Out."
          : "Location access denied or unavailable. Punch In/Out requires location.",
        isAvailable: false,
        isInRange: false,
      }));
      if (showPermissionAlert) {
        alert(
          denied
            ? "Location permission is required for Punch In/Out. Please allow location and try refresh."
            : "Unable to fetch location. Please enable GPS and try refresh."
        );
      }
      return { ok: false, error: err };
    } finally {
      setIsRefreshingLocation(false);
    }
  }, []);

    useEffect(() => {
        const checkLocation = async () => {
            await refreshLocation(false);
        };
        
        checkLocation();
        const locationInterval = setInterval(checkLocation, 30000);
        
        return () => clearInterval(locationInterval);
    }, [refreshLocation]);

    useEffect(() => {
      if (!isNativeApp()) return undefined;
      let listener;
      const init = async () => {
        listener = await CapacitorApp.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            void refreshLocation(false);
            void fetchDashboardData(false, { force: true });
          }
        });
      };
      void init();
      return () => {
        listener?.remove?.();
      };
    }, [refreshLocation, fetchDashboardData]);

    useEffect(() => {
        let timer;
        // Only start timer if punched in and NOT punched out
        const openSession = dynamicData.punch.has_open_session ?? (!!dynamicData.punch.punch_in && !dynamicData.punch.punch_out);
        if (punchInDateTime && openSession) {
            timer = setInterval(() => {
                const now = Date.now();
                setDynamicData((prev) => {
                    const sessions = Array.isArray(prev.punch.sessions) ? prev.punch.sessions : [];
                    let closedMs = 0;
                    for (const s of sessions) {
                        if (!s.is_open && s.duration_hms) {
                            closedMs += parseHmsToMs(s.duration_hms);
                        }
                    }
                    const openSeg = sessions.find((s) => s.is_open);
                    let liveMs = 0;
                    if (openSeg?.clock_in) {
                        liveMs = cappedOpenLiveMs(
                            openSeg.clock_in,
                            openSeg.session_auto_close_at,
                            now,
                        );
                    }
                    if (liveMs === 0 && sessions.some((s) => s.is_open) && punchInDateTime) {
                        liveMs = Math.max(0, now - punchInDateTime.getTime());
                    }
                    const totalMs =
                        sessions.length > 0
                            ? closedMs + liveMs
                            : Math.max(0, now - punchInDateTime.getTime());
                    const formattedTime = formatTimeDifference(totalMs);
                    return {
                        ...prev,
                        punch: {
                            ...prev.punch,
                            working_hours: formattedTime,
                        },
                    };
                });
            }, 1000);
        } else {
            // Stop timer if punched out
            setDynamicData((prev) => ({
                ...prev,
                punch: {
                    ...prev.punch,
                    working_hours: prev.punch.working_hours || '0h 00m 00s',
                },
            }));
        }
        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [punchInDateTime, dynamicData.punch.punch_out, dynamicData.punch.has_open_session, dynamicData.punch.punch_in]); 
    const handlePunchIn = async (geoReason = "", repeatPunchReasonParam = "", overrideCoords = null) => {
        const lat = overrideCoords?.lat ?? location.lat;
        const lon = overrideCoords?.lon ?? location.lon;
        const canUseLocation = overrideCoords?.ok ?? location.isAvailable;
        if (isPunching || !lat || !lon || !canUseLocation) {
            alert(location.error || "Cannot punch in without location. Please enable location services.");
            return;
        } 
        setIsPunching(true);
        const token = localStorage.getItem('token');
        const repeatTrim = (repeatPunchReasonParam || "").trim();
        const payload = {
            ...coordsToPunchFields(overrideCoords || location),
            lat,
            lon,
            is_wfh: false,
            geo_reason: geoReason || null,
        };
        if (repeatTrim.length >= 3) {
            payload.repeat_punch_reason = repeatTrim;
        }
        try {
            const { ok, result } = await postPunchInRequest(token, payload);
            if (ok && result.success) {
                const punchedAt = result.punch_in || result.clock_in || new Date().toISOString();
                setRepeatPunchModalOpen(false);
                setRepeatPunchReason("");
                setGeoReasonModalOpen(false);
                setGeoReason("");
                setDynamicData((prev) => {
                    const sessions = Array.isArray(prev.punch.sessions) ? [...prev.punch.sessions] : [];
                    const openIdx = sessions.findIndex((s) => s && (s.is_open || !s.clock_out));
                    const openRow = {
                        ...(openIdx >= 0 ? sessions[openIdx] : {}),
                        clock_in: punchedAt,
                        clock_out: null,
                        is_open: true,
                    };
                    if (openIdx >= 0) sessions[openIdx] = openRow;
                    else sessions.push(openRow);
                    return {
                        ...prev,
                        punch: {
                            ...prev.punch,
                            punch_in: punchedAt,
                            punch_out: null,
                            has_open_session: true,
                            sessions,
                        },
                    };
                });
                setPunchInDateTime(parsePunchInToDate(punchedAt));
                alert(`Punched In Successfully at ${formatTime(punchedAt)}!`);
                setIsPunching(false);
                fetchDashboardData(false, { force: true }).catch((e) =>
                    console.warn("Dashboard refresh failed after punch-in:", e)
                );
                return;
            } else {
                // If location is out of range, update state
                if (result.message && result.message.includes("Too far")) {
                    setLocation(prev => ({ ...prev, isInRange: false }));
                }
                const needsGeoReason =
                    !!result.requires_geo_reason
                    || /outside the office geofence/i.test(String(result.message || ""))
                    || /enter a reason/i.test(String(result.message || ""));
                if (needsGeoReason) {
                    setLocation((prev) => ({ ...prev, isInRange: false }));
                    setGeoReasonMode("in");
                    setGeoReasonModalOpen(true);
                } else if (result.requires_repeat_punch_reason) {
                    setRepeatPunchModalOpen(true);
                } else {
                    alert(`Punch In Failed: ${result.message || 'Server error.'}`);
                }
            }
        } catch (error) {
            console.error("Punch In error:", error);
            if (!navigator.onLine) {
                alert("No internet connection. Please check your network and try again.");
            } else {
                alert(
                    error?.message
                        ? `We couldn't complete your request: ${error.message}`
                        : "We couldn't complete your request right now. Please try again."
                );
            }
        } finally {
            setIsPunching(false);
        }
    };
    const handlePunchOut = async (geoReason = "", extendedHoursReasonParam = "", overrideCoords = null) => {
        const lat = overrideCoords?.lat ?? location.lat;
        const lon = overrideCoords?.lon ?? location.lon;
        const canUseLocation = overrideCoords?.ok ?? location.isAvailable;
        if (isPunching || !lat || !lon || !canUseLocation) {
            alert(location.error || "Cannot punch out without location. Please enable location services.");
            return;
        } 
        setIsPunching(true);
        const token = localStorage.getItem('token');
        const extTrim = (extendedHoursReasonParam || "").trim();
        try {
                const payload = {
                    ...coordsToPunchFields(overrideCoords || location),
                    lat,
                    lon,
                    geo_reason: geoReason || null,
                    ...(extTrim.length >= 3 ? { extended_hours_reason: extTrim } : {}),
                };
                const { ok, result } = await postPunchOutRequest(token, payload);
            if (ok && result.success) {
                setPunchInDateTime(null);
                const workHours = formatWorkingHours(result.today_work);
                setDynamicData(prev => ({
                    ...prev,
                    punch: {
                        ...prev.punch,
                        punch_out: result.punch_out, 
                        punch_in: prev.punch.punch_in,
                        working_hours: workHours
                    }
                }));
                setExtendedHoursModalOpen(false);
                setExtendedHoursReason("");
                setGeoReasonModalOpen(false);
                setGeoReason("");
                alert(`Punched Out Successfully! Total Today's Work: ${result.today_work || 'N/A'}`);
                setIsPunching(false);
                fetchDashboardData(false, { force: true }).catch((e) =>
                    console.warn("Dashboard refresh failed after punch-out:", e)
                );
                return;
            } else {
                if (result.message && result.message.includes("Too far")) {
                    setLocation(prev => ({ ...prev, isInRange: false }));
                }
                const needsGeoReason =
                    !!result.requires_geo_reason
                    || /outside the office geofence/i.test(String(result.message || ""))
                    || /enter a reason/i.test(String(result.message || ""));
                if (needsGeoReason) {
                    setLocation((prev) => ({ ...prev, isInRange: false }));
                    setGeoReasonMode("out");
                    setGeoReasonModalOpen(true);
                } else if (result.requires_extended_hours_reason) {
                    setExtendedHoursModalOpen(true);
                } else {
                    alert(`Punch Out Failed: ${result.message || 'Server error.'}`);
                }
            }
        } catch (error) {
            console.error("Punch Out error:", error);
            if (!navigator.onLine) {
                alert("No internet connection. Please check your network and try again.");
            } else {
                alert("We couldn't complete your request right now. Please try again.");
            }
        } finally {
            setIsPunching(false);
        }
    };
    const punchHasOpenSession = () =>
        dynamicData.punch.has_open_session ?? (!!dynamicData.punch.punch_in && !dynamicData.punch.punch_out);

    const onPunchInClick = async () => {
        if (isPunching || punchHasOpenSession()) return;
        const fresh = await refreshLocation(true);
        if (!fresh.ok || !fresh.lat || !fresh.lon) {
            alert(location.error || "Cannot punch in without location. Please enable location services.");
            return;
        }
        if (dynamicData.punch.requires_repeat_punch_reason) {
            setRepeatPunchModalOpen(true);
            return;
        }
        if (fresh.requiresReason || geo.requiresReason || !fresh.inRange) {
            setGeoReasonMode("in");
            setGeoReasonModalOpen(true);
            return;
        }
        await handlePunchIn("", "", fresh);
    };
    const onPunchOutClick = async () => {
        if (isPunching || !punchHasOpenSession()) return;
        const fresh = await refreshLocation(true);
        if (!fresh.ok || !fresh.lat || !fresh.lon) {
            alert(location.error || "Cannot punch out without location. Please enable location services.");
            return;
        }
        if (fresh.requiresReason || geo.requiresReason || !fresh.inRange) {
            setGeoReasonMode("out");
            setGeoReasonModalOpen(true);
            return;
        }
        await handlePunchOut("", "", fresh);
    };

    const handleManualRefresh = useCallback(async () => {
        setIsRefreshingAll(true);
        try {
            await Promise.all([
                refreshLocation(false),
                fetchDashboardData(false, { force: true }),
                refreshUserData({ force: true }),
            ]);
        } finally {
            setIsRefreshingAll(false);
        }
    }, [refreshLocation, fetchDashboardData, refreshUserData]);

    const handleOpenLocationSettings = useCallback(async () => {
      if (!isNativeApp()) {
        alert("Please enable location permission from your browser/site settings.");
        return;
      }
      try {
        await CapacitorApp.openSettings();
      } catch {
        alert("Unable to open settings automatically. Please enable location in app settings.");
      }
    }, []);

    useEffect(() => {
      if (!isNativeApp()) return undefined;
      if (typeof window !== "undefined" && window.__globalPullRefreshEnabled) return undefined;

      const onTouchStart = (event) => {
        if (window.scrollY > 0) {
          pullStartYRef.current = null;
          return;
        }
        pullTriggeredRef.current = false;
        pullStartYRef.current = event.touches?.[0]?.clientY ?? null;
      };

      const onTouchMove = (event) => {
        if (pullTriggeredRef.current || isRefreshingAll) return;
        if (pullStartYRef.current == null) return;
        const currentY = event.touches?.[0]?.clientY;
        if (typeof currentY !== "number") return;
        const delta = currentY - pullStartYRef.current;
        if (delta > 110 && window.scrollY <= 0) {
          pullTriggeredRef.current = true;
          void handleManualRefresh();
        }
      };

      const onTouchEnd = () => {
        pullStartYRef.current = null;
        pullTriggeredRef.current = false;
      };

      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });

      return () => {
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
      };
    }, [handleManualRefresh, isRefreshingAll]);

    const submitRepeatPunchIn = async () => {
        const t = repeatPunchReason.trim();
        if (t.length < 3) {
            alert("Please enter a reason (at least 3 characters).");
            return;
        }
        const geoTrim = geoReason.trim();
        if ((geo.requiresReason || !location.isInRange) && geoTrim.length < 10) {
            setGeoReasonMode("in");
            setGeoReasonModalOpen(true);
            return;
        }
        await handlePunchIn(geoTrim, t);
    };

    const submitGeoReasonPunch = async () => {
        const t = geoReason.trim();
        if (t.length < 10) {
            alert("Please enter a location reason (at least 10 characters).");
            return;
        }
        if (geoReasonMode === "out") {
            await handlePunchOut(t);
            return;
        }
        const repeatTrim = repeatPunchReason.trim();
        if (dynamicData.punch.requires_repeat_punch_reason && repeatTrim.length < 3) {
            setRepeatPunchModalOpen(true);
            return;
        }
        await handlePunchIn(t, repeatTrim);
    };

    const submitExtendedHoursPunchOut = async () => {
        const t = extendedHoursReason.trim();
        if (t.length < 3) {
            alert("Please enter a reason (at least 3 characters).");
            return;
        }
        await handlePunchOut("", t);
    };
    const probation = dynamicData.probation;
    const showProbationCard = probation?.show_on_dashboard;
    const probationCardClass = probation?.status ? `probation-status-card--${probation.status}` : '';
    const dojFormatted = useMemo(() => formatDate(dynamicData.user.doj), [dynamicData.user.doj]);
    const _experience = useMemo(() => calculateExperience(dynamicData.user.doj), [dynamicData.user.doj]);
    const totalLeave = useMemo(() => {
        const pl = Number(dynamicData.leave_balance.pl);
        const cl = Number(dynamicData.leave_balance.cl);
        return (isNaN(pl) || isNaN(cl)) ? 'N/A' : (pl + cl);
    }, [dynamicData.leave_balance]);
    const leaveBreakdown = useMemo(() => {
        const lb = dynamicData.leave_balance || {};
        const remainingPl = Number(lb.pl ?? 0);
        const remainingCl = Number(lb.cl ?? 0);
        const remainingComp = Number(lb.comp ?? 0);
        const totalPl = Number(lb.total_pl ?? 0);
        const totalCl = Number(lb.total_cl ?? 0);
        const usedPl = Number(lb.used_pl ?? 0);
        const usedCl = Number(lb.used_cl ?? 0);
        const usedComp = Number(lb.used_comp ?? 0);
        const compSubtext = remainingComp > 0
            ? `Available now · each valid 30 days`
            : usedComp > 0
                ? `Used ${usedComp} · no active comp-off`
                : 'Earned on Sundays · valid 30 days';
        return [
            {
                key: 'pl',
                label: 'Privilege Leave (PL)',
                remaining: remainingPl,
                subtext: `Total ${totalPl}, Used ${usedPl}`,
                icon: <FiStar size={16} />,
                colorClass: 'blue',
            },
            {
                key: 'cl',
                label: 'Casual Leave (CL)',
                remaining: remainingCl,
                subtext: `Total ${totalCl}, Used ${usedCl}`,
                icon: <FiSun size={16} />,
                colorClass: 'green',
            },
            {
                key: 'comp',
                label: 'Compensatory Leave (Comp Off)',
                remaining: remainingComp,
                subtext: `${compSubtext} · tap for details`,
                icon: <FiRefreshCw size={16} />,
                colorClass: 'orange',
                clickable: true,
                onClick: () => {
                    setLeaveBalanceModalOpen(false);
                    navigate('/leaves/comp-off');
                },
            },
        ];
    }, [dynamicData.leave_balance, navigate]);
    const punchInTimeDisplay = useMemo(() => {
        const sessions = Array.isArray(dynamicData.punch.sessions) ? dynamicData.punch.sessions : [];
        const openSession = sessions.find((s) => s && !s.clock_out);
        const clockIn = openSession?.clock_in || dynamicData.punch.punch_in;
        return formatTime(clockIn);
    }, [dynamicData.punch.punch_in, dynamicData.punch.sessions]);
    const todaysDate = useMemo(() => formatDate(new Date()), []);
    const currentStatus = useMemo(() => {
        const open = dynamicData.punch.has_open_session ?? (!!dynamicData.punch.punch_in && !dynamicData.punch.punch_out);
        return open ? "Active" : "Inactive";
    }, [dynamicData.punch.punch_in, dynamicData.punch.punch_out, dynamicData.punch.has_open_session]);
    const isCheckedIn = punchHasOpenSession();
    const _isCheckedOut = !punchHasOpenSession() && !!(dynamicData.punch.punch_in || dynamicData.punch.punch_out);
    const isActive = isCheckedIn;
    const managerName = [dynamicData.managers?.l2?.name, dynamicData.managers?.l1?.name, dynamicData.managers?.l3?.name]
        .map((n) => (typeof n === "string" ? n.trim() : n))
        .find((n) => n) || "N/A";
    const _managerDept = dynamicData.user?.circle || "N/A"; 
    const userCircle = (dynamicData.user?.circle || '').trim().toUpperCase();
    const showWfhQuickAction = userCircle === "NHQ";
    const myEmpId =
        (dynamicData.user?.emp_id || dynamicData.user?.empId || dynamicData.employee?.emp_id || "").trim();

    useEffect(() => {
        if (!leaveBalanceModalOpen) return undefined;
        const onKeyDown = (e) => {
            if (e.key === "Escape") setLeaveBalanceModalOpen(false);
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [leaveBalanceModalOpen]);

    if (loading) return (
        <div className="full-height-center">
            <h2 className="loader"></h2>
        </div>
    );
    return (
        <>
        <PolicyAckModal />
        <div className="main-layout">
            <div className="content-area">
                <div className="dashboard-content" style={{ paddingTop: 0 }}>
                    <div className="top-cards-grid">
                        <div className="card top-card profile-sheet">
                            <div className="profile-sheet__head">
                                    <div className="card-icon-round orange-bg">
                                    <MdBadge className="icon-white" size={22} />
                                </div>
                                <div className="profile-sheet__identity">
                                    <h3 className="profile-sheet__id">{dynamicData.user.emp_id || 'N/A'}</h3>
                                    <p className="profile-sheet__role">{dynamicData.employee?.emp_type || dynamicData.user?.emp_type || dynamicData.user?.department || 'Employee'}</p>
                                    <p className="profile-sheet__joined">Joined {dojFormatted}</p>
                                </div>
                            </div>
                            <div className="profile-sheet__facts">
                                <div className="profile-sheet__fact">
                                    <FiUserCheck size={16} />
                                    <div>
                                        <span>Reporting Manager</span>
                                        <strong>{managerName}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            className="card top-card simple-card leave-balance-card--clickable"
                            role="button"
                            tabIndex={0}
                            aria-label="View leave balance breakdown"
                            onClick={() => setLeaveBalanceModalOpen(true)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setLeaveBalanceModalOpen(true);
                                }
                            }}
                        >
                            <div className="card-content-wrapper">
                                <h4 className="card-label">Leave Balance</h4>
                                <h3 className="card-value">{totalLeave} Days</h3>
                                <p className="card-subtext">
                                    {dynamicData.leave_balance?.pl ?? '—'} PL + {dynamicData.leave_balance?.cl ?? '—'} CL
                                </p>
                            </div>
                            <div className="card-icon-round sky-bg">
                                <FiSun className="icon-white" size={24} />
                            </div>
                        </div>
                    </div>
                    {showProbationCard && (
                        <div className={`probation-status-card ${probationCardClass}`}>
                            <div className="probation-status-card__content">
                                <p className="probation-status-card__label">Probation</p>
                                <h3 className="probation-status-card__title">{probation.status_label}</h3>
                                <p className="probation-status-card__message">{probation.message}</p>
                                <div className="probation-status-card__meta">
                                    <span>End date: {formatDate(probation.probation_end_date)}</span>
                                    {probation.days_remaining > 0 && (
                                        <span>{probation.days_remaining} day(s) left</span>
                                    )}
                                </div>
                            </div>
                            <div className="probation-status-card__icon">
                                <FiCheckCircle size={28} />
                            </div>
                        </div>
                    )}
                    <div className="main-grid">
                        <div className="dashboard-top-row grid-span-4">
                            <div className="attendance-section">
                            <div className="attendance-corner-meta">
                                <span className={`location-pill ${location.isAvailable && location.isInRange ? 'on' : 'off'}`}>
                                    <span className="location-dot"></span>
                                    {location.isAvailable && location.isInRange ? 'In range' : 'Off'}
                                </span>
                                <div className={`status-badge-main ${isActive ? 'active' : 'inactive'}`}>
                                    <span className={`status-pulse-dot ${isActive ? 'active' : ''}`}></span>
                                    <span className="status-text">{currentStatus}</span>
                                </div>
                                <button
                                    type="button"
                                    className="location-refresh-btn"
                                    onClick={handleManualRefresh}
                                    disabled={isRefreshingAll || isRefreshingLocation || isPunching}
                                    title="Refresh location and dashboard"
                                    aria-label="Refresh location and dashboard"
                                >
                                    <FiRefreshCw
                                        size={15}
                                        className={(isRefreshingAll || isRefreshingLocation) ? "spin" : ""}
                                    />
                                </button>
                            </div>
                            <div className="attendance-header">
                                <div className="attendance-header-left">
                                    <h2 className="section-title">Today's Status</h2>
                                    <span className="attendance-date">{todaysDate}</span>
                                </div>
                            </div>
                            <div className="attendance-body">
                                <div className="attendance-body-primary">
                                    {location.error && (
                                        <div className="location-error-banner" role="alert">
                                            <span className="location-error-banner__text">
                                                <span className="location-error-banner__icon" aria-hidden="true">!</span>
                                                <span className="location-error-banner__msg">{location.error}</span>
                                            </span>
                                            {String(location.error).toLowerCase().includes("permission") && (
                                                <button
                                                    type="button"
                                                    className="location-settings-btn"
                                                    onClick={handleOpenLocationSettings}
                                                >
                                                    Settings
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="status-stats-grid">
                                        <div className="status-stat-card">
                                            <span className="stat-label">Check In</span>
                                            <span className="stat-value">{punchInTimeDisplay || '--:--:--'}</span>
                                        </div>
                                        <div className="status-stat-card highlight">
                                            <span className="stat-label">Hours Today</span>
                                            <span className="stat-value stat-timer">{formatWorkingHours(dynamicData.punch.working_hours)}</span>
                                            <span className="stat-hint">Including all sessions</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {!location.isAvailable && (
                                        <p className="punch-location-hint" role="status">
                                            Turn on Location to punch in.
                                        </p>
                                    )}
                                    <div className="status-action-buttons">
                                        <button
                                            className="btn-punch btn-punch-in"
                                            onClick={onPunchInClick}
                                            disabled={punchHasOpenSession() || isPunching || !location.isAvailable}
                                        >
                                            <FiCheckCircle className="btn-icon" />
                                            {isPunching && !isCheckedIn ? 'Punching In...' : 'Punch In'}
                                        </button>
                                        <button
                                            className="btn-punch btn-punch-out"
                                            onClick={onPunchOutClick}
                                            disabled={!punchHasOpenSession() || isPunching || !location.isAvailable}
                                        >
                                            <FiLogOut className="btn-icon" />
                                            {isPunching && punchHasOpenSession() ? 'Punching Out...' : 'Punch Out'}
                                        </button>
                                    </div>
                                </div>

                                <PunchSessionsList
                                    sessions={dynamicData.punch.sessions}
                                    sessionAttendanceDate={dynamicData.punch.session_attendance_date}
                                    formatTime={formatTime}
                                    formatWorkingHours={formatWorkingHours}
                                    formatTimeDifference={formatTimeDifference}
                                />
                            </div>
                            </div>
                        </div>
                        <div className="quick-actions grid-span-4 actions-grid" >
                            {hasFeature("dashboard_payslip") ? (
                            <NavLink to="/payslip" className="action-card nav-link-card"> 
                                <div className="action-icon-group">
                                    <div className="action-icon orange"><div className="action-icon-inner"><GiReceiveMoney /></div></div>
                                    <div>
                                        <h4>View Payslips</h4>
                                        <p>Download payslip statements</p>
                                    </div>
                                </div>
                                <FiChevronRight className="arrow" />
                            </NavLink>
                            ) : null}
                            {/* Extra My Profile card. Profile is already in the bottom nav. */}
                            {/*
                            <NavLink to="/profile" className="action-card nav-link-card"> 
                                <div className="action-icon-group">
                                    <div className="action-icon sky"><div className="action-icon-inner"><FiUser /></div></div>
                                    <div>
                                        <h4>My Profile</h4>
                                        <p>View and edit your details</p>
                                    </div>
                                </div>
                                <FiChevronRight className="arrow" />
                            </NavLink>
                            */}
                            {showWfhQuickAction ? (
                            <NavLink to="/wfh" className="action-card nav-link-card"> 
                                <div className="action-icon-group">
                                    <div className="action-icon green"><div className="action-icon-inner"><FiHome /></div></div>
                                    <div>
                                        <h4>WFH Request</h4>
                                        <p>Request work from home</p>
                                    </div>
                                </div>
                                <FiChevronRight className="arrow" />
                            </NavLink>
                            ) : null}
                            {/* Extra My Attendance card. Attendance is already in the bottom nav. */}
                            {/*
                            <NavLink to="/attendance" className="action-card nav-link-card"> 
                                <div className="action-icon-group">
                                    <div className="action-icon sky"><div className="action-icon-inner"><FiClock /></div></div>
                                    <div>
                                        <h4>My Attendance</h4>
                                        <p>Check attendance records</p>
                                    </div>
                                </div>
                                <FiChevronRight className="arrow" />
                            </NavLink>
                            */}
                            {hasFeature("dashboard_my_assets") ? (
                            <NavLink
                                to={myEmpId ? `/it/employee/${encodeURIComponent(myEmpId)}` : "#"}
                                className="action-card nav-link-card"
                                onClick={(e) => {
                                    if (!myEmpId) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        alert("Employee ID not found. Please contact IT.");
                                    }
                                }}
                            >
                                <div className="action-icon-group">
                                    <div className="action-icon sky"><div className="action-icon-inner"><FiUserCheck /></div></div>
                                    <div>
                                        <h4>My Assets</h4>
                                        <p>View your assigned assets</p>
                                    </div>
                                </div>
                                <FiChevronRight className="arrow" />
                            </NavLink>
                            ) : null}
                            <NavLink to="/queries" className="action-card nav-link-card">
                                <div className="action-icon-group">
                                    <div className="action-icon sky"><div className="action-icon-inner"><FiMessageSquare /></div></div>
                                    <div>
                                        <h4>Apply Query</h4>
                                        <p>Raise and track your queries</p>
                                    </div>
                                </div>
                                <FiChevronRight className="arrow" />
                            </NavLink>
                               {/* <NavLink to="/account" className="action-card nav-link-card"> 
                                <div className="action-icon-group">
                                    <IoMdPerson className="action-icon sky" />
                                    <div>
                                        <h4>Accounts</h4>
                                        <p>Accounts Details</p>
                                    </div>
                                </div>
                                <FiChevronRight className="arrow" />
                            </NavLink> */}
                        </div>

                    </div>
                </div>
            </div>
        </div>
        {leaveBalanceModalOpen && createPortal(
            <div
                className="dashboard-leave-balance-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="leave-balance-title"
                onClick={() => setLeaveBalanceModalOpen(false)}
            >
                <div className="dashboard-leave-balance-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="dashboard-leave-balance-modal__header">
                        <div>
                            <h3 id="leave-balance-title">Leave Balance</h3>
                            <p className="dashboard-leave-balance-modal__subtitle">
                                {dynamicData.user?.first_name
                                    ? `${dynamicData.user.first_name}'s available leave`
                                    : 'Your available leave'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="dashboard-leave-balance-modal__close"
                            aria-label="Close"
                            onClick={() => setLeaveBalanceModalOpen(false)}
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                    <div className="dashboard-leave-balance-grid">
                        {leaveBreakdown.map((item) => (
                            <div
                                key={item.key}
                                className={`dashboard-leave-balance-item dashboard-leave-balance-item--${item.colorClass}${item.clickable ? ' dashboard-leave-balance-item--clickable' : ''}`}
                                role={item.clickable ? 'button' : undefined}
                                tabIndex={item.clickable ? 0 : undefined}
                                aria-label={item.clickable ? `${item.label} details` : undefined}
                                onClick={item.clickable ? item.onClick : undefined}
                                onKeyDown={item.clickable ? (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        item.onClick?.();
                                    }
                                } : undefined}
                            >
                                <div className="dashboard-leave-balance-item__content">
                                    <span className="dashboard-leave-balance-item__value">
                                        {Number.isFinite(item.remaining) ? item.remaining : 'N/A'}
                                    </span>
                                    <span className="dashboard-leave-balance-item__label">{item.label}</span>
                                    <span className="dashboard-leave-balance-item__subtext">{item.subtext}</span>
                                </div>
                                <div className="dashboard-leave-balance-item__icon">{item.icon}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>,
            document.body,
        )}
        {repeatPunchModalOpen && (
            <div
                className="dashboard-repeat-punch-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="repeat-punch-title"
                onClick={() => !isPunching && setRepeatPunchModalOpen(false)}
            >
                <div className="dashboard-repeat-punch-modal" onClick={(e) => e.stopPropagation()}>
                    <h3 id="repeat-punch-title">Punch in again</h3>
                    <p className="dashboard-repeat-punch-hint">
                        You already completed a session today. Enter a reason for this punch-in (at least 3 characters).
                    </p>
                    <textarea
                        className="dashboard-repeat-punch-textarea"
                        value={repeatPunchReason}
                        onChange={(e) => setRepeatPunchReason(e.target.value)}
                        placeholder="e.g. Returned for night support / client call"
                        rows={4}
                        disabled={isPunching}
                    />
                    <div className="dashboard-repeat-punch-actions">
                        <button
                            type="button"
                            className="dashboard-repeat-punch-btn secondary"
                            disabled={isPunching}
                            onClick={() => {
                                setRepeatPunchModalOpen(false);
                                setRepeatPunchReason("");
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="dashboard-repeat-punch-btn primary"
                            disabled={isPunching}
                            onClick={submitRepeatPunchIn}
                        >
                            {isPunching ? "Submitting…" : "Confirm punch in"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        {geoReasonModalOpen && (
            <div
                className="dashboard-repeat-punch-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="geo-reason-title"
                onClick={() => !isPunching && setGeoReasonModalOpen(false)}
            >
                <div className="dashboard-repeat-punch-modal" onClick={(e) => e.stopPropagation()}>
                    <h3 id="geo-reason-title">
                        {geoReasonMode === "out" ? "Outside office — punch out reason" : "Outside office — punch in reason"}
                    </h3>
                    <p className="dashboard-repeat-punch-hint">
                        Your location is outside the office geofence. Enter a reason (at least 10 characters),
                        or punch from an approved WFH day.
                    </p>
                    <textarea
                        className="dashboard-repeat-punch-textarea"
                        value={geoReason}
                        onChange={(e) => setGeoReason(e.target.value)}
                        placeholder="e.g. Client site visit at ABC Corp / field duty"
                        rows={4}
                        disabled={isPunching}
                    />
                    <div className="dashboard-repeat-punch-actions">
                        <button
                            type="button"
                            className="dashboard-repeat-punch-btn secondary"
                            disabled={isPunching}
                            onClick={() => {
                                setGeoReasonModalOpen(false);
                                setGeoReason("");
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="dashboard-repeat-punch-btn primary"
                            disabled={isPunching}
                            onClick={submitGeoReasonPunch}
                        >
                            {isPunching
                                ? "Submitting…"
                                : geoReasonMode === "out"
                                    ? "Confirm punch out"
                                    : "Confirm punch in"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        {extendedHoursModalOpen && (
            <div
                className="dashboard-repeat-punch-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="extended-hours-punch-title"
                onClick={() => !isPunching && setExtendedHoursModalOpen(false)}
            >
                <div className="dashboard-repeat-punch-modal" onClick={(e) => e.stopPropagation()}>
                    <h3 id="extended-hours-punch-title">Long session — reason required</h3>
                    <p className="dashboard-repeat-punch-hint">
                        Today's total work is over 10 hours (for example, forgot to punch out).
                        Please explain briefly (at least 3 characters) before punching out.
                    </p>
                    <textarea
                        className="dashboard-repeat-punch-textarea"
                        value={extendedHoursReason}
                        onChange={(e) => setExtendedHoursReason(e.target.value)}
                        placeholder="e.g. Forgot to punch out / on-call overnight"
                        rows={4}
                        disabled={isPunching}
                    />
                    <div className="dashboard-repeat-punch-actions">
                        <button
                            type="button"
                            className="dashboard-repeat-punch-btn secondary"
                            disabled={isPunching}
                            onClick={() => {
                                setExtendedHoursModalOpen(false);
                                setExtendedHoursReason("");
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="dashboard-repeat-punch-btn primary"
                            disabled={isPunching}
                            onClick={submitExtendedHoursPunchOut}
                        >
                            {isPunching ? "Submitting…" : "Confirm punch out"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
