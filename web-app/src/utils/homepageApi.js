const API_BASE_URL = '/api/auth';
export const APP_SOFT_REFRESH_EVENT = 'app:soft-refresh';

let cachedResult = null;
let cachedAt = 0;
let inFlight = null;

export function clearHomepageCache() {
  cachedResult = null;
  cachedAt = 0;
  inFlight = null;
}

export function getCachedHomepage(maxAgeMs = Infinity) {
  if (!cachedResult) return null;
  if (Date.now() - cachedAt > maxAgeMs) return null;
  return cachedResult;
}

/**
 * Fetch /employee/homepage with in-flight dedup + short-lived client cache.
 */
export async function fetchEmployeeHomepage({ force = false, maxAgeMs = 45_000 } = {}) {
  if (!force) {
    const fresh = getCachedHomepage(maxAgeMs);
    if (fresh) return fresh;
  }

  if (inFlight) return inFlight;

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  inFlight = (async () => {
    const response = await fetch(`${API_BASE_URL}/employee/homepage`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch homepage data.');
    }

    const result = await response.json();
    if (result?.success) {
      cachedResult = result;
      cachedAt = Date.now();
    }
    return result;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function dispatchAppSoftRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(APP_SOFT_REFRESH_EVENT));
}
