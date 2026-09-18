import { useCallback, useEffect, useRef, useState } from "react";
import { registerNativeBackHandler } from "../mobile/native/nativeBackNavigation";
import { isNativeApp } from "../mobile/native/platform";

/**
 * Persists a string "view" id in localStorage and optional URL ?view= param.
 * Survives browser refresh on panel pages that use internal view state.
 *
 * When getParentView is provided, hardware/gesture back navigates within the
 * panel (e.g. HR Updates → HR main) before leaving the page.
 */
export function usePersistedView({
  storageKey,
  defaultView,
  validViews,
  searchParamName = "view",
  syncUrl = true,
  getParentView,
  onNavigateToParent,
}) {
  const validSet = validViews ? new Set(validViews) : null;

  const normalize = useCallback(
    (raw) => {
      if (raw == null || raw === "") return null;
      const v = String(raw).trim();
      if (!v) return null;
      if (validSet && !validSet.has(v)) return null;
      return v;
    },
    [validSet],
  );

  const readStored = useCallback(() => {
    try {
      return normalize(localStorage.getItem(storageKey));
    } catch {
      return null;
    }
  }, [storageKey, normalize]);

  const readFromUrl = useCallback(() => {
    if (!syncUrl || typeof window === "undefined") return null;
    try {
      return normalize(new URLSearchParams(window.location.search).get(searchParamName));
    } catch {
      return null;
    }
  }, [syncUrl, searchParamName, normalize]);

  const [view, setViewState] = useState(() => readFromUrl() || readStored() || defaultView);

  const viewRef = useRef(view);
  viewRef.current = view;

  const didInitialUrlSync = useRef(false);
  const isPopNavigation = useRef(false);
  const skipNextUrlSync = useRef(false);

  const buildUrl = useCallback(
    (nextView) => {
      const params = new URLSearchParams(window.location.search);
      if (nextView === defaultView) {
        params.delete(searchParamName);
      } else {
        params.set(searchParamName, nextView);
      }
      const search = params.toString();
      return `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash || ""}`;
    },
    [defaultView, searchParamName],
  );

  const persistView = useCallback(
    (value) => {
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const setView = useCallback(
    (next) => {
      setViewState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        if (!value) return prev;
        persistView(value);
        return value;
      });
    },
    [persistView],
  );

  /* Sync view from browser back/forward (popstate). */
  useEffect(() => {
    if (!syncUrl || typeof window === "undefined") return undefined;

    const onPopState = () => {
      isPopNavigation.current = true;
      const urlView = readFromUrl();
      const next = urlView || defaultView;
      skipNextUrlSync.current = true;
      setViewState(next);
      persistView(next);
      queueMicrotask(() => {
        isPopNavigation.current = false;
        skipNextUrlSync.current = false;
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [syncUrl, readFromUrl, defaultView, persistView]);

  /* Push/replace URL when view changes programmatically. */
  useEffect(() => {
    if (!syncUrl || typeof window === "undefined") return;
    if (isPopNavigation.current || skipNextUrlSync.current) return;

    const params = new URLSearchParams(window.location.search);
    const urlView = normalize(params.get(searchParamName));
    const current =
      `${window.location.pathname}${window.location.search}${window.location.hash || ""}`;
    const nextUrl = buildUrl(view);

    if (nextUrl === current) return;

    if (!didInitialUrlSync.current) {
      didInitialUrlSync.current = true;
      window.history.replaceState(window.history.state, "", nextUrl);
      return;
    }

    /* On native, avoid pushState — it pollutes the router stack and breaks navigate(-1).
       Sub-view back is handled via registerNativeBackHandler instead. */
    if (isNativeApp()) {
      window.history.replaceState(window.history.state, "", nextUrl);
    } else if (view !== defaultView) {
      window.history.pushState({ [searchParamName]: view }, "", nextUrl);
    } else {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [view, defaultView, searchParamName, syncUrl, buildUrl, normalize]);

  /* Intercept hardware/gesture back for internal panel navigation. */
  useEffect(() => {
    if (!getParentView) return undefined;

    return registerNativeBackHandler(() => {
      const current = viewRef.current;
      if (current === defaultView) return false;

      const parent = getParentView(current);
      if (!parent || parent === current) return false;

      setView(parent);
      if (typeof onNavigateToParent === "function") {
        onNavigateToParent(parent, {
          pathname: window.location.pathname,
          currentView: current,
        });
      }
      return true;
    });
  }, [defaultView, getParentView, onNavigateToParent, setView]);

  return [view, setView, readStored];
}

export function clearPersistedPanelViews() {
  const keys = [
    "hr_panel_view",
    "manager_active_tab",
    "update_manager_view",
    "account_current_view",
  ];
  keys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}
