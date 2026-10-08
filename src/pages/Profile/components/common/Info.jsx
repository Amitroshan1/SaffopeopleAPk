import React from 'react';

export const Info = ({ label, value, wide }) => {
    const displayValue = value || '-';
    return (
        <div className={`info-box${wide ? ' info-box--wide' : ''}`}>
            <p className="label">{label}</p>
            <p className="value">{displayValue}</p>
        </div>
    );
}