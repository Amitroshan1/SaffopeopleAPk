import React from 'react';
import { GRADIENT_HEADER_STYLE } from '../../utils/gradientStyles';
import { ProfileAvatar } from './ProfileAvatar';

export const ProfileSummaryCard = ({
    formData,
    currentAddress,
    avatarUrl,
    onImageChange,
    onEdit,
    showEditButton = true,
    progressValue = 0,
}) => {
    const locationLine = [currentAddress?.city, currentAddress?.pincode]
        .filter(Boolean)
        .join(', ');

    const designationTrimmed = (formData.designation || '').trim();
    const isPlaceholderDesignation =
        !designationTrimmed || designationTrimmed.toLowerCase() === 'not specified';
    const rolePrimary = isPlaceholderDesignation
        ? (formData.employeeId || '').trim()
        : designationTrimmed;
    const roleLine = [rolePrimary, formData.department].filter(Boolean).join(' · ');

    return (
        <div className="profile-summary-card card card--summary profile-summary-card--side">
            <div className="profile-summary-top">
                <div className="profile-summary-details">
                    <h3 className="profile-summary-name">
                        <span style={GRADIENT_HEADER_STYLE}>
                            {formData.fullName || 'Your name'}
                        </span>
                    </h3>
                    {roleLine ? (
                        <p className="profile-summary-role">{roleLine}</p>
                    ) : null}

                    <ul className="profile-summary-contacts">
                        {formData.personalEmail && (
                            <li>
                                <span className="profile-summary-icon" aria-hidden>
                                    @
                                </span>
                                {formData.personalEmail}
                            </li>
                        )}
                        {formData.mobile && (
                            <li>
                                <span className="profile-summary-icon" aria-hidden>
                                    ☎
                                </span>
                                {formData.mobileCountryCode
                                    ? `${formData.mobileCountryCode} ${formData.mobile}`
                                    : formData.mobile}
                            </li>
                        )}
                        {locationLine && (
                            <li>
                                <span className="profile-summary-icon" aria-hidden>
                                    ⌖
                                </span>
                                {locationLine}
                            </li>
                        )}
                    </ul>
                </div>

                <div className="profile-summary-photo">
                    <ProfileAvatar imageUrl={avatarUrl} onImageChange={onImageChange} />
                </div>
            </div>

            {showEditButton && onEdit && (
                <button type="button" className="profile-btn-gradient profile-btn-gradient--compact" onClick={onEdit}>
                    Edit profile
                </button>
            )}
            <p className="profile-summary-completion">
                {Number.isFinite(Number(progressValue)) ? progressValue : 0}% profile completion
            </p>
        </div>
    );
};
