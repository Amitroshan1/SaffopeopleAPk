import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiChevronDown } from 'react-icons/fi';
import dayjs from 'dayjs';
import './ApplyLeaveModal.css';

const REG_LEAVE_TYPES = ['Privilege Leave', 'Casual Leave', 'Half Day Leave', 'Compensatory Leave'];

const CustomDropdown = ({ options, currentValue, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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
            className="modal-custom-dropdown"
            onClick={() => setIsOpen(!isOpen)}
            ref={dropdownRef}
        >
            <div className="dropdown-toggle-modal">
                {currentValue || label}
                <FiChevronDown className={`dropdown-arrow-modal ${isOpen ? 'rotate' : ''}`} />
            </div>
            {isOpen && (
                <ul className="dropdown-menu-modal">
                    {options.map((option) => (
                        <li
                            key={option}
                            className={`dropdown-item-modal ${option === currentValue ? 'selected' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const RegularizationModal = ({ isOpen, onClose, onSubmit, submitting = false, error = '' }) => {
    const [leaveType, setLeaveType] = useState('Casual Leave');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [localError, setLocalError] = useState('');

    const isHalfDay = leaveType === 'Half Day Leave';
    const todayStr = dayjs().format('YYYY-MM-DD');

    const totalDiff = fromDate && toDate ? dayjs(toDate).diff(dayjs(fromDate), 'day') + 1 : 0;
    const finalDays = isHalfDay && totalDiff === 1 ? 0.5 : (totalDiff > 0 ? totalDiff : 0);

    useEffect(() => {
        if (!isOpen) return undefined;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        if (isHalfDay && fromDate) setToDate(fromDate);
    }, [isOpen, isHalfDay, fromDate]);

    useEffect(() => {
        if (isOpen) {
            setLocalError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLeaveTypeChange = (type) => {
        setLeaveType(type);
        if (type === 'Half Day Leave' && fromDate) {
            setToDate(fromDate);
        }
    };

    const handleFromDateChange = (value) => {
        setFromDate(value);
        if (isHalfDay) {
            setToDate(value);
            return;
        }
        if (toDate && dayjs(toDate).isBefore(value)) {
            setToDate(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!fromDate || !toDate) {
            setLocalError('Please select from and to dates.');
            return;
        }
        if (dayjs(toDate).isBefore(fromDate, 'day')) {
            setLocalError('End date cannot be before start date.');
            return;
        }
        if (isHalfDay && toDate !== fromDate) {
            setLocalError('Half Day leave can only be for a single date.');
            return;
        }
        if (reason.trim().length < 20) {
            setLocalError('Reason must be at least 20 characters.');
            return;
        }

        const success = await onSubmit({
            leave_type: leaveType,
            start_date: fromDate,
            end_date: isHalfDay ? fromDate : toDate,
            reason: reason.trim(),
        });

        if (success) {
            setLeaveType('Casual Leave');
            setFromDate('');
            setToDate('');
            setReason('');
            setLocalError('');
            onClose();
        }
    };

    const displayError = localError || error;

    return createPortal(
        <div
            className="modal-overlay apply-leave-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reg-leave-title"
        >
            <div className="modal-content apply-leave-modal">
                <div className="modal-header">
                    <h2 id="reg-leave-title" className="modal-title">Request Regularization</h2>
                    <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                <form id="reg-leave-form" className="modal-form" onSubmit={handleSubmit}>
                    <div className="modal-form-scroll">
                        <p className="modal-subtext">
                            For past absences you could not apply leave in time. HR will review and convert to approved leave.
                        </p>

                        <div className="form-group">
                            <label className="form-label">Leave Type</label>
                            <CustomDropdown
                                options={REG_LEAVE_TYPES}
                                currentValue={leaveType}
                                onChange={handleLeaveTypeChange}
                                label="Select leave type"
                            />
                        </div>

                        <div className="form-group date-group">
                            <div className="date-inputs">
                                <div className="date-input-block">
                                    <div className={`date-input-wrapper floating-date ${fromDate ? 'has-value' : ''}`}>
                                        <input
                                            id="reg-from-date"
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => handleFromDateChange(e.target.value)}
                                            className="date-input"
                                            required
                                            max={todayStr}
                                            placeholder=" "
                                        />
                                        <label className="floating-label" htmlFor="reg-from-date">
                                            {isHalfDay ? 'Date' : 'From Date'}
                                        </label>
                                    </div>
                                </div>
                                {!isHalfDay && (
                                    <div className="date-input-block">
                                        <div className={`date-input-wrapper floating-date ${toDate ? 'has-value' : ''}`}>
                                            <input
                                                id="reg-to-date"
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => setToDate(e.target.value)}
                                                className="date-input"
                                                required
                                                min={fromDate || undefined}
                                                max={todayStr}
                                                placeholder=" "
                                            />
                                            <label className="floating-label" htmlFor="reg-to-date">
                                                To Date
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group days-display">
                            <label className="form-label">Total Days</label>
                            <p className="days-value">{finalDays} Day(s)</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reason (min 20 chars)</label>
                            <textarea
                                placeholder="Reason for regularization..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="reason-input"
                                rows="3"
                                required
                                minLength={20}
                            />
                        </div>

                        {displayError ? (
                            <p className="optional-holiday-hint" style={{ color: '#b91c1c' }}>
                                {displayError}
                            </p>
                        ) : null}
                    </div>
                </form>

                <div className="modal-footer">
                    <button type="button" className="button button-cancel" onClick={onClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="reg-leave-form"
                        className="button button-submit"
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting…' : 'Submit to HR'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
