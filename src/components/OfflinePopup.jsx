import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { clearLoginNotificationsFlag } from '../hooks/useFloatingNotifications';
import { clearPlanContext } from '../utils/planFeatures';
import { clearPersistedPanelViews } from '../hooks/usePersistedView';
import { clearSensitiveToken } from '../utils/sensitiveDataAuth';
import './OfflinePopup.css';

const MAX_RETRIES = 3;

export function OfflinePopup() {
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const [showPopup, setShowPopup] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isOnline) {
      setShowPopup(false);
      setRetryCount(0);
    } else {
      setShowPopup(true);
    }
  }, [isOnline]);

  const goToLogin = () => {
    setShowPopup(false);
    setRetryCount(0);
    // Must clear session — otherwise HeroSection redirects "/" back to /dashboard
    clearLoginNotificationsFlag();
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivityAt');
    clearSensitiveToken();
    clearPlanContext();
    clearPersistedPanelViews();
    navigate('/', { replace: true });
  };

  const handleRefresh = () => {
    if (isOnline) {
      setShowPopup(false);
      setRetryCount(0);
      return;
    }

    // Still offline: after 3 attempts, 4th Refresh goes to login
    if (retryCount >= MAX_RETRIES) {
      goToLogin();
      return;
    }

    setRetryCount((prev) => prev + 1);
    // Keep popup visible while offline
  };

  const handleClose = () => {
    goToLogin();
  };

  return (
    <>
      {showPopup && (
        <div className="offline-popup-overlay" onClick={handleClose}>
          <div
            className="offline-popup-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="offline-popup-icon">⚠️</div>
            <h2>No Internet Connection</h2>
            <p>
              Please check your internet connection and try again.
            </p>
            <p className="offline-popup-hint">
              Attempt {retryCount} of {MAX_RETRIES}
            </p>
            {retryCount >= MAX_RETRIES && (
              <p className="offline-popup-warning">
                Next Refresh will log you out and take you to the login page.
              </p>
            )}
            <div className="offline-popup-actions">
              <button
                className="offline-btn refresh"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
              >
                Refresh
              </button>
              <button
                className="offline-btn close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
