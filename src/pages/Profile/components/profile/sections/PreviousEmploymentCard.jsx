import { GRADIENT_HEADER_STYLE } from '../../../utils/gradientStyles';
import {Input} from '../../common/Input';

const todayLocalIso = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const PreviousEmploymentCard = ({ index, employmentData, onChange, onRemove, errors }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onChange(index, name, value);
    };

    const today = todayLocalIso();
    const joiningMax = employmentData.dateOfLeaving || today;
    const leavingMin = employmentData.dateOfJoining || undefined;

    return (
        <div className="previous-employment-card">
            <div className="previous-employment-card-header">
                <h4><span style={GRADIENT_HEADER_STYLE}>Company #{index + 1}</span></h4>
                <button
                    onClick={() => onRemove(index)}
                    className="remove-btn"
                >
                    Remove
                </button>
            </div>

            <div className="grid-2">
                <Input
                    label="Company Name"
                    name="companyName"
                    value={employmentData.companyName}
                    onChange={handleInputChange}
                    error={errors[`companyName_${index}`]}
                />
                <Input
                    label="Designation"
                    name="designation"
                    value={employmentData.designation}
                    onChange={handleInputChange}
                />
                <Input
                    label="Date of Joining"
                    name="dateOfJoining"
                    type="date"
                    max={joiningMax}
                    value={employmentData.dateOfJoining || ''}
                    onChange={handleInputChange}
                    error={errors[`dateOfJoining_${index}`]}
                />
                <Input
                    label="Date of Leaving"
                    name="dateOfLeaving"
                    type="date"
                    min={leavingMin}
                    max={today}
                    value={employmentData.dateOfLeaving}
                    onChange={handleInputChange}
                    error={errors[`dateOfLeaving_${index}`]}
                />
                <Input
                    label="Experience (Years)"
                    name="experienceYears"
                    value={employmentData.experienceYears}
                    onChange={handleInputChange}
                />
            </div>
        </div>
    );
}
