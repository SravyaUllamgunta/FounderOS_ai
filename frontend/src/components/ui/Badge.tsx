import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground": variant === "secondary",
          "text-foreground border-border": variant === "outline",
          "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20": variant === "success",
          "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20": variant === "warning",
          "border-transparent bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20": variant === "error",
          "border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
