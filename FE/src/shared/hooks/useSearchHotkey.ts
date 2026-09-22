import { useEffect } from "react";

/**
 * Phím tắt "/" focus ô search (giống GitHub/Gmail).
 * - Bỏ qua khi user đang gõ trong input/textarea/contenteditable.
 * - Truyền `targetId = null` để tắt (dùng cho các ô search phụ trong form,
 *   nơi nhiều ô trên cùng màn hình sẽ xung đột phím tắt).
 */
export function useSearchHotkey(targetId: string | null) {
  useEffect(() => {
    if (!targetId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (isTyping) return;

      const input = document.getElementById(targetId);
      if (input instanceof HTMLInputElement) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [targetId]);
}
