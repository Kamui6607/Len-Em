import { useState, useEffect, useCallback } from "react";

interface UseDebouncedSearchOptions {
  delay?: number;
  minChars?: number;
}

interface UseDebouncedSearchReturn {
  inputValue: string;
  debouncedValue: string;
  isWaiting: boolean;
  isTooShort: boolean;
  setInputValue: (value: string) => void;
  clear: () => void;
}

/**
 * Hook for debounced search with minimum character validation.
 * Prevents API spam by only emitting values after user stops typing.
 */
export function useDebouncedSearch({
  delay = 400,
  minChars = 2,
}: UseDebouncedSearchOptions = {}): UseDebouncedSearchReturn {
  const [inputValue, setInputValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  const isWaiting = inputValue !== debouncedValue && inputValue.length >= minChars;
  const isTooShort = inputValue.length > 0 && inputValue.length < minChars;

  // Một timer duy nhất cho mọi lần gõ: gõ tiếp → huỷ timer cũ, đặt lại từ đầu.
  // (Trước đây tạo `debounce()` mới mỗi lần render — timer cũ bị mất tham chiếu
  // nên KHÔNG bao giờ bị cancel → mỗi ký tự bắn 1 API call.)
  useEffect(() => {
    if (inputValue.length < minChars) {
      setDebouncedValue("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [inputValue, delay, minChars]);

  const clear = useCallback(() => {
    setInputValue("");
    setDebouncedValue("");
  }, []);

  return {
    inputValue,
    debouncedValue,
    isWaiting,
    isTooShort,
    setInputValue,
    clear,
  };
}