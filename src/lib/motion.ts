import type { Variants, Transition, Easing } from "framer-motion";

export const EASE_OUT: Easing = [0.16, 1, 0.3, 1]; // "expo-out" — Apple/Linear signature ease
export const EASE_SPRING: Transition = { type: "spring", stiffness: 380, damping: 32 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

/** Page-level transition — used by <PageTransition> to wrap route content. */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE_OUT } },
};

/** Spring lift used on hoverable cards/buttons for the "soft 3D" feel. */
export const hoverLift = {
  rest: { y: 0, transition: EASE_SPRING },
  hover: { y: -3, transition: EASE_SPRING },
  tap: { y: 0, scale: 0.98, transition: { duration: 0.12 } },
};
