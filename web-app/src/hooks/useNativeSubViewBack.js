import { useEffect, useRef } from "react";
import { registerNativeBackHandler } from "../mobile/native/nativeBackNavigation";
import { isNativeApp } from "../mobile/native/platform";

/**
 * Registers hardware/gesture back for a local sub-view (useState) or wizard step.
 */
export function useNativeSubViewBack(view, defaultView, setView, getParentView) {
  const viewRef = useRef(view);
  viewRef.current = view;

  const getParentRef = useRef(getParentView);
  getParentRef.current = getParentView;

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    return registerNativeBackHandler(() => {
      const current = viewRef.current;
      if (current === defaultView) return false;

      const parent = getParentRef.current
        ? getParentRef.current(current)
        : defaultView;

      if (!parent || parent === current) return false;

      setView(parent);
      return true;
    });
  }, [defaultView, setView]);
}

/** Closes an open modal/drawer on hardware back (highest priority when open). */
export function useNativeModalBack(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isNativeApp() || !isOpen) return undefined;

    return registerNativeBackHandler(() => {
      onCloseRef.current?.();
      return true;
    });
  }, [isOpen]);
}

/** Calls onBack when this screen is active (panel leaf pages with onBack prop). */
export function useNativeOnBack(onBack, isActive = true) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    return registerNativeBackHandler(() => {
      if (!isActiveRef.current || !onBackRef.current) return false;
      onBackRef.current();
      return true;
    });
  }, []);
}

/**
 * Panel navigation with previousView tracking (Account panel pattern).
 */
export function useNativePreviousViewBack(
  currentView,
  defaultView,
  setCurrentView,
  getPreviousView,
) {
  const currentRef = useRef(currentView);
  currentRef.current = currentView;

  const getPreviousRef = useRef(getPreviousView);
  getPreviousRef.current = getPreviousView;

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    return registerNativeBackHandler(() => {
      const current = currentRef.current;
      if (current === defaultView) return false;

      const previous = getPreviousRef.current
        ? getPreviousRef.current(current)
        : defaultView;

      setCurrentView(previous || defaultView);
      return true;
    });
  }, [defaultView, setCurrentView]);
}

/**
 * Multiple back layers — top-most active layer wins (modals, forms, then parent).
 * layers: [{ when: boolean, back: () => void }, ...]
 */
export function useNativeLayeredBack(layers) {
  const layersRef = useRef(layers);
  layersRef.current = layers;

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    return registerNativeBackHandler(() => {
      const list = layersRef.current;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const layer = list[i];
        if (layer?.when) {
          layer.back?.();
          return true;
        }
      }
      return false;
    });
  }, []);
}
