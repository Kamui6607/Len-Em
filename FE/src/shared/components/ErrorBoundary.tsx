import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: unknown, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: unknown;
}
/**
 * Error boundary that catches errors thrown while rendering its children
 * (including failures from lazy-loaded modules inside Suspense).
 * Instead of crashing the whole tree, it shows a friendly fallback with a
 * "Retry" button so transient load failures (e.g. a corrupted browser cache
 * returning `ERR_CACHE_READ_FAILURE` on a dynamically imported module) can be
 * recovered from without losing the whole session.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
  }

  /** Tải lại toàn bộ trang khi người dùng bấm "Try Again" (giải quyết lỗi cache/module lỗi thời). */
  private reload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.error !== null) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reload);
      }
      return (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh] px-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
<p className="text-sm font-medium">
  We couldn’t load this page.
</p>

<p className="text-xs text-muted-foreground">
  Please try again. If the issue persists, refreshing your browser may help.
</p>

<button
  type="button"
  onClick={this.reload}
  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
>
  <RefreshCw className="size-4" />
  Try Again
</button>
        </div>
      );
    }
    return this.props.children;
  }
}