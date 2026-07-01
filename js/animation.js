/**
 * animation.js — Orchestrated animation helpers (ripple effects, page transitions,
 * loading sequences) that don't belong to a single component.
 */

/**
 * Create a ripple effect at the click position within an element.
 */
export function createRipple(event, element) {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  Object.assign(ripple.style, {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}px`,
    top: `${y}px`,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
    pointerEvents: 'none',
    animation: 'ripple 0.6s ease-out forwards'
  });

  element.style.position = element.style.position || 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  ripple.addEventListener('animationend', () => ripple.remove());
}

/**
 * Attach ripple effect to all elements matching a selector.
 */
export function attachRippleEffect(selector = '.btn') {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('click', (e) => createRipple(e, el));
  });
}

/**
 * Show a full-page loading overlay with skeleton, then fade out.
 */
export function showLoadingSequence(containerId, durationMs = 600) {
  return new Promise(resolve => {
    const container = document.getElementById(containerId);
    if (!container) return resolve();

    container.classList.add('anim-fade-in');
    setTimeout(resolve, durationMs);
  });
}

/**
 * Animate a numeric counter from 0 to target value.
 */
export function animateCounter(element, targetValue, duration = 1200) {
  const start = 0;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const current = Math.floor(start + (targetValue - start) * eased);
    element.textContent = current.toLocaleString('en-US');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue.toLocaleString('en-US');
    }
  }

  requestAnimationFrame(update);
}

/**
 * Apply a staggered reveal class to a NodeList of elements.
 */
export function staggerReveal(elements, baseDelay = 60) {
  elements.forEach((el, i) => {
    el.style.animationDelay = `${i * baseDelay}ms`;
    el.classList.add('anim-fade-up');
  });
}
