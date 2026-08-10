import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border bg-secondary/60 text-muted-foreground",
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        destructive: "border-destructive/25 bg-destructive/10 text-destructive",
        info: "border-info/25 bg-info/10 text-info",
        gold: "border-brand-gold/30 bg-brand-gold/10 text-brand-gold-light",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

const dotColor: Record<string, string> = {
  neutral: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  gold: "bg-brand-gold-light",
};

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  pulse?: boolean;
}

function StatusChip({ className, tone = "neutral", pulse = false, children, ...props }: StatusChipProps) {
  const t = tone ?? "neutral";
  return (
    <span className={cn(chipVariants({ tone }), className)} {...props}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", dotColor[t])} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dotColor[t])} />
      </span>
      {children}
    </span>
  );
}

export { StatusChip, chipVariants };
