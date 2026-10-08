import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiStar, FiRefreshCw, FiPlus, FiChevronDown, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Leaves.css';
import './ApplyLeaveModal.css';
import { useUser } from '../../components/layout/UserContext';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { formatDate } from '../../utils/dateFormat';

const API_BASE_URL = "/api/leave";
const INITIAL_VISIBLE_REQUESTS = 3;
const SHOW_MORE_STEP = 5;

const MONTH_OPTIONS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

const formatLeaveDays = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

const padMonth = (month) => String(month).padStart(2, "0");

const monthBounds = (year, month) => {
    const lastDay = new Date(year, month, 0).getDate();
    return {
        start: `${year}-${padMonth(month)}-01`,
        end: `${year}-${padMonth(month)}-${String(lastDay).padStart(2, "0")}`,
    };
};

const leaveOverlapsRange = (request, rangeStart, rangeEnd) => {
    if (!request?.from || !request?.to) return false;
    return request.from <= rangeEnd && request.to >= rangeStart;
};

const leaveMatchesFilter = (request, filterYear, filterMonth) => {
    if (!filterYear) return true;
    if (filterMonth) {
        const { start, end } = monthBounds(filterYear, filterMonth);
        return leaveOverlapsRange(request, start, end);
    }
    return leaveOverlapsRange(request, `${filterYear}-01-01`, `${filterYear}-12-31`);
};

const LeaveFilterDropdown = ({ options, value, onChange, disabled = false, ariaLabel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selected = options.find((opt) => String(opt.value) === String(value));
    const label = selected?.label ?? options[0]?.label ?? '';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className={`leave-filter-dropdown ${disabled ? 'is-disabled' : ''} ${isOpen ? 'is-open' : ''}`}
            ref={dropdownRef}
        >
            <button
                type="button"
                className="leave-filter-toggle"
                onClick={() => !disabled && setIsOpen((open) => !open)}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-expanded={isOpen}
            >
                <span>{label}</span>
                <FiChevronDown className={`leave-filter-arrow ${isOpen ? 'rotate' : ''}`} />
            </button>
            {isOpen && !disabled && (
                <ul className="leave-filter-menu" role="listbox">
                    {options.map((option) => (
                        <li
                            key={String(option.value)}
                            role="option"
                            aria-selected={String(option.value) === String(value)}
                            className={`leave-filter-item ${String(option.value) === String(value) ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(String(option.value));
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const Leaves= () => {
    const navigate = useNavigate();
    const { userData, refreshUserData } = useUser();
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [filterYear, setFilterYear] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [cancellingId, setCancellingId] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_REQUESTS);

    const isFilterActive = Boolean(filterYear);

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yearsFromData = requests.flatMap((req) => {
            const fromYear = req.from ? Number(req.from.slice(0, 4)) : NaN;
            const toYear = req.to ? Number(req.to.slice(0, 4)) : NaN;
            return [fromYear, toYear].filter((y) => Number.isFinite(y));
        });
        const minYear = yearsFromData.length
            ? Math.min(...yearsFromData, currentYear)
            : currentYear;
        const options = [{ value: "", label: "Recent" }];
        for (let y = currentYear; y >= minYear; y -= 1) {
            options.push({ value: String(y), label: String(y) });
        }
        return options;
    }, [requests]);

    const monthFilterOptions = useMemo(
        () => [
            { value: "", label: "All months" },
            ...MONTH_OPTIONS.map((month) => ({
                value: String(month.value),
                label: month.label,
            })),
        ],
        []
    );

    const filteredRequests = useMemo(() => {
        if (!isFilterActive) return requests;
        return requests.filter((req) => leaveMatchesFilter(req, Number(filterYear), filterMonth ? Number(filterMonth) : null));
    }, [requests, isFilterActive, filterYear, filterMonth]);

    const visibleRequests = useMemo(() => {
        if (!isFilterActive) return requests;
        return filteredRequests;
    }, [requests, isFilterActive, filteredRequests]);

    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE_REQUESTS);
    }, [filterYear, filterMonth]);

    const shownRequests = visibleRequests.slice(0, visibleCount);
    const hasMoreRequests = visibleRequests.length > shownRequests.length;

    const historySummary = useMemo(() => {
        const total = requests.length;
        if (!total) return "";

        if (!isFilterActive) {
            if (visibleCount >= total) {
                return `Showing all ${total} request${total === 1 ? "" : "s"}.`;
            }
            return `Showing ${Math.min(visibleCount, total)} of ${total} requests.`;
        }

        const monthLabel = filterMonth
            ? MONTH_OPTIONS.find((m) => m.value === Number(filterMonth))?.label
            : null;
        const periodLabel = monthLabel
            ? `${monthLabel} ${filterYear}`
            : String(filterYear);

        if (!filteredRequests.length) {
            return `No leave requests in ${periodLabel}.`;
        }
        const shown = Math.min(visibleCount, filteredRequests.length);
        if (shown >= filteredRequests.length) {
            return `Showing ${filteredRequests.length} request${filteredRequests.length === 1 ? "" : "s"} for ${periodLabel} (${total} total).`;
        }
        return `Showing ${shown} of ${filteredRequests.length} requests for ${periodLabel}.`;
    }, [requests.length, isFilterActive, filterYear, filterMonth, filteredRequests.length, visibleCount]);

    const handleFilterYearChange = (value) => {
        setFilterYear(value);
        if (!value) setFilterMonth("");
    };

    const clearHistoryFilters = () => {
        setFilterYear("");
        setFilterMonth("");
    };

    // Dynamic Calculation of Balances based on backend leave_balance
    const stats = useMemo(() => {
        const lb = userData.leave_balance || {};

        // Remaining/Pending balances from backend (what's left to use)
        const remainingPl = Number(lb.pl ?? 0);
        const remainingCl = Number(lb.cl ?? 0);
        const remainingComp = Number(lb.comp ?? 0);

        // Total entitlements from backend (fixed totals - e.g., CL=8, PL=13)
        const totalPl = Number(lb.total_pl ?? 0);
        const totalCl = Number(lb.total_cl ?? 0);
        // Used values from backend (how much has been used from total)
        const usedCasual = Number(lb.used_cl ?? 0);
        const usedPrivilege = Number(lb.used_pl ?? 0);
        const usedComp = Number(lb.used_comp ?? 0);

        const compSubtext = remainingComp > 0
            ? `Available now · each valid 30 days`
            : usedComp > 0
                ? `Used ${usedComp} · no active comp-off`
                : 'Earned on Sundays · valid 30 days';

        return [
            { 
                type: 'Casual Leave', 
                value: remainingCl,  // Big number: Show remaining/pending (e.g., 5)
                subtext: `Total ${totalCl}, Used ${usedCasual}`,  // Subtext: Total entitlement (8) and how much used
                icon: <FiSun size={22} />, 
                colorClass: 'green-card'
            },
            { 
                type: 'Privilege Leave', 
                value: remainingPl,  // Big number: Show remaining/pending (e.g., 11)
                subtext: `Total ${totalPl}, Used ${usedPrivilege}`,  // Subtext: Total entitlement (13) and how much used
                icon: <FiStar size={22} />, 
                colorClass: 'blue-card'
            },
            {
                type: 'Compensatory Leave',
                value: remainingComp,
                subtext: `${compSubtext} · tap for details`,
                icon: <FiRefreshCw size={22} />,
                colorClass: 'orange-card',
                clickable: true,
                onClick: () => navigate('/leaves/comp-off'),
            }
        ];
    }, [userData.leave_balance, navigate]);

    // Fetch leave requests from backend
    const fetchLeaveRequests = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoadingRequests(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/LeaveDetails`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", errorText);
                throw new Error(`Failed to fetch leave requests: ${response.status}`);
            }

            const result = await response.json();
            console.log("Leave Details API Response:", result); // Debug log

            if (result.success) {
                if (result.applications && Array.isArray(result.applications)) {
                    // Transform backend format to frontend format
                    const formattedRequests = result.applications.map(app => ({
                        id: app.id,
                        type: app.leave_type || 'Unknown',
                        from: app.start_date || '',
                        to: app.end_date || '',
                        paidDays: app.deducted_days ?? 0,
                        unpaidDays: app.extra_days ?? 0,
                        reason: app.reason || '',
                        status: app.status || 'Pending'
                    }));
                    console.log("Formatted Requests:", formattedRequests); // Debug log
                    setRequests(formattedRequests);
                } else {
                    console.warn("No applications array in response:", result);
                    setRequests([]);
                }
            } else {
                console.error("API returned success=false:", result.message);
                setRequests([]);
            }
        } catch (err) {
            console.error("Error fetching leave requests:", err);
            setRequests([]);
        } finally {
            setLoadingRequests(false);
        }
    };

    useRefreshOnNavigate(() => {
        fetchLeaveRequests();
        refreshUserData();
    });

    useEffect(() => {
        const onLeaveDataChanged = () => {
            fetchLeaveRequests();
            refreshUserData();
        };
        window.addEventListener('leaveApplied', onLeaveDataChanged);
        window.addEventListener('leaveDataUpdated', onLeaveDataChanged);
        return () => {
            window.removeEventListener('leaveApplied', onLeaveDataChanged);
            window.removeEventListener('leaveDataUpdated', onLeaveDataChanged);
        };
    }, [refreshUserData]);

    useEffect(() => {
        const onFocus = () => refreshUserData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [refreshUserData]);

    const handleCancelLeave = async (request) => {
        if (!request?.id || request.status !== "Pending") return;
        setCancelTarget(request);
    };

    const confirmCancelLeave = async () => {
        const request = cancelTarget;
        if (!request?.id) return;

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please log in again");
            setCancelTarget(null);
            return;
        }

        setCancellingId(request.id);
        try {
            const response = await fetch(`${API_BASE_URL}/requests/${request.id}/cancel`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                toast.error(result.message || "Failed to cancel leave request");
                return;
            }
            setCancelTarget(null);
            await fetchLeaveRequests();
            await refreshUserData();
            window.dispatchEvent(new CustomEvent("leaveDataUpdated"));
            toast.success("Leave request cancelled.");
        } catch (err) {
            console.error("Error cancelling leave:", err);
            toast.error("Failed to cancel leave request. Please try again.");
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="leave-dashboard-container">
            {/* <h1 className="page-title-leave">Leave Management</h1> */}

            <div className="summary-cards-grid-leave">
                <div className="leave-balance-sheet">
                    {stats.filter((item) => !item.clickable).map((item) => (
                        <div key={item.type} className={`leave-balance-sheet__item ${item.colorClass}`}>
                            <p className="summary-value-leave">{item.value}</p>
                            <p className="summary-label-leave">{item.type}</p>
                            <p className="summary-subtext-leave">{item.subtext}</p>
                        </div>
                    ))}
                </div>
                {stats.filter((item) => item.clickable).map((item) => (
                    <div
                        key={item.type}
                        className={`summary-card-leave ${item.colorClass} summary-card-leave--clickable`}
                        role="button"
                        tabIndex={0}
                        onClick={item.onClick}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                item.onClick?.();
                            }
                        }}
                        aria-label={`${item.type} details`}
                    >
                        <div className="summary-content-leave">
                            <p className="summary-value-leave">{item.value}</p>
                            <p className="summary-label-leave">{item.type}</p>
                            <p className="summary-subtext-leave">{item.subtext}</p>
                        </div>
                        <div className="summary-icon-leave">{item.icon}</div>
                    </div>
                ))}
            </div>

            <div className="leave-requests-card">
                <div className="requests-header-row">
                    <h2 className="section-title-leave">Leave Requests</h2>
                    <div className="requests-header-actions">
                        <div className="leave-history-filters" aria-label="Filter leave history">
                            <LeaveFilterDropdown
                                options={yearOptions}
                                value={filterYear}
                                onChange={handleFilterYearChange}
                                ariaLabel="Filter by year"
                            />
                            <LeaveFilterDropdown
                                options={monthFilterOptions}
                                value={filterMonth}
                                onChange={setFilterMonth}
                                disabled={!filterYear}
                                ariaLabel="Filter by month"
                            />
                            {isFilterActive && (
                                <button
                                    type="button"
                                    className="leave-history-filter-clear"
                                    onClick={clearHistoryFilters}
                                    aria-label="Clear filters"
                                    title="Clear filters"
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>
                        <button className="apply-leave-button" onClick={() => navigate('/leaves/apply')}>
                            <FiPlus /> Apply Leave
                        </button>
                    </div>
                </div>
                {!loadingRequests && historySummary && (
                    <p className="leave-history-summary">{historySummary}</p>
                )}
                <div className="leave-table-container">
                    {loadingRequests ? (
                        <p className="leave-history-summary">Loading leave requests...</p>
                    ) : requests.length === 0 ? (
                        <p className="leave-history-summary">
                            No leave requests found. Click "Apply Leave" to submit a new request.
                        </p>
                    ) : visibleRequests.length === 0 ? (
                        <p className="leave-history-summary">
                            No leave requests match the selected period.
                        </p>
                    ) : (
                        <>
                        <table className="leave-requests-table">
                            <thead>
                                <tr>
                                    <th>TYPE</th>
                                    <th>FROM</th>
                                    <th>TO</th>
                                    <th>PAID DAYS</th>
                                    <th>UNPAID LEAVE DAYS</th>
                                    <th>REASON</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shownRequests.map((request) => (
                                    <tr key={request.id} className={`leave-request-card leave-request-card--${String(request.status || "").toLowerCase()}`}>
                                        <td className="leave-card-type" data-label="Type">{request.type}</td>
                                        <td className="leave-card-status" data-label="Status">
                                            <span className={`status-badge status-${request.status.toLowerCase()}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td data-label="From">{formatDate(request.from)}</td>
                                        <td data-label="To">{formatDate(request.to)}</td>
                                        <td data-label="Paid days" className="days-col paid-days-col">{formatLeaveDays(request.paidDays)}</td>
                                        <td data-label="Unpaid days" className="days-col unpaid-days-col">{formatLeaveDays(request.unpaidDays)}</td>
                                        <td data-label="Reason" className="reason-col leave-card-reason" title={request.reason}>
                                            <span>{request.reason || "—"}</span>
                                        </td>
                                        <td data-label="Action" className={`leave-actions-col leave-card-action${request.status === "Pending" ? "" : " leave-card-action--empty"}`}>
                                            {request.status === "Pending" ? (
                                                <button
                                                    type="button"
                                                    className="leave-cancel-btn"
                                                    onClick={() => handleCancelLeave(request)}
                                                    disabled={cancellingId === request.id}
                                                >
                                                    {cancellingId === request.id ? "Cancelling..." : "Cancel"}
                                                </button>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {hasMoreRequests && (
                            <button
                                type="button"
                                className="leave-show-more"
                                onClick={() => setVisibleCount((count) => count + SHOW_MORE_STEP)}
                            >
                                Show more
                            </button>
                        )}
                        </>
                    )}
                </div>
            </div>

            {cancelTarget
                ? createPortal(
                    <div
                        className="modal-overlay apply-leave-modal-overlay leave-confirm-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="leave-cancel-title"
                    >
                        <div className="modal-content apply-leave-modal leave-confirm-modal">
                            <div className="modal-header">
                                <h2 id="leave-cancel-title" className="modal-title">Cancel leave request?</h2>
                                <button
                                    type="button"
                                    className="modal-close-button"
                                    onClick={() => setCancelTarget(null)}
                                    aria-label="Close"
                                    disabled={cancellingId === cancelTarget.id}
                                >
                                    ×
                                </button>
                            </div>
                            <p className="modal-subtext leave-confirm-text">
                                Cancel this pending <strong>{cancelTarget.type || "leave"}</strong>?
                                This cannot be undone.
                            </p>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="button button-cancel"
                                    onClick={() => setCancelTarget(null)}
                                    disabled={cancellingId === cancelTarget.id}
                                >
                                    Keep request
                                </button>
                                <button
                                    type="button"
                                    className="button button-submit leave-confirm-danger"
                                    onClick={confirmCancelLeave}
                                    disabled={cancellingId === cancelTarget.id}
                                >
                                    {cancellingId === cancelTarget.id ? "Cancelling…" : "Yes, cancel"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
};