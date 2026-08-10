"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TINTS = {
  gold: "border-brand-gold/25 hover:border-brand-gold/40",
  blue: "border-info/25 hover:border-info/40",
  green: "border-success/25 hover:border-success/40",
  red: "border-destructive/25 hover:border-destructive/40",
  neutral: "border-white/10 hover:border-white/20",
} as const;

export function MissionPanel({
  title,
  tint = "neutral",
  live = false,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  tint?: keyof typeof TINTS;
  live?: boolean;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/60 shadow-soft-md backdrop-blur-sm transition-colors duration-300",
        TINTS[tint],
        className
      )}
    >
      {/* HUD corner brackets */}
      <span className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 border-l border-t border-current opacity-25" />
      <span className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 border-r border-t border-current opacity-25" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b border-l border-current opacity-25" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r border-current opacity-25" />

      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {title}
            </span>
            {live && (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-success">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                Live
              </span>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </motion.div>
  );
}
