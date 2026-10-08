/**
 * Scroll all known app scroll roots to top.
 * Main layout uses a fixed .content-area (not window); login uses .home-scroll-area.
 */
const SCROLL_ROOT_SELECTORS = [
  '.app-layout > .content-area',
  '.home-scroll-area',
  '.main-layout .content-area',
];

function resetElement(el) {
  if (!el) return;
  el.scrollTop = 0;
  el.scrollLeft = 0;
}

export function scrollAppToTop() {
  const root = document.documentElement;
  const body = document.body;
  const previousRoot = root.style.scrollBehavior;
  const previousBody = body?.style.scrollBehavior ?? "";

  // Instant. A smooth scroll from the previous page lands mid-screen on the next one.
  root.style.scrollBehavior = "auto";
  if (body) body.style.scrollBehavior = "auto";

  resetElement(root);
  resetElement(body);
  resetElement(document.scrollingElement);
  window.scrollTo(0, 0);

  for (const selector of SCROLL_ROOT_SELECTORS) {
    document.querySelectorAll(selector).forEach(resetElement);
  }

  document.querySelectorAll("body *").forEach((el) => {
    if (el.scrollTop > 0 || el.scrollLeft > 0) resetElement(el);
  });

  root.style.scrollBehavior = previousRoot;
  if (body) body.style.scrollBehavior = previousBody;
}
