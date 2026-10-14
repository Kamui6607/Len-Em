import { useEffect, useState } from "react";
import { useLocation } from "react-router";

const SCROLL_DELTA = 8;
const TOP_ZONE = 64;
const BOTTOM_ZONE = 24;
// Collapsing shrinks the sticky header (see nav.css), which shifts the page and
// makes the browser adjust scrollY (scroll anchoring). Ignore scroll changes
// until that transition (0.25s) settles, or they flip the state back → loop.
const SETTLE_MS = 300;

const TEXT_INPUT_TYPES = new Set([
  "text", "search", "email", "password", "tel", "url", "number",
  "date", "datetime-local", "month", "time", "week",
]);

function opensKeyboard(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) return !el.readOnly && TEXT_INPUT_TYPES.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * Mobile "chrome" state shared by the header, bottom tab bar and floating button.
 * Writes two attributes on <html> so the CSS of each piece can react on its own:
 *  - data-chrome="collapsed" while scrolling down (cleared when scrolling up,
 *    near the top, or at the end of the page)
 *  - data-keyboard-open while the on-screen keyboard is up
 * Returns `keyboardOpen` for components that unmount instead of hiding.
 */
export function useMobileChrome(enabled: boolean) {
  const location = useLocation();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Collapse on scroll down, restore on scroll up / top / bottom of the page.
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      delete root.dataset.chrome;
      return;
    }
    let lastY = window.scrollY;
    let frame = 0;
    let settleUntil = 0;
    const setCollapsed = (collapsed: boolean) => {
      if (collapsed === (root.dataset.chrome === "collapsed")) return;
      if (collapsed) root.dataset.chrome = "collapsed";
      else delete root.dataset.chrome;
      settleUntil = performance.now() + SETTLE_MS;
    };
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (performance.now() < settleUntil) {
        lastY = y;
        return;
      }
      const atBottom = window.innerHeight + y >= root.scrollHeight - BOTTOM_ZONE;
      if (y < TOP_ZONE || atBottom) {
        setCollapsed(false);
        lastY = y;
        return;
      }
      if (Math.abs(y - lastY) < SCROLL_DELTA) return;
      setCollapsed(y > lastY);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      delete root.dataset.chrome;
    };
  }, [enabled]);

  // A new page always starts with the chrome visible.
  useEffect(() => {
    delete document.documentElement.dataset.chrome;
  }, [location.pathname]);

  // Keyboard: a focused text field, or the visual viewport shrinking a lot.
  useEffect(() => {
    if (!enabled) {
      setKeyboardOpen(false);
      return;
    }
    const viewport = window.visualViewport;
    const sync = () => {
      const shrunk = viewport ? window.innerHeight - viewport.height > 150 : false;
      setKeyboardOpen(shrunk || opensKeyboard(document.activeElement));
    };
    // focusout fires before focus lands on the next element → check next tick.
    const onFocusOut = () => window.setTimeout(sync, 0);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", onFocusOut);
    viewport?.addEventListener("resize", sync);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", onFocusOut);
      viewport?.removeEventListener("resize", sync);
    };
  }, [enabled]);

  useEffect(() => {
    const root = document.documentElement;
    if (keyboardOpen) root.dataset.keyboardOpen = "";
    else delete root.dataset.keyboardOpen;
    return () => {
      delete root.dataset.keyboardOpen;
    };
  }, [keyboardOpen]);

  return { keyboardOpen };
}
