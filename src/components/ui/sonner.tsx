"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-xl border border-white/10 bg-popover/95 text-popover-foreground shadow-soft-lg backdrop-blur-xl gap-3 px-4 py-3.5",
          title: "text-sm font-semibold",
          description: "text-xs text-muted-foreground",
          actionButton:
            "rounded-md bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1.5",
          cancelButton:
            "rounded-md bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1.5",
          success: "!border-success/30",
          error: "!border-destructive/30",
          warning: "!border-warning/30",
          info: "!border-info/30",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
