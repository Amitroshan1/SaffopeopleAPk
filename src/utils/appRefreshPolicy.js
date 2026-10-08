/** Routes where leave/punch data should refresh when navigated to. */
const LEAVE_SENSITIVE_PREFIXES = [
  '/dashboard',
  '/leaves',
  '/attendance',
  '/wfh',
  '/payslip',
];

const NAV_REFRESH_MIN_MS = 2 * 60 * 1000;
let lastNavRefreshAt = 0;

export function shouldRefreshUserOnNavigate(pathname = '') {
  const path = (pathname || '').toLowerCase();
  const matches = LEAVE_SENSITIVE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  if (!matches) return false;
  const now = Date.now();
  if (now - lastNavRefreshAt < NAV_REFRESH_MIN_MS) return false;
  lastNavRefreshAt = now;
  return true;
}

export function markNavRefreshDone() {
  lastNavRefreshAt = Date.now();
}
