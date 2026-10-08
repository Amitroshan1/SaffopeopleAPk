/**
 * Registry for in-app back handlers (panel sub-views, modals, etc.).
 * Handlers are tried in reverse registration order (most recent first).
 */
const handlers = [];

export function registerNativeBackHandler(handler) {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}

/**
 * @returns {boolean} true if a handler consumed the back press
 */
export function tryConsumeNativeBack() {
  for (let i = handlers.length - 1; i >= 0; i -= 1) {
    try {
      if (handlers[i]()) return true;
    } catch {
      /* ignore handler errors */
    }
  }
  return false;
}
