/**
 * Lightweight web glass approximation. Design references are in docs/GLASS-REFERENCES.md.
 * No third-party runtime. CSS owns blur/rim; this function owns moving light and press feedback.
 * Returns a cleanup function: call before replacing a screen, then initialize the new DOM.
 * Supports mouse, touch, keyboard, reduced motion and repeated initialization.
 */
window.initGlassButtons = function initGlassButtons(root = document, options = {}) {
  const { selector = '[data-glass]', intensity = 1 } = options;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const initialized = [];
  const animations = new Set();
  const strength = Math.max(0, Math.min(2, Number(intensity) || 0));
  const elements = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) elements.unshift(root);

  for (const button of elements) {
    if (button.dataset.glassInitialized) continue;
    button.dataset.glassInitialized = 'true';
    initialized.push(button);
    let frame = 0;
    const placeLight = (event) => {
      if (media.matches || button.disabled) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = button.getBoundingClientRect();
        button.style.setProperty('--light-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        button.style.setProperty('--light-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      button.style.removeProperty('--light-x');
      button.style.removeProperty('--light-y');
      button.classList.remove('is-pressed');
    };
    button.addEventListener('pointermove', placeLight, {signal: controller.signal});
    button.addEventListener('pointerdown', (event) => {
      if (button.disabled) return;
      placeLight(event);
      button.classList.add('is-pressed');
    }, {signal: controller.signal});
    for (const event of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) {
      button.addEventListener(event, reset, {signal: controller.signal});
    }
    button.addEventListener('click', () => {
      if (media.matches || button.disabled || !button.animate) return;
      const animation = button.animate([
        {boxShadow: 'inset 0 1px 0 rgba(255,255,255,.65), inset 0 0 24px rgba(255,255,255,.18)'},
        {boxShadow: 'inset 0 1px 0 rgba(255,255,255,.2), inset 0 0 0 rgba(255,255,255,0)'}
      ], {duration: 420 * strength, easing: 'cubic-bezier(.16,1,.3,1)'});
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
    }, {signal: controller.signal});
    initialized[initialized.length - 1]._glassReset = reset;
  }
  return () => {
    controller.abort();
    animations.forEach(animation => animation.cancel());
    initialized.forEach(button => {
      button._glassReset?.();
      delete button._glassReset;
      delete button.dataset.glassInitialized;
    });
  };
};
