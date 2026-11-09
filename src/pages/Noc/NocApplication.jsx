import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../components/layout/UserContext';
import './NocApplication.css';

const API_URL = '/api/leave/noc-applications';

const REQUEST_TYPES = [
    { value: 'exit_no_dues', label: 'No dues clearance (Exit)' },
    { value: 'banking_bonafide', label: 'Bonafide letter for banking purpose' },
    { value: 'travel_bonafide', label: 'Bonafide letter for visa (personal holiday)' },
    { value: 'other', label: 'Other reason' },
];

const DEPARTMENTS = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'INVENTORY', label: 'Inventory' },
    { value: 'IT', label: 'IT' },
    { value: 'ACCOUNTS', label: 'Accounts' },
    { value: 'HR', label: 'Human Resource' },
];

function authHeaders(json = false) {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
}

function formatAppliedDate(value) {
    if (!value) return '—';
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function NocApplication() {
    const { userData } = useUser();
    const user = userData?.user || {};
    const [employee, setEmployee] = useState({
        name: user.name || user.first_name || '',
        email: user.email || '',
        employee_id: user.emp_id || '',
        circle: user.circle || '',
    });
    const [appliedOn, setAppliedOn] = useState(new Date().toISOString().slice(0, 10));
    const [separation, setSeparation] = useState(null);
    const [requests, setRequests] = useState([]);
    const [visibleCount, setVisibleCount] = useState(3);
    const [openStatus, setOpenStatus] = useState({});
    const [requestType, setRequestType] = useState('');
    const [departments, setDepartments] = useState([]);
    const [otherReason, setOtherReason] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(API_URL, { headers: authHeaders() });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to load your request details.');
            }
            setEmployee((prev) => ({ ...prev, ...(data.employee || {}) }));
            setAppliedOn(data.today || new Date().toISOString().slice(0, 10));
            setSeparation(data.separation || null);
            setRequests(Array.isArray(data.requests) ? data.requests : []);
            setVisibleCount(3);
        } catch (err) {
            setError(err.message || 'Unable to load your details.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const isExit = requestType === 'exit_no_dues';
    const canSubmit = Boolean(
        requestType
        && details.trim()
        && (!isExit || (separation && departments.length > 0))
        && (requestType !== 'other' || otherReason.trim())
    );

    const toggleDepartment = (value, checked) => {
        setDepartments((prev) => (checked ? [...prev, value] : prev.filter((item) => item !== value)));
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify({
                    request_type: requestType,
                    other_reason: otherReason,
                    details,
                    department_keys: departments,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to submit your request.');
            }
            setSuccess(data.message || 'Your request was submitted to Human Resources.');
            setRequestType('');
            setDepartments([]);
            setOtherReason('');
            setDetails('');
            await load();
        } catch (err) {
            setError(err.message || 'Unable to submit your request.');
        } finally {
            setSubmitting(false);
        }
    };

    const downloadFile = async (url, filename, key) => {
        if (!url || downloading) return;
        setDownloading(key);
        setError('');
        try {
            const response = await fetch(url, { headers: authHeaders() });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Unable to download the requested NOC file.');
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename || 'noc-clearance';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch (err) {
            setError(err.message || 'Unable to download the requested NOC file.');
        } finally {
            setDownloading(null);
        }
    };

    const history = [...requests].sort((a, b) => {
        const diff = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        return (Number.isNaN(diff) ? 0 : diff) || Number(b.id || 0) - Number(a.id || 0);
    });

    if (loading) {
        return (
            <main className="noc-application">
                <div className="noc-application__loading">Loading your details…</div>
            </main>
        );
    }

    return (
        <main className="noc-application">
            <div className="noc-application__shell">
                {error ? <div className="noc-application__alert noc-application__alert--error" role="alert">{error}</div> : null}
                {success ? <div className="noc-application__alert noc-application__alert--success" role="status">{success}</div> : null}

                <section className="noc-application__card" aria-labelledby="noc-employee-details">
                    <div className="noc-application__card-head">
                        <h2 id="noc-employee-details"><span className="noc-application__step">01</span>Your details</h2>
                        <p>Applied on {formatAppliedDate(appliedOn)}</p>
                    </div>
                    <div className="noc-application__details-grid">
                        <div className="noc-application__detail"><span>Employee name</span><strong>{employee.name || '—'}</strong></div>
                        <div className="noc-application__detail"><span>Email</span><strong>{employee.email || '—'}</strong></div>
                        <div className="noc-application__detail"><span>Employee ID</span><strong>{employee.employee_id || '—'}</strong></div>
                        <div className="noc-application__detail"><span>Circle</span><strong>{employee.circle || '—'}</strong></div>
                    </div>
                    <div className={`noc-application__separation${separation ? '' : ' is-empty'}`}>
                        <div>
                            <span>Separation request</span>
                            <strong>{separation ? `${separation.status} · ${formatAppliedDate(separation.date)}` : 'No active separation request'}</strong>
                        </div>
                        {separation?.reason ? <p>{separation.reason}</p> : null}
                    </div>
                </section>

                <form className="noc-application__card noc-application__form" onSubmit={submit}>
                    <div className="noc-application__card-head">
                        <h2><span className="noc-application__step">02</span>Request details</h2>
                        <p>Request an exit clearance or a bonafide letter from Human Resources.</p>
                    </div>
                    <label className="noc-application__field">
                        <span className="noc-application__field-label"><span>*</span> Select NOC or letter Required</span>
                        <select
                            value={requestType}
                            required
                            onChange={(event) => {
                                setRequestType(event.target.value);
                                setDepartments([]);
                                setError('');
                            }}
                        >
                            <option value="">Select</option>
                            {REQUEST_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </label>

                    {isExit && separation ? (
                        <fieldset className="noc-application__departments">
                            <legend>Departments requiring no-dues clearance <span>*</span></legend>
                            <p>Select every department that needs to provide a clearance.</p>
                            <div className="noc-application__department-options">
                                {DEPARTMENTS.map(({ value, label }) => (
                                    <label key={value} className="noc-application__department-option">
                                        <input
                                            type="checkbox"
                                            checked={departments.includes(value)}
                                            onChange={(event) => toggleDepartment(value, event.target.checked)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="noc-application__flow" aria-label="Approval flow">
                                <p>Approval flow</p>
                                <ol>
                                    {DEPARTMENTS.map(({ value, label }, index) => (
                                        <li key={value} className={departments.includes(value) ? 'is-selected' : undefined}>
                                            {index > 0 ? <span aria-hidden="true">→</span> : null}
                                            <span>{label}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </fieldset>
                    ) : null}

                    {isExit && !separation ? (
                        <div className="noc-application__alert noc-application__alert--warning" role="alert">
                            Apply for separation first. No-dues clearance for exit is available after your separation request is submitted.
                            <Link to="/separation">Go to Separation</Link>
                        </div>
                    ) : null}

                    {requestType === 'other' ? (
                        <label className="noc-application__field">
                            Reason for request <span>*</span>
                            <input
                                maxLength={255}
                                value={otherReason}
                                required
                                placeholder="Enter the reason for your request"
                                onChange={(event) => setOtherReason(event.target.value)}
                            />
                        </label>
                    ) : null}

                    {requestType ? (
                        <label className="noc-application__field">
                            Additional details <span>*</span>
                            <textarea
                                rows={5}
                                maxLength={5000}
                                required
                                value={details}
                                placeholder="Add the information HR needs to process your request"
                                onChange={(event) => setDetails(event.target.value)}
                            />
                            <small>{details.length}/5000</small>
                        </label>
                    ) : null}

                    <div className="noc-application__actions">
                        <p>{isExit ? 'Each selected department will receive a review task and email.' : 'Your request will be sent to Human Resources for review.'}</p>
                        <button className="noc-application__submit" type="submit" disabled={!canSubmit || submitting}>
                            {submitting ? 'Submitting…' : 'Submit request'}
                        </button>
                    </div>
                </form>

                {history.length > 0 ? (
                    <section className="noc-application__card">
                        <div className="noc-application__card-head">
                            <h2><span className="noc-application__step">03</span>Your NOC requests</h2>
                        </div>
                        <div className="noc-application__history">
                            {history.slice(0, visibleCount).map((item) => {
                                const uploaded = (item.department_requests || []).filter((row) =>
                                    ['uploaded', 'approved', 'cleared', 'completed'].includes(String(row.status || '').toLowerCase())
                                ).length;
                                return (
                                    <article key={item.id}>
                                        <div>
                                            <strong>{item.request_label}</strong>
                                            <span>{formatAppliedDate(item.created_at)}</span>
                                        </div>
                                        {item.other_reason ? <p>Reason: {item.other_reason}</p> : null}
                                        {item.department_labels?.length > 0 ? <p>Departments: {item.department_labels.join(', ')}</p> : null}
                                        <p>{item.details}</p>
                                        {item.hr_remarks ? <p><strong>HR remarks:</strong> {item.hr_remarks}</p> : null}
                                        {item.hr_document ? (
                                            <div className="noc-application__request-file">
                                                <span>HR uploaded · {item.hr_document.filename}</span>
                                                <button
                                                    type="button"
                                                    disabled={Boolean(downloading)}
                                                    onClick={() => downloadFile(item.hr_document.download_url, item.hr_document.filename, `${item.id}-hr-document`)}
                                                >
                                                    {downloading === `${item.id}-hr-document` ? 'Downloading…' : 'Download file'}
                                                </button>
                                            </div>
                                        ) : null}
                                        {item.department_requests?.length > 0 ? (
                                            <button
                                                type="button"
                                                className="noc-application__view-status"
                                                aria-expanded={Boolean(openStatus[item.id])}
                                                onClick={() => setOpenStatus((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                                            >
                                                {openStatus[item.id] ? 'Hide status' : 'View status'}
                                                <span>{uploaded}/{item.department_requests.length} uploaded</span>
                                            </button>
                                        ) : null}
                                        {openStatus[item.id] ? (
                                            <ul className="noc-application__status-list">
                                                {item.department_requests.map((row) => (
                                                    <li key={row.department_key || row.department_label}>
                                                        <span>{row.department_label}</span>
                                                        <strong>{row.status}</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                        {history.length > visibleCount ? (
                            <button type="button" className="noc-application__more" onClick={() => setVisibleCount((count) => count + 3)}>
                                Show more
                            </button>
                        ) : null}
                    </section>
                ) : null}
            </div>
        </main>
    );
}
