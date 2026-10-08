/**
 * Tracks in-app route history on native so back works even when
 * window.history.state.idx is unreliable in the WebView.
 */

let stack = [];
let suppressNextRecord = false;

function routeKey(pathname, search = "") {
  return `${pathname || "/"}${search || ""}`;
}

export function resetNavigationStack(pathname, search = "") {
  const path = routeKey(pathname, search);
  stack = path ? [path] : [];
}

export function recordNavigation(pathname, search = "") {
  const path = routeKey(pathname, search);
  if (!path) return;

  if (suppressNextRecord) {
    suppressNextRecord = false;
    const top = stack[stack.length - 1];
    if (top === path) return;
  }

  const top = stack[stack.length - 1];
  if (top === path) return;

  const existingIdx = stack.lastIndexOf(path);
  if (existingIdx >= 0 && existingIdx < stack.length - 1) {
    stack = stack.slice(0, existingIdx + 1);
    return;
  }

  stack.push(path);
}

export function canGoBackInStack() {
  return stack.length > 1;
}

/**
 * @param {(path: string) => void} navigateToPath
 * @returns {boolean} whether back navigation was performed
 */
export function goBackInStack(navigateToPath) {
  if (stack.length <= 1) return false;

  stack.pop();
  const target = stack[stack.length - 1];
  if (!target) return false;

  suppressNextRecord = true;
  navigateToPath(target);
  return true;
}

export function getNavigationStackSize() {
  return stack.length;
}
