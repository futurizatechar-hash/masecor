/**
 * Scroll Reveal Animation System — Masecor Web
 *
 * Uses IntersectionObserver for performant scroll-triggered animations.
 * Supports multiple reveal types via data-reveal attribute.
 * GPU-only: transforms + opacity (never layout-triggering properties).
 *
 * Usage:
 *   <div data-reveal>              → default fade-up
 *   <div data-reveal="fade-left">  → slide from left
 *   <div data-reveal="fade-right"> → slide from right
 *   <div data-reveal="scale">      → scale up from 0.92
 *   <div data-reveal="fade">       → pure opacity fade
 *   <div data-reveal="line">       → horizontal line grow
 *   <div data-delay="2">           → 200ms stagger delay
 *   <div data-reveal data-counter="37"> → animated counter
 *   <div data-parallax>            → subtle parallax on scroll (15% speed)
 *   <div data-parallax="slow">     → slower parallax (8% speed)
 */

function initScrollReveal(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');

  if (elements.length === 0) return;

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    elements.forEach((el) => {
      el.classList.add('revealed');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add('revealed');

          // Animated counter
          const counterTarget = el.dataset.counter;
          if (counterTarget) {
            animateCounter(el, parseInt(counterTarget, 10));
          }

          // Remove will-change after animation completes
          const duration = parseFloat(
            getComputedStyle(el).transitionDuration || '1',
          );
          const delay = parseFloat(getComputedStyle(el).transitionDelay || '0');
          setTimeout(
            () => {
              el.style.willChange = 'auto';
            },
            (duration + delay) * 1000 + 100,
          );

          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    },
  );

  elements.forEach((el) => {
    el.style.willChange = 'opacity, transform';
    observer.observe(el);
  });
}

/**
 * Animate a number from 0 to target with easing.
 */
function animateCounter(el: HTMLElement, target: number): void {
  const duration = 2000;
  const start = performance.now();
  const suffix = el.dataset.counterSuffix || '';
  const prefix = el.dataset.counterPrefix || '';

  function update(now: number): void {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quart
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(eased * target);

    el.textContent = `${prefix}${current}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Parallax — Subtle depth on scroll.
 * GPU-only: uses transform: translateY() via requestAnimationFrame.
 * Only activates on desktop (no touch devices).
 */
function initParallax(): void {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) return;

  // Only on desktop — parallax feels bad on touch
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const elements = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (elements.length === 0) return;

  let ticking = false;

  function onScroll(): void {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const elTop = rect.top + scrollY;
          const elHeight = rect.height;
          const viewportH = window.innerHeight;

          // Only apply when element is in or near viewport
          if (
            scrollY + viewportH < elTop - 100 ||
            scrollY > elTop + elHeight + 100
          ) {
            return;
          }

          const speed = el.dataset.parallax === 'slow' ? 0.08 : 0.15;
          const offset = (scrollY - elTop) * speed;

          el.style.transform = `translateY(${offset}px)`;
        });

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initParallax();
  });
} else {
  initScrollReveal();
  initParallax();
}

// Re-initialize on Astro page transitions (View Transitions API)
document.addEventListener('astro:after-swap', () => {
  initScrollReveal();
  initParallax();
});
