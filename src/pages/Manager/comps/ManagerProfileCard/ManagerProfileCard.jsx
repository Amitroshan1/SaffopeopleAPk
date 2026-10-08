import { UserAvatar } from "../../../../components/UserAvatar";
import "./ManagerProfileCard.css";

function scopeLabel(profile) {
  const assigned = Array.isArray(profile.assigned_scopes)
    ? profile.assigned_scopes
        .map((s) => ({
          emp_type: (s?.emp_type || "").trim(),
          circle: (s?.circle || "").trim(),
        }))
        .filter((s) => s.emp_type || s.circle)
    : [];
  if (assigned.length) {
    return assigned.map((s) => [s.emp_type, s.circle].filter(Boolean).join(" · ")).join(", ");
  }
  const fallback = [profile.scope?.emp_type, profile.scope?.circle].filter(Boolean).join(" · ");
  return fallback || "—";
}

export function ManagerProfileCard({ profile, loading, showScope = true }) {
  if (loading) {
    return (
      <div className="manager-profile-card manager-profile-card--loading">
        <div className="manager-profile-card__photo manager-profile-card__photo--skeleton" />
        <div className="manager-profile-card__details">
          <div className="manager-profile-card__skeleton-line" style={{ width: "40%" }} />
          <div className="manager-profile-card__skeleton-line" style={{ width: "70%" }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const name = profile.name || "—";
  const address = (profile.current_address || "").trim();

  return (
    <div className="manager-profile-card">
      <div className="manager-profile-card__head">
        <UserAvatar
          user={profile}
          photo_url={profile.photo_url}
          name={profile.name}
          className="manager-profile-card__photo"
          alt={profile.name || "Manager"}
          initialsBg="#ea580c"
        />
        <div className="manager-profile-card__identity">
          <h3 className="manager-profile-card__name">{name}</h3>
          {profile.mobile ? <p className="manager-profile-card__contact">{profile.mobile}</p> : null}
          {profile.email ? <p className="manager-profile-card__contact">{profile.email}</p> : null}
          <p className="manager-profile-card__line manager-profile-card__contact">
            <span>Address</span> {address || "—"}
          </p>
          <p className="manager-profile-card__line manager-profile-card__contact">
            <span>Department</span> {profile.designation || (showScope ? scopeLabel(profile) : "—")}
          </p>
        </div>
      </div>
    </div>
  );
}
