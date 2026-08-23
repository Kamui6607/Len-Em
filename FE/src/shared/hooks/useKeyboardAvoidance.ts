import { useEffect } from "react";

/**
 * Hook to avoid keyboard covering form inputs on mobile.
 * Uses visualViewport resize event to scroll focused input into view.
 *
 * Should be used in form pages (Login, Register, Checkout).
 */
export function useKeyboardAvoidance() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")
      ) {
        // Use requestAnimationFrame to wait for keyboard animation
        requestAnimationFrame(() => {
          activeElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      }
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);
}
