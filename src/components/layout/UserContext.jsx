import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { setPlanContext, clearPlanContext } from '../../utils/planFeatures';
import { clearSensitiveToken } from '../../utils/sensitiveDataAuth';
import { setDownloadUserId } from '../../mobile/native/nativeDownload';
import {
  APP_SOFT_REFRESH_EVENT,
  clearHomepageCache,
  fetchEmployeeHomepage,
} from '../../utils/homepageApi';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    user: {},
    employee: {},
    leave_balance: { pl: 'N/A', cl: 'N/A' },
    managers: {},
    punch: {},
    last_leave: null,
    last_payslip: null,
    probation: null,
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [photoVersion, setPhotoVersion] = useState(0);
  const fetchCoreUserDataRef = useRef(null);

  const applyHomepageResult = useCallback((result) => {
    if (!result?.success) return;
    setPlanContext(result.plan, result.features);
    const nextUser = result.user || {};
    if (nextUser.id != null) {
      setDownloadUserId(nextUser.id);
    }
    setUserData({
      user: nextUser,
      employee: result.employee || {},
      leave_balance: result.leave_balance || { pl: 'N/A', cl: 'N/A' },
      managers: result.managers || {},
      plan: result.plan || 'essential',
      plan_label: result.plan_label || '',
      features: result.features || [],
      punch: result.punch || {},
      last_leave: result.last_leave || null,
      last_payslip: result.last_payslip || null,
      probation: result.probation || null,
    });
  }, []);

  const fetchCoreUserData = useCallback(async ({ force = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearPlanContext();
      clearHomepageCache();
      setLoadingUser(false);
      return null;
    }
    try {
      const result = await fetchEmployeeHomepage({ force, maxAgeMs: force ? 0 : 45_000 });
      if (result?.success) {
        applyHomepageResult(result);
      }
      return result;
    } catch (err) {
      if (err?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('lastActivityAt');
        clearSensitiveToken();
        clearPlanContext();
        clearHomepageCache();
      }
      console.error('User Context Fetch error:', err);
      return null;
    } finally {
      setLoadingUser(false);
    }
  }, [applyHomepageResult]);

  fetchCoreUserDataRef.current = fetchCoreUserData;

  const bumpPhotoVersion = useCallback(() => {
    setPhotoVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    fetchCoreUserData({ force: false });
  }, [fetchCoreUserData]);

  useEffect(() => {
    const onSoftRefresh = () => {
      fetchCoreUserDataRef.current?.({ force: true });
    };
    window.addEventListener(APP_SOFT_REFRESH_EVENT, onSoftRefresh);
    return () => window.removeEventListener(APP_SOFT_REFRESH_EVENT, onSoftRefresh);
  }, []);

  const value = {
    userData,
    loadingUser,
    refreshUserData: fetchCoreUserData,
    applyHomepageResult,
    photoVersion,
    bumpPhotoVersion,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
