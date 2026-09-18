import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { FaCog, FaUser, FaKey, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { isNativeApp } from "../../mobile/native/platform";
import "./Settings.css";

export function Settings() {
  const navigate = useNavigate();
  const native = useMemo(() => isNativeApp(), []);

  const openAppSettings = async () => {
    if (!native) {
      alert("Open browser/site settings to manage permissions.");
      return;
    }
    try {
      await CapacitorApp.openSettings();
    } catch {
      alert("Unable to open settings automatically. Please open app settings manually.");
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-title-row">
          <FaCog className="settings-title-icon" />
          <div>
            <h2>Settings</h2>
            <p>Manage account, security, and app permissions.</p>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="settings-action" onClick={() => navigate("/profile")}>
            <FaUser />
            <span>Profile</span>
          </button>

          <button type="button" className="settings-action" onClick={() => navigate("/change-password")}>
            <FaKey />
            <span>Change Password</span>
          </button>

          <button type="button" className="settings-action" onClick={() => navigate("/dashboard")}>
            <FaClock />
            <span>Punch & Attendance</span>
          </button>

          <button type="button" className="settings-action" onClick={openAppSettings}>
            <FaMapMarkerAlt />
            <span>{native ? "Open App Settings" : "Permission Help"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

