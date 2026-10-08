import React from 'react';
import { GRADIENT_HEADER_STYLE } from '../../utils/gradientStyles';

export const ProgressCircle = ({ progressValue, sections = [] }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressValue / 100) * circumference;
    const incompleteCount = sections.filter((s) => !s.complete).length;

    return (
        <div className="card progress-card progress-card--compact">
            <div className="progress-circle-ring progress-circle-ring--compact" aria-hidden>
                <svg width="56" height="56" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={progressValue >= 100 ? '#10b981' : '#3b82f6'}
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="progress-circle-arc"
                    />
                </svg>
                <div className="progress-circle-value progress-circle-value--compact">{progressValue}%</div>
            </div>
            <div className="progress-card__copy">
                <h3>
                    <span style={GRADIENT_HEADER_STYLE}>Profile completion</span>
                </h3>
                <p className="progress-circle-caption">
                    {progressValue >= 100
                        ? 'Your profile is fully complete.'
                        : incompleteCount > 0
                          ? `${incompleteCount} section${incompleteCount !== 1 ? 's' : ''} still need updates.`
                          : `You are ${100 - progressValue}% away from a complete profile.`}
                </p>
            </div>
        </div>
    );
};
