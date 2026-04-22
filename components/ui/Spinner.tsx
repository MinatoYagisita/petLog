import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin",
        className
      )}
      role="status"
      aria-label="読み込み中"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Spinner />
    </div>
  );
}
