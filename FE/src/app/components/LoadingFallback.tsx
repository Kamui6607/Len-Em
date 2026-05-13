import { cn } from "./ui/utils";

interface LoadingFallbackProps {
  fullPage?: boolean;
  message?: string;
}

export function LoadingFallback({
  fullPage = false,
  message = "Loading...",
}: LoadingFallbackProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullPage ? "min-h-screen" : "min-h-[60vh]"
      )}
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}