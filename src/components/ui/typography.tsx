import * as React from "react";
import { cn } from "@/lib/utils";

type Tag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "blockquote";
interface TypeProps extends React.HTMLAttributes<HTMLElement> {
  as?: Tag;
}

export function H1({ className, as: Tag = "h1", ...props }: TypeProps) {
  return (
    <Tag
      className={cn(
        "text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl",
        className
      )}
      {...props}
    />
  );
}

export function H2({ className, as: Tag = "h2", ...props }: TypeProps) {
  return (
    <Tag
      className={cn("text-3xl font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  );
}

export function H3({ className, as: Tag = "h3", ...props }: TypeProps) {
  return (
    <Tag className={cn("text-xl font-semibold leading-snug tracking-tight", className)} {...props} />
  );
}

export function H4({ className, as: Tag = "h4", ...props }: TypeProps) {
  return (
    <Tag className={cn("text-base font-semibold leading-snug", className)} {...props} />
  );
}

export function Lead({ className, ...props }: TypeProps) {
  return (
    <p className={cn("text-lg text-muted-foreground leading-relaxed", className)} {...props} />
  );
}

export function P({ className, ...props }: TypeProps) {
  return <p className={cn("text-sm leading-relaxed text-foreground/90", className)} {...props} />;
}

export function Muted({ className, ...props }: TypeProps) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: TypeProps) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

/** Large tabular-numeral display for KPI figures — Tesla/Apple stat-card style. */
export function Stat({ className, ...props }: TypeProps) {
  return (
    <p
      className={cn(
        "tabular font-mono text-3xl font-semibold tracking-tight md:text-4xl",
        className
      )}
      {...props}
    />
  );
}

export function InlineCode({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        "rounded-md border border-border bg-muted px-[6px] py-[2px] font-mono text-[13px]",
        className
      )}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-secondary px-1.5 font-mono text-[11px] font-medium text-muted-foreground shadow-soft-sm",
        className
      )}
      {...props}
    />
  );
}

export function Blockquote({ className, ...props }: TypeProps) {
  return (
    <blockquote
      className={cn("border-l-2 border-accent/60 pl-4 text-sm italic text-muted-foreground", className)}
      {...props}
    />
  );
}
