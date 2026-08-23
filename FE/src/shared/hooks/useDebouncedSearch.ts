import { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";

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

  // Cancel debounce on unmount
  useEffect(() => {
    const fn = debounce((value: string) => {
      setDebouncedValue(value);
    }, delay);

    if (inputValue.length >= minChars) {
      fn(inputValue);
    } else {
      setDebouncedValue("");
    }

    return () => {
      fn.cancel();
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