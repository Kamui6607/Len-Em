import { useState, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "../../app/components/ui/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  /** Minimum characters before search fires */
  minChars?: number;
  /** Show "press enter to search" hint */
  showHint?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  isLoading = false,
  className,
  minChars = 2,
  showHint = false,
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      {/* Search icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <Search
            className={cn(
              "w-5 h-5 transition-colors duration-200",
              focused ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={placeholder}
        minLength={minChars}
        className={cn(
          "w-full pl-12 pr-12 py-3.5 bg-card border border-border rounded-2xl",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "transition-all duration-200 text-foreground placeholder:text-muted-foreground/60",
          "text-base"
        )}
      />

      {/* Clear button — show when there's text */}
      {value && (
        <button
          onClick={handleClear}
          title="Clear search"
          aria-label="Clear search"
          className={cn(
            "absolute right-3.5 top-1/2 -translate-y-1/2",
            "p-1.5 rounded-full hover:bg-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/30"
          )}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Bottom hint */}
      {showHint && focused && value.length > 0 && value.length < minChars && (
        <p className="absolute -bottom-5 left-4 text-[10px] text-muted-foreground">
          Type at least {minChars} characters to search
        </p>
      )}
    </div>
  );
}