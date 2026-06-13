/**
 * Custom Cursor — Masecor Web
 *
 * Premium dot cursor that follows the mouse with a subtle lerp delay.
 * Expands on interactive elements (links, buttons).
 * Desktop only (≥1024px, no touch devices).
 * Pure overlay — pointer-events: none, zero impact on interactivity.
 * Uses requestAnimationFrame for 60fps smoothness.
 */

function initCustomCursor(): void {
  // Bail on touch devices and small screens
  if (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth < 1024
  ) {
    return;
  }

  // Check reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Create cursor element if it doesn't exist
  let dot = document.querySelector<HTMLElement>('.cursor-dot');
  if (!dot) {
    dot = document.createElement('div');
    dot.classList.add('cursor-dot');
    document.body.appendChild(dot);
  }

  let mouseX = 0;
  let mouseY = 0;
  let dotX = 0;
  let dotY = 0;
  let isVisible = false;
  let rafId: number | null = null;

  // Lerp factor — lower = more delay, higher = more responsive
  const LERP = 0.15;

  function render(): void {
    // Smooth interpolation
    dotX += (mouseX - dotX) * LERP;
    dotY += (mouseY - dotY) * LERP;

    if (dot) {
      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    }

    rafId = requestAnimationFrame(render);
  }

  // Track mouse position
  document.addEventListener(
    'mousemove',
    (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible && dot) {
        dot.classList.add('cursor-dot--visible');
        isVisible = true;
      }
    },
    { passive: true },
  );

  // Hide when mouse leaves window
  document.addEventListener('mouseleave', () => {
    if (dot) {
      dot.classList.remove('cursor-dot--visible');
      isVisible = false;
    }
  });

  document.addEventListener('mouseenter', () => {
    if (dot) {
      dot.classList.add('cursor-dot--visible');
      isVisible = true;
    }
  });

  // Expand on interactive elements
  function setupHoverListeners(): void {
    const interactives = document.querySelectorAll(
      'a, button, [role="button"], input, textarea, select, .product-card, .faq-item summary, .info-card',
    );

    interactives.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        dot?.classList.add('cursor-dot--hover');
      });
      el.addEventListener('mouseleave', () => {
        dot?.classList.remove('cursor-dot--hover');
      });
    });
  }

  setupHoverListeners();

  // Re-setup on Astro page transitions
  document.addEventListener('astro:after-swap', () => {
    setupHoverListeners();
  });

  // Start render loop
  rafId = requestAnimationFrame(render);

  // Cleanup on page unload (good practice)
  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
  });
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomCursor);
} else {
  initCustomCursor();
}

document.addEventListener('astro:after-swap', initCustomCursor);
