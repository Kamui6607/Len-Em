import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "../ui/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isLoading?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 400,
  isLoading = false,
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const isFirstMount = useRef(true);

  // Derive debounced value locally
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Sync local value when external value changes (e.g., "clear all filters")
  useEffect(() => {
    if (value !== localValue && !isFirstMount.current) {
      setLocalValue(value);
    }
    isFirstMount.current = false;
  }, [value]);

  // Debounce: update debounced value after delay
  useEffect(() => {
    if (!debounceMs) return;
    const timer = setTimeout(() => {
      setDebouncedValue(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  // Notify parent when debounced value changes
  const prevDebounced = useRef(value);
  useEffect(() => {
    if (debouncedValue !== prevDebounced.current) {
      prevDebounced.current = debouncedValue;
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      if (!debounceMs) {
        onChange(e.target.value);
      }
    },
    [debounceMs, onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className={cn("relative group", className)}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        )}
      </div>

      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "w-full pl-12 pr-10 py-3.5 bg-card border border-border rounded-2xl",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "transition-all text-foreground placeholder:text-muted-foreground/60",
          "text-base"
        )}
      />

      {localValue && (
        <button
          onClick={handleClear}
          title="Clear search"
          aria-label="Clear search"
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "p-1.5 rounded-full hover:bg-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/30"
          )}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}