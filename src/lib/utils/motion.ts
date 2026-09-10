/**
 * Motion preferences.
 *
 * The CSS in global.css honours `prefers-reduced-motion` for declarative
 * animations and transitions, but a media query cannot reach a scroll started
 * from JavaScript: `behavior: 'smooth'` animates regardless. For a reader who
 * has asked for reduced motion — often because movement triggers nausea or
 * vestibular symptoms — a full-page smooth scroll is exactly the thing the
 * preference exists to prevent.
 */

/**
 * True when the user has asked the OS to reduce motion.
 *
 * Returns false during SSR, where there is no window to ask and no animation
 * to suppress.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The scroll behaviour to use, respecting the user's stated preference.
 *
 * Read at call time rather than cached: the preference can change while the
 * page is open.
 */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}
