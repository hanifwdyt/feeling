import { useEffect, useState } from "react";
import { m, useMotionValue, useSpring, useTransform, useVelocity } from "motion/react";

/**
 * The cotton cursor.
 *
 * A soft blob trailing the real pointer. It swells over anything pressable — as
 * if sinking into the cushion — and stretches along its direction of travel when
 * you flick it.
 *
 * Why a spring and not a CSS transition: a transition only interpolates between
 * two states, so whatever curve you give it, the blob still arrives on schedule.
 * A spring has mass and damping — it lags when you throw it, overshoots a touch,
 * and settles. That gap between "looks soft" and "FEELS soft" is the entire
 * point of this file, and it's why the library earns its place.
 *
 * Constraints, honestly held:
 *   - Never on touch: there is no cursor there to soften, and drawing one would
 *     be decoration pretending to be a feature.
 *   - Never under prefers-reduced-motion.
 *   - The real cursor stays visible. This rides behind it, so nobody loses the
 *     pointer they rely on.
 */
export function CottonCursor() {
  const [enabled, setEnabled] = useState(false);
  const [soft, setSoft] = useState(false);
  const [down, setDown] = useState(false);
  const [gone, setGone] = useState(true);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // Soft spring: low stiffness, real mass. It arrives late and settles — this is
  // the whole feel of the app, expressed once.
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.9 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.9 });

  // Squash from actual velocity — cotton dragged through air deforms.
  const vx = useVelocity(sx);
  const vy = useVelocity(sy);
  const speed = useTransform<number, number>([vx, vy], ([a, b]) =>
    Math.min(Math.hypot(a as number, b as number), 2600)
  );
  const stretch = useTransform(speed, [0, 2600], [1, 1.5]);
  const squish = useTransform(speed, [0, 2600], [1, 0.72]);
  const angle = useTransform<number, number>([vx, vy], ([a, b]) =>
    Math.hypot(a as number, b as number) < 40
      ? 0
      : (Math.atan2(b as number, a as number) * 180) / Math.PI
  );

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;
    setEnabled(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setGone(false);
      const el = e.target as HTMLElement | null;
      setSoft(!!el?.closest?.("[data-soft]"));
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    const out = () => setGone(true);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", dn, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("mouseleave", out);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("mouseleave", out);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) return null;

  return (
    <m.div
      className="cotton"
      aria-hidden="true"
      style={{ x: sx, y: sy, rotate: angle, scaleX: stretch, scaleY: squish }}
      animate={{
        opacity: gone ? 0 : soft ? 0.2 : 0.38,
        // pressing squeezes it; hovering something soft lets it spread out
        scale: down ? 0.68 : soft ? 1.9 : 1,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.6 }}
    />
  );
}
