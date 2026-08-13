/**
 * Tiny mutable channel between GSAP ScrollTrigger (DOM side) and the R3F
 * render loop (WebGL side) — avoids React re-renders at 60fps.
 * `hero` is 0 at the top of the page and 1 when the pinned hero releases.
 */
export const scrollStore = {
  hero: 0,
};
