import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaChevronLeft } from 'react-icons/fa';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import { useUser } from '../../components/layout/UserContext';

const API_BASE_URL = '/api/leave';

export function ApplyLeavePage() {
    const navigate = useNavigate();
    const { userData, refreshUserData } = useUser();
    const [requests, setRequests] = useState([]);
    const balance = userData.leave_balance || {};
    const leaveBalances = [
        { label: 'Casual Leave', short: 'CL', value: balance.cl },
        { label: 'Privilege Leave', short: 'PL', value: balance.pl },
        { label: 'Compensatory', short: 'Comp', value: balance.comp },
    ];

    const fetchLeaveRequests = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/LeaveDetails`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) return;
            const result = await response.json();
            if (result.success && Array.isArray(result.applications)) {
                setRequests(result.applications.map((app) => ({
                    id: app.id,
                    type: app.leave_type || 'Unknown',
                    from: app.start_date || '',
                    to: app.end_date || '',
                    paidDays: app.deducted_days ?? 0,
                    unpaidDays: app.extra_days ?? 0,
                    reason: app.reason || '',
                    status: app.status || 'Pending',
                })));
            }
        } catch (err) {
            console.error('Error fetching leave requests:', err);
        }
    }, []);

    useEffect(() => {
        fetchLeaveRequests();
        refreshUserData();
    }, [fetchLeaveRequests, refreshUserData]);

    const handleLeaveSubmit = async (requestData) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please login again');
            return false;
        }

        try {
            let backendLeaveType = requestData.leaveType;
            if (requestData.leaveType === 'Casual Leave' && requestData.calculatedDays === 0.5) {
                backendLeaveType = 'Half Day Leave';
            }

            const response = await fetch(`${API_BASE_URL}/apply`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    leave_type: backendLeaveType,
                    start_date: requestData.fromDate,
                    end_date: requestData.toDate,
                    reason: requestData.reason,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                toast.error(result.message || 'Failed to apply leave');
                return false;
            }

            await refreshUserData();
            window.dispatchEvent(new CustomEvent('leaveApplied'));
            toast.success('Leave applied successfully!');
            return true;
        } catch (err) {
            console.error('Error applying leave:', err);
            toast.error('Failed to apply leave. Please try again.');
            return false;
        }
    };

    const formatBalance = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return '—';
        return Number.isInteger(n) ? String(n) : n.toFixed(1);
    };

    return (
        <ApplyLeaveModal
            asPage
            isOpen
            onClose={() => navigate('/leaves')}
            onSubmit={handleLeaveSubmit}
            initialRequests={requests}
            summary={(
                <>
                    <button
                        type="button"
                        className="apply-leave-back"
                        onClick={() => navigate('/leaves')}
                    >
                        <FaChevronLeft aria-hidden="true" />
                        <span>Leaves</span>
                    </button>
                    <div className="apply-leave-balances" aria-label="Leave balance remaining">
                    {leaveBalances.map((item) => (
                        <div key={item.short} className="apply-leave-balance">
                            <p className="apply-leave-balance__value">{formatBalance(item.value)}</p>
                            <p className="apply-leave-balance__label">{item.label}</p>
                        </div>
                    ))}
                </div>
                </>
            )}
        />
    );
}
