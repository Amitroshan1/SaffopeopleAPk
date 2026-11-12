import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  isSystemLocationEnabled,
  openAppSettings,
} from './iosLocationServices.js';

export function LocationServicesGate({ children }) {
  const isIOS = Capacitor.getPlatform() === 'ios';
  const [locationOff, setLocationOff] = useState(false);

  useEffect(() => {
    if (!isIOS) return undefined;

    let cancelled = false;

    const syncFromNative = () => {
      void isSystemLocationEnabled()
        .then((enabled) => {
          if (!cancelled) setLocationOff(!enabled);
        })
        .catch((error) => {
          console.error('Unable to check iOS Location Services:', error);
        });
    };

    // Defer so the initial sync is not a synchronous setState inside the effect.
    const timer = window.setTimeout(syncFromNative, 0);

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        syncFromNative();
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [isIOS]);

  const handleOpenSettings = async () => {
    try {
      await openAppSettings();
    } catch (error) {
      console.error('Unable to open Settings:', error);
    }
  };

  return (
    <>
      {children}

      {isIOS && locationOff && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#fff',
              color: '#222',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <p style={{ marginTop: 0, fontWeight: 600 }}>
              Location is required for attendance
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5 }}>
              Turn on Location Services in iPhone Settings: Privacy &amp; Security
              → Location Services. Then return to this app.
            </p>
            <button
              type="button"
              onClick={handleOpenSettings}
              style={{
                width: '100%',
                padding: 12,
                border: 0,
                borderRadius: 8,
                background: '#1677ff',
                color: '#fff',
                fontSize: 16,
              }}
            >
              Open Settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}
