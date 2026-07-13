import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, domAnimation } from "motion/react";
import App from "./App";
import "./styles/app.css";

/**
 * LazyMotion + domAnimation: bundle only the DOM animation features we actually
 * use (springs, whileHover/whileTap, AnimatePresence). The full `motion` import
 * pulls in layout projection, drag, SVG path morphing and 3D — none of which
 * this app touches — and that was most of the JS weight.
 *
 * `strict` makes it a build error to reach for `motion.*` instead of `m.*`,
 * which is the only thing stopping the whole library sneaking back in later.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </StrictMode>
);
