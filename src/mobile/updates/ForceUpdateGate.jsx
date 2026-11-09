import { useEffect, useState } from 'react';
import { checkPlayForceUpdate } from './forceUpdate.js';
import { ForceUpdateScreen } from './ForceUpdateScreen.jsx';

/**
 * On Android native launch, blocks the app when Play reports an Immediate Update.
 * Children render only after the check finishes (or when no update is required).
 */
export function ForceUpdateGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { needsUpdate: required } = await checkPlayForceUpdate();
      if (cancelled) return;
      setNeedsUpdate(required);
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return null;
  }

  if (needsUpdate) {
    return <ForceUpdateScreen />;
  }

  return children;
}
