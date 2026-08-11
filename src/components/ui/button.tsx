import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Linear-style high-contrast primary
        default:
          "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-soft-md hover:from-blue-500 hover:to-blue-600 hover:shadow-soft-lg hover:-translate-y-px",
        // Legacy name retained for compatibility; visual is approved blue-green.
        gold:
          "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-glow-gold hover:from-emerald-500 hover:to-blue-500 hover:-translate-y-px",
        glass:
          "glass text-foreground hover:bg-white/[0.08] hover:border-white/20 shadow-soft-sm",
        outline:
          "border border-input bg-transparent hover:bg-secondary/60 hover:border-foreground/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft-sm hover:bg-secondary/70",
        ghost: "hover:bg-secondary/60",
        link: "text-blue-600 underline-offset-4 hover:text-emerald-600 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-glow-red hover:brightness-[1.05]",
        success:
          "bg-success text-success-foreground shadow-glow-green hover:brightness-[1.05]",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-11 px-6 text-[15px]",
        xl: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
