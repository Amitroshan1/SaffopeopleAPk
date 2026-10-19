import React from 'react';
import { GRADIENT_HEADER_STYLE } from '../../utils/gradientStyles';
import { Info } from '../common/Info';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { formatDateForDisplay, shouldShowReportingManager } from '../../utils/profileUtils';
import { DOCUMENT_LABELS } from '../../utils/profileApi';
import { DOCUMENT_DOWNLOAD_NAMES } from '../../utils/profileDocuments';
import { DocumentImageViewer, useProfileDocumentOpener } from './ProfileDocumentViewer';
import {
    maskAadhaar,
    maskPan,
    maskBankAccount,
} from '../../utils/documentIdentity';

const formatAddressBlock = (addr) => {
    if (!addr) return '—';
    const parts = [
        addr.street,
        [addr.city, addr.district].filter(Boolean).join(', '),
        addr.state,
        addr.pincode ? `PIN ${addr.pincode}` : '',
    ].filter((p) => p && String(p).trim());
    return parts.length ? parts.join('\n') : '—';
};

const ViewSection = ({ id, title, modifier, children }) => (
    <section id={id} className={`profile-view-card profile-view-card--${modifier}`}>
        <h4>
            <span style={GRADIENT_HEADER_STYLE}>{title}</span>
        </h4>
        {children}
    </section>
);

const MergedBlock = ({ id, title, children }) => (
    <div id={id} className="profile-merged-block">
        <h5 className="profile-merged-block__title">{title}</h5>
        {children}
    </div>
);

const InfoGrid = ({ items }) => (
    <div className="profile-compact-grid">
        {items.map(({ label, value, key, wide }) => (
            <Info key={key || label} label={label} value={value || '—'} wide={wide} />
        ))}
    </div>
);

export const ProfileViewLayout = ({
    data,
    profileProgress,
    avatarUrl,
    onImageChange,
    onEditToggle,
}) => {
    const {
        formData,
        currentAddress,
        permanentAddress,
        previousEmployment,
        educationDetails,
        files,
        documentMeta,
        probation,
    } = data;

    const { viewer, closeViewer, openDocument, busyKey } = useProfileDocumentOpener();

    const personalItems = [
        { label: 'Full name', value: formData.fullName, key: 'fullName' },
        { label: "Father's name", value: formData.fatherName, key: 'father' },
        { label: "Mother's name", value: formData.motherName, key: 'mother' },
        { label: 'Marital status', value: formData.maritalStatus, key: 'marital' },
        { label: 'Date of birth', value: formatDateForDisplay(formData.dateOfBirth), key: 'dob' },
        { label: 'Gender', value: formData.gender, key: 'gender' },
        { label: 'Blood group', value: formData.bloodGroup, key: 'blood' },
        { label: 'Nationality', value: formData.nationality, key: 'nat' },
        { label: 'Personal email', value: formData.personalEmail, key: 'email', wide: true },
        {
            label: 'Mobile',
            value: formData.mobileCountryCode
                ? `${formData.mobileCountryCode} ${formData.mobile}`
                : formData.mobile,
            key: 'mobile',
        },
        {
            label: 'Emergency contact',
            value: formData.emergencyCountryCode
                ? `${formData.emergencyCountryCode} ${formData.emergency}`
                : formData.emergency,
            key: 'emergency',
        },
    ];

    const employmentItems = [
        { label: 'Employee ID', value: formData.employeeId, key: 'empId' },
        { label: 'Circle / Department', value: formData.department, key: 'dept' },
        { label: 'Designation', value: formData.designation, key: 'desig' },
        { label: 'Employment type', value: formData.employmentType, key: 'type' },
        {
            label: 'Date of joining',
            value: formatDateForDisplay(formData.dateOfJoining),
            key: 'doj',
        },
        ...(shouldShowReportingManager(formData)
            ? [{ label: 'Reporting manager', value: formData.reportingManager, key: 'rm' }]
            : []),
    ];

    const filledEducation = (educationDetails || []).filter(
        (e) => e.qualification || e.institution || e.university
    );

    return (
        <div className="profile-v2">
            <div className="profile-view-wrapper profile-v2-body">
                <aside className="profile-view-left">
                    <ProfileSummaryCard
                        formData={formData}
                        currentAddress={currentAddress}
                        avatarUrl={avatarUrl}
                        onImageChange={onImageChange}
                        onEdit={onEditToggle}
                        showEditButton
                        progressValue={profileProgress}
                    />
                </aside>

                <div className="profile-view-right profile-v2-sections">
                    <section id="profile-details" className="profile-view-card profile-view-card--personal">
                        <h4>
                            <span style={GRADIENT_HEADER_STYLE}>Profile details</span>
                        </h4>

                        <MergedBlock id="profile-personal" title="Personal information">
                            <div className="personal-info-stack profile-compact-grid">
                                {personalItems.map(({ label, value, key, wide }) => (
                                    <Info key={key || label} label={label} value={value || '—'} wide={wide} />
                                ))}
                            </div>
                        </MergedBlock>

                        <MergedBlock id="profile-address" title="Address">
                            <div className="grid-2 profile-address-view">
                                <div className="profile-address-block">
                                    <h5>Current address</h5>
                                    <pre className="profile-address-text">
                                        {formatAddressBlock(currentAddress)}
                                    </pre>
                                </div>
                                <div className="profile-address-block">
                                    <h5>Permanent address</h5>
                                    <pre className="profile-address-text">
                                        {formatAddressBlock(permanentAddress)}
                                    </pre>
                                </div>
                            </div>
                        </MergedBlock>

                        <MergedBlock id="profile-employment" title="Current employment">
                            <InfoGrid items={employmentItems} />
                        </MergedBlock>

                        <MergedBlock id="profile-education" title="Education">
                            {filledEducation.length === 0 ? (
                                <p className="profile-empty-hint">No education records yet.</p>
                            ) : (
                                <div className="profile-record-list">
                                    {filledEducation.map((row, eduIndex) => (
                                        <div key={row.id} className="profile-record">
                                            <div className="profile-compact-grid">
                                                <Info label="Qualification" value={row.qualification} />
                                                <Info label="Institution" value={row.institution} />
                                                <Info label="Board / University" value={row.university} wide />
                                                <Info
                                                    label="Period"
                                                    value={`${formatDateForDisplay(row.fromDate)} – ${formatDateForDisplay(row.toDate)}`}
                                                />
                                                <Info label="Marks" value={row.marks} />
                                                <div className="info-box">
                                                    <p className="label">Certificate</p>
                                                    {typeof row.certificate === 'string' && row.certificate ? (
                                                        <button
                                                            type="button"
                                                            className="profile-doc-link profile-doc-link--button"
                                                            disabled={Boolean(busyKey)}
                                                            onClick={() => openDocument(
                                                                `edu-${row.id ?? eduIndex}`,
                                                                row.certificate,
                                                                `Education_Certificate_${eduIndex + 1}`
                                                            )}
                                                        >
                                                            {busyKey === `edu-${row.id ?? eduIndex}` ? 'Opening…' : 'View'}
                                                        </button>
                                                    ) : (
                                                        <p className="value">—</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </MergedBlock>
                    </section>

                    {probation?.applicable && (
                        <ViewSection
                            id="profile-probation"
                            title="Probation status"
                            modifier="probation"
                        >
                            <div className={`profile-probation-panel profile-probation-panel--${probation.status || 'default'}`}>
                                <p className="profile-probation-status">{probation.status_label || '—'}</p>
                                <p className="profile-probation-message">{probation.message || '—'}</p>
                                <InfoGrid
                                    items={[
                                        {
                                            label: 'Probation start',
                                            value: formatDateForDisplay(probation.probation_start_date),
                                            key: 'prob-start',
                                        },
                                        {
                                            label: 'Probation end',
                                            value: formatDateForDisplay(probation.probation_end_date),
                                            key: 'prob-end',
                                        },
                                        ...(probation.days_remaining > 0
                                            ? [{
                                                label: 'Days remaining',
                                                value: String(probation.days_remaining),
                                                key: 'prob-days',
                                            }]
                                            : []),
                                        ...(probation.extended_until
                                            ? [{
                                                label: 'Extended until',
                                                value: formatDateForDisplay(probation.extended_until),
                                                key: 'prob-ext',
                                            }]
                                            : []),
                                        ...(probation.confirmed_at
                                            ? [{
                                                label: 'Confirmed on',
                                                value: formatDateForDisplay(probation.confirmed_at),
                                                key: 'prob-confirmed',
                                            }]
                                            : []),
                                    ]}
                                />
                            </div>
                        </ViewSection>
                    )}

                    {(previousEmployment || []).length > 0 && (
                        <ViewSection
                            id="profile-previous"
                            title="Previous employment"
                            modifier="previous"
                        >
                            <div className="profile-record-list">
                                {previousEmployment.map((row, i) => (
                                    <div key={i} className="profile-record">
                                        <div className="profile-compact-grid">
                                            <Info label="Company" value={row.companyName} wide />
                                            <Info label="Designation" value={row.designation} />
                                            <Info label="Left on" value={formatDateForDisplay(row.dateOfLeaving)} />
                                            <Info label="Experience (yrs)" value={row.experienceYears} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ViewSection>
                    )}

                    <ViewSection id="profile-documents" title="Documents" modifier="documents">
                        <div className="profile-compact-grid">
                            {documentMeta?.aadhaarNumber && (
                                <Info label="Aadhaar Number" value={maskAadhaar(documentMeta.aadhaarNumber)} />
                            )}
                            {documentMeta?.panNumber && (
                                <Info label="PAN Number" value={maskPan(documentMeta.panNumber)} />
                            )}
                            {documentMeta?.bankAccountNumber && (
                                <Info label="Bank Account" value={maskBankAccount(documentMeta.bankAccountNumber)} />
                            )}
                            {documentMeta?.bankName && (
                                <Info label="Bank Name" value={documentMeta.bankName} />
                            )}
                            {documentMeta?.bankBranchCode && (
                                <Info label="Branch Code" value={documentMeta.bankBranchCode} />
                            )}
                            {documentMeta?.ifscCode && (
                                <Info label="IFSC" value={documentMeta.ifscCode} />
                            )}
                        </div>
                        <ul className="profile-doc-list profile-compact-grid">
                            {Object.entries(DOCUMENT_LABELS).map(([key, label]) => {
                                const path = files?.[key];
                                const hasFile = typeof path === 'string' && path.trim() !== '';
                                return (
                                    <li key={key} className="profile-doc-list-item">
                                        <span className="profile-doc-list-label">{label}</span>
                                        {hasFile ? (
                                            <button
                                                type="button"
                                                className="profile-doc-link profile-doc-link--button"
                                                disabled={Boolean(busyKey)}
                                                onClick={() => openDocument(key, path, DOCUMENT_DOWNLOAD_NAMES[key] || key)}
                                            >
                                                {busyKey === key ? 'Opening…' : 'Uploaded — open'}
                                            </button>
                                        ) : (
                                            <span className="profile-doc-missing">Not uploaded</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </ViewSection>
                </div>
            </div>
            <DocumentImageViewer viewer={viewer} onClose={closeViewer} />
        </div>
    );
};
