import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export function Card({ className, padding = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-[12px] shadow-sm border border-border",
        padding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
