import { useState } from 'react';
import { startImmediateUpdate } from './forceUpdate.js';
import './ForceUpdateScreen.css';

/**
 * Full-screen mandatory update UI. No dismiss / Later.
 */
export function ForceUpdateScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onUpdateNow = async () => {
    setBusy(true);
    setError('');
    const result = await startImmediateUpdate();
    setBusy(false);

    if (!result.ok) {
      // User cancelled Play sheet (code 1) — stay blocked and let them try again.
      if (result.code === 1) {
        setError('Update is required to continue. Please tap Update Now again.');
        return;
      }
      setError(
        'Unable to start the update. Check your connection and try again, or update Saffo People from Google Play.'
      );
    }
  };

  return (
    <div className="force-update-screen" role="alertdialog" aria-modal="true" aria-labelledby="force-update-title">
      <div className="force-update-card">
        <p className="force-update-eyebrow">Saffo People</p>
        <h1 id="force-update-title" className="force-update-title">
          Update required
        </h1>
        <p className="force-update-message">
          A new version of HRMS is available. Please update the app to continue using attendance and other features.
        </p>
        {error ? <p className="force-update-error">{error}</p> : null}
        <button
          type="button"
          className="force-update-btn"
          onClick={onUpdateNow}
          disabled={busy}
        >
          {busy ? 'Starting update…' : 'Update Now'}
        </button>
        <p className="force-update-note">A mandatory update is required to continue.</p>
      </div>
    </div>
  );
}
