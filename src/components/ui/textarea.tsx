import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[88px] w-full rounded-lg border border-input bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground shadow-inner shadow-black/10 outline-none transition-all duration-200 placeholder:text-muted-foreground/70",
        "focus:border-ring/70 focus:bg-secondary/60 focus:ring-4 focus:ring-ring/15",
        "disabled:cursor-not-allowed disabled:opacity-40",
        invalid && "border-destructive/60 focus:border-destructive focus:ring-destructive/15",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
