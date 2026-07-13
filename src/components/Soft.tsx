import { motion, type HTMLMotionProps } from "motion/react";

/**
 * Soft — the one pressable primitive.
 *
 * Every button, pillow, cushion and card in this app presses through here, so
 * they all share one physics. That consistency is the point: a UI where each
 * control has its own hand-tuned easing feels like a collection of parts, not a
 * single soft object you're touching.
 *
 * These springs are tuned to feel like COTTON, not rubber:
 *   - `damping` is high enough that nothing wobbles. Wobble reads as cheap.
 *   - `stiffness` is low enough that the press has weight — it gives, then
 *     comes back, rather than snapping.
 *
 * Do not add a bouncy overshoot here. On a page someone opens when they're
 * exhausted, a UI that boings at them is a UI that isn't listening.
 */

/** The house spring. One feel, everywhere. */
export const COTTON = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 } as const;
/** A slower one, for large surfaces that should feel heavy (the couch). */
export const COTTON_HEAVY = { type: "spring", stiffness: 260, damping: 28, mass: 1.1 } as const;

type Props = HTMLMotionProps<"button"> & {
  /** How far it sinks when pressed. Large surfaces sink more. */
  sink?: number;
  /** How far it rises on hover. 0 disables the lift. */
  lift?: number;
  heavy?: boolean;
};

export function Soft({ sink = 2, lift = 2, heavy = false, children, ...rest }: Props) {
  return (
    <motion.button
      data-soft
      whileHover={lift ? { y: -lift } : undefined}
      whileTap={{ y: sink, scale: 0.985 }}
      transition={heavy ? COTTON_HEAVY : COTTON}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
