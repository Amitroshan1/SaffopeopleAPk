import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { toast } from "react-toastify";
import {
    hasFeature,
    isAdminUser,
    isHrUser,
    canAccessHrPanel,
} from "../../utils/planFeatures";
import { AdminReturnBar } from "./AdminReturnBar";
import { crumbsForAdminPath } from "./AdminBreadcrumb";
import { isAdminDepartmentPath } from "../../pages/Admin/AdminLayout";
import { Headers } from "../../pages/Headers"; // Adjust path as needed
import { useUser } from "./UserContext"; // Import the hook
import { AppFooter } from "./AppFooter";
import { BottomNav } from "./BottomNav";
import { useFloatingNotifications } from "../../hooks/useFloatingNotifications";
import { isNativeApp } from "../../mobile/native/platform";
import { cacheBustPhotoUrl, normalizePhotoUrl } from "../../utils/userPhoto";
import { dispatchAppSoftRefresh } from "../../utils/homepageApi";
import { shouldRefreshUserOnNavigate } from "../../utils/appRefreshPolicy";
// import "../../pages/style/Dashboard.css"
import "../../pages/Dashboard/Dashboard.css"
import "./AppLayoutPullRefresh.css";

export const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData, loadingUser, photoVersion, refreshUserData } = useUser();
    const prevPathRef = useRef(null);
    const pullStartYRef = useRef(null);
    const pullTriggeredRef = useRef(false);
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
    const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    useFloatingNotifications(hasToken && !loadingUser);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        window.__globalPullRefreshEnabled = true;
        return () => {
            window.__globalPullRefreshEnabled = false;
        };
    }, []);

    const handleGlobalSoftRefresh = useCallback(async () => {
        if (isGlobalRefreshing) return;
        setIsGlobalRefreshing(true);
        setPullDistance(0);
        try {
            await refreshUserData({ force: true });
            dispatchAppSoftRefresh();
        } catch {
            toast.error("Unable to refresh right now", { autoClose: 2500 });
        } finally {
            setIsGlobalRefreshing(false);
        }
    }, [isGlobalRefreshing, refreshUserData]);

    useEffect(() => {
        if (!isNativeApp() || !hasToken) return undefined;

        const path = location.pathname || "";
        if (path.startsWith("/assessment")) return undefined;

        const pageScrollTop = () => {
            const scroller = document.querySelector(".app-layout > .content-area");
            return scroller ? scroller.scrollTop : window.scrollY;
        };

        const onTouchStart = (event) => {
            if (pageScrollTop() > 0 || isGlobalRefreshing) {
                pullStartYRef.current = null;
                return;
            }
            pullTriggeredRef.current = false;
            setPullDistance(0);
            pullStartYRef.current = event.touches?.[0]?.clientY ?? null;
        };

        const onTouchMove = (event) => {
            if (isGlobalRefreshing || pullTriggeredRef.current) return;
            if (pullStartYRef.current == null || pageScrollTop() > 0) return;
            const currentY = event.touches?.[0]?.clientY;
            if (typeof currentY !== "number") return;

            const delta = currentY - pullStartYRef.current;
            if (delta <= 0) {
                setPullDistance(0);
                return;
            }

            const capped = Math.min(120, Math.max(0, delta));
            setPullDistance(capped);

            if (delta >= 110) {
                pullTriggeredRef.current = true;
                void handleGlobalSoftRefresh();
            }
        };

        const onTouchEnd = () => {
            pullStartYRef.current = null;
            pullTriggeredRef.current = false;
            if (!isGlobalRefreshing) {
                setPullDistance(0);
            }
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
    }, [handleGlobalSoftRefresh, hasToken, isGlobalRefreshing, location.pathname]);

    /* Refresh leave/punch-sensitive pages at most every 2 minutes on navigation. */
    useEffect(() => {
        if (!hasToken) return;
        const path = location.pathname || "";
        const search = location.search || "";
        const routeKey = `${path}${search}`;
        if (prevPathRef.current !== null && prevPathRef.current !== routeKey) {
            if (shouldRefreshUserOnNavigate(path)) {
                refreshUserData({ force: false });
            }
        }
        prevPathRef.current = routeKey;
    }, [location.pathname, location.search, refreshUserData, hasToken]);

    useEffect(() => {
        const path = location.pathname || "";
        const user = userData?.user;
        const isAdminAreaPath = (
            path === "/admin"
            || path.startsWith("/admin/")
            || path === "/employees"
            || path.startsWith("/employees/")
            || path.startsWith("/employee/")
        );

        const isEmployeeAssetsPath = path.startsWith("/it/employee/");
        if (
            !isEmployeeAssetsPath
            && (isAdminAreaPath || path === "/hr" || path.startsWith("/hr/") || path === "/updates" || path.startsWith("/account") || path.startsWith("/it"))
        ) {
            navigate("/dashboard", { replace: true });
            return;
        }

        const isHrAreaPath = (
            path.startsWith("/archive-employees")
            || path.startsWith("/exit-employees")
        );
        if (isHrAreaPath && !canAccessHrPanel(user)) {
            navigate("/dashboard", { replace: true });
            return;
        }

        if (path.startsWith("/manager")) {
            const roleKey = String(user?.emp_type || user?.department || "")
                .trim()
                .toLowerCase()
                .replace(/-/g, " ");
            const hasManagerAccess =
                userData?.user?.has_manager_access === true
                || ["manager", "managers"].includes(roleKey);
            if (!hasManagerAccess) {
                navigate("/dashboard", { replace: true });
                return;
            }
        }

        if (
            (path === "/payslip"
                || path === "/tax-declaration"
                || path.startsWith("/tax-declaration/"))
            && !hasFeature("dashboard_payslip")
        ) {
            navigate("/dashboard", { replace: true });
        }
        if (path === "/claims" && !hasFeature("dashboard_claims")) {
            navigate("/dashboard", { replace: true });
        }
    }, [location.pathname, navigate, userData?.user]);

    /* No token: redirect to login immediately (direct URL, Back after logout) – no dashboard or loading state */
    useEffect(() => {
        if (!hasToken) {
            navigate("/", { replace: true });
        }
    }, [hasToken, navigate]);

    /* After login: if user presses Back and lands on login, performance, holiday, etc., send them to dashboard */
    useEffect(() => {
        const handlePopState = () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            const path = window.location.pathname || "";
            const disallowedBackTargets = ["/", "", "/select_role", "/performance", "/holiday-calendar"];
            if (disallowedBackTargets.includes(path)) {
                navigate("/dashboard", { replace: true });
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [navigate]);

    // Safely get the username and emp_type from admins table data
    // Backend returns: user.name (display name: first_name / user_name / email prefix) and user.emp_type
    const username = userData.user?.name || userData.user?.first_name || userData.user?.user_name
        || (userData.user?.email ? userData.user.email.split("@")[0] : null) || "User";
    // Get emp_type from admins table (from backend /employee/homepage response)
    const empType = userData.user?.emp_type || userData.user?.department || "Employee";
    
    // Cache-bust profile picture URL when photo_url or photoVersion changes (photoVersion bumps on profile upload)
    const profilePicWithCache = useMemo(() => {
        const rawPhoto =
            userData.employee?.photo_url
            || userData.user?.photo_url
            || userData.employee?.photo
            || userData.user?.photo
            || '';
        const url = normalizePhotoUrl(rawPhoto);
        return url ? cacheBustPhotoUrl(url, photoVersion) : null;
    }, [userData.employee?.photo_url, userData.employee?.photo, userData.user?.photo_url, userData.user?.photo, photoVersion]);

    /** Merge employee profile fields used by Headers for panel routing (emp_type alone may be "Super Admin"). */
    const headerUser = useMemo(
        () => ({
            ...userData.user,
            designation: userData.user?.designation ?? userData.employee?.designation ?? null,
        }),
        [userData.user, userData.employee]
    );

    /* Don't show any protected UI or loading when not authenticated */
    if (!hasToken) {
        return null;
    }

    if (loadingUser) {
        return (
           <div className="full-height-center">
            <h2 className="loader"></h2>
        </div>
        );
    }
    
    // Debug logging
    console.log("AppLayout Debug:", {
        userData: userData.user,
        username: username,
        empType: empType
    });
    const pathLower = (location.pathname || "").toLowerCase();
    const isInventoryPage = pathLower.startsWith("/it/inventory");
    const isAdminShell = pathLower.startsWith("/admin");
    const isAdminHubHome = pathLower === "/admin" || pathLower === "/admin/";
    const adminDeptVisit =
        typeof sessionStorage !== "undefined"
        && sessionStorage.getItem("adminDeptVisit") === "1";
    const hasCrumb = Boolean(crumbsForAdminPath(location.pathname));
    // Department workspaces (when entered from Admin) + Admin Management subpages
    const showAdminReturnBar =
        isAdminUser(headerUser)
        && hasCrumb
        && (
            (adminDeptVisit && !isAdminShell && isAdminDepartmentPath(location.pathname))
            || (isAdminShell && !isAdminHubHome)
        );

    return (
        <div className="main-layout app-layout">
            {/* The Header now gets the username and full user object from the centralized context */}
            <Headers username={username} role={empType} user={headerUser} hasManagerAccess={userData.user?.has_manager_access} profilePic={profilePicWithCache} /> 
            {(isGlobalRefreshing || pullDistance > 0) && (
                <div className={`global-pull-refresh${isGlobalRefreshing ? " is-active" : ""}`}>
                    <div className="global-pull-refresh__chip">
                        <RefreshCcw
                            size={14}
                            className={`global-pull-refresh__icon${isGlobalRefreshing ? " spin" : ""}`}
                        />
                        <span>
                            {isGlobalRefreshing ? "Refreshing..." : "Pull to refresh"}
                        </span>
                    </div>
                    <div
                        className="global-pull-refresh__progress"
                        style={{ width: `${Math.min(100, Math.round((pullDistance / 110) * 100))}%` }}
                    />
                </div>
            )}
            
            <div className={`content-area${isInventoryPage ? " content-area--inventory" : ""}${isInventoryPage && showAdminReturnBar ? " content-area--inventory-admin" : ""}`}>
                <AdminReturnBar visible={showAdminReturnBar} />
                {/* Outlet renders the child routes: Dashboard, Attendance, etc. */}
                <Outlet />
                <AppFooter />
            </div>
            <BottomNav />
        </div>
    );
};