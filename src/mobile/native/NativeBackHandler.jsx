import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "@capacitor/app";
import { isNativeApp } from "./platform.js";
import { tryConsumeNativeBack } from "./nativeBackNavigation.js";
import {
  canGoBackInStack,
  goBackInStack,
  getNavigationStackSize,
  recordNavigation,
  resetNavigationStack,
} from "./nativeNavigationStack.js";

function normalizePath(path) {
  return (path || "").replace(/\/$/, "") || "/";
}

function isAppRootPath(path) {
  const p = normalizePath(path);
  return p === "/" || p === "/dashboard";
}

function routerHistoryIndex() {
  const idx = window.history.state?.idx;
  return typeof idx === "number" ? idx : 0;
}

function navigateToStackPath(navigate, path) {
  const [pathname, search = ""] = path.split("?");
  navigate({ pathname, search: search ? `?${search}` : "" });
}

/**
 * Handles Android hardware back / gesture back inside the Capacitor shell.
 */
export function NativeBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isNativeApp()) return;

    if (!initializedRef.current) {
      resetNavigationStack(location.pathname, location.search);
      initializedRef.current = true;
    }
    recordNavigation(location.pathname, location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    const listenerPromise = App.addListener("backButton", () => {
      const token = localStorage.getItem("token");

      if (!token) {
        App.exitApp();
        return;
      }

      /* Modals, panel sub-views, HR Updates, Update Manager, etc. */
      if (tryConsumeNativeBack()) {
        return;
      }

      /* React Router history fallback */
      if (routerHistoryIndex() > 0) {
        navigateRef.current(-1);
        return;
      }

      /* Custom route stack fallback when history idx is unreliable. */
      if (canGoBackInStack()) {
        goBackInStack((target) => navigateToStackPath(navigateRef.current, target));
        return;
      }

      const path = normalizePath(window.location.pathname);
      const stackSize = getNavigationStackSize();

      if (isAppRootPath(path) && stackSize <= 1) {
        App.exitApp();
        return;
      }

      App.exitApp();
    });

    return () => {
      Promise.resolve(listenerPromise).then((handle) => handle?.remove?.());
    };
  }, []);

  return null;
}
