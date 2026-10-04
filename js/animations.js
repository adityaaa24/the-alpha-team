/**
 * The Alpha Team - Animations & Interactive Effects
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* --------------------------------------------------------------------------
     0. Apple-Style Product Launch Opening Sequence
     -------------------------------------------------------------------------- */
  const introCurtain = document.getElementById('intro-curtain');
  const introProgress = document.getElementById('intro-progress');
  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function launchAppleIntro() {
    if (!introCurtain) {
      body.classList.remove('intro-active');
      body.classList.add('hero-animated');
      return;
    }

    if (prefersReducedMotion) {
      body.classList.remove('intro-active');
      body.classList.add('hero-animated');
      introCurtain.style.display = 'none';
      introCurtain.setAttribute('aria-hidden', 'true');
      if (!statsCounted) {
        statsCounted = true;
        runCounterAnimation();
      }
      return;
    }

    // 1. Lock scroll during opening presentation
    body.classList.add('intro-active');

    // 2. Start progress bar fill
    setTimeout(() => {
      if (introProgress) {
        introProgress.classList.add('animate-fill');
      }
    }, 200);

    // 3. Apple-style curtain upward lift
    setTimeout(() => {
      introCurtain.classList.add('curtain-lift');
    }, 1100);

    // 4. Staggered hero reveal cascade (blur-to-sharp & upward glide)
    setTimeout(() => {
      body.classList.add('hero-animated');
    }, 1350);

    // 5. Trigger stats counter roll as the stats strip is unveiled
    setTimeout(() => {
      if (!statsCounted) {
        statsCounted = true;
        runCounterAnimation();
      }
    }, 1800);

    // 6. Restore page scroll & cleanup curtain
    setTimeout(() => {
      body.classList.remove('intro-active');
      introCurtain.style.display = 'none';
      introCurtain.setAttribute('aria-hidden', 'true');
    }, 2100);
  }

  // Launch on page load
  launchAppleIntro();

  // Logo click to replay intro for testing/demonstration
  const brandLogo = document.querySelector('.brand');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      if (window.scrollY < 200) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (introCurtain && introProgress) {
          introCurtain.style.display = 'flex';
          introCurtain.classList.remove('curtain-lift');
          introProgress.classList.remove('animate-fill');
          body.classList.remove('hero-animated');
          statsCounted = false;
          setTimeout(launchAppleIntro, 60);
        }
      }
    });
  }

  // Expose replay function globally for convenience
  window.replayIntroAnimation = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (introCurtain && introProgress) {
      introCurtain.style.display = 'flex';
      introCurtain.classList.remove('curtain-lift');
      introProgress.classList.remove('animate-fill');
      body.classList.remove('hero-animated');
      statsCounted = false;
      setTimeout(launchAppleIntro, 60);
    }
  };

  /* --------------------------------------------------------------------------
     1. Scroll Reveal Animations (IntersectionObserver)
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if IntersectionObserver isn't available
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  /* --------------------------------------------------------------------------
     2. Animated Counter for Stats Strip
     -------------------------------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsCounted = false;

  function runCounterAnimation() {
    statNumbers.forEach(stat => {
      // If live stat value already injected from Firestore, do NOT override with demo target
      if (stat.hasAttribute('data-live-val')) {
        stat.textContent = stat.getAttribute('data-live-val');
        return;
      }

      const target = parseFloat(stat.getAttribute('data-target') || '0');
      const prefix = stat.getAttribute('data-prefix') || '';
      const suffix = stat.getAttribute('data-suffix') || '';
      const isDecimal = target % 1 !== 0;
      const duration = 2000; // ms
      const startTime = performance.now();

      function updateNumber(currentTime) {
        if (stat.hasAttribute('data-live-val')) {
          stat.textContent = stat.getAttribute('data-live-val');
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic formula
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = easeOut * target;

        stat.textContent = `${prefix}${isDecimal ? currentVal.toFixed(1) : Math.floor(currentVal)}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          stat.textContent = `${prefix}${isDecimal ? target.toFixed(1) : target}${suffix}`;
        }
      }

      requestAnimationFrame(updateNumber);
    });
  }

  // Global helper for Firestore live updates
  window.applyLiveStats = function(members, events, followers, years) {
    const statElements = document.querySelectorAll('.hero-stats-strip .stat-number');
    if (statElements.length < 4) return;
    const vals = [members, events, followers, years];
    statElements.forEach((el, idx) => {
      const v = vals[idx];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        el.setAttribute('data-live-val', String(v).trim());
        el.textContent = String(v).trim();
      }
    });
  };

  const statsStrip = document.querySelector('.hero-stats-strip');
  if (statsStrip && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !statsCounted) {
            statsCounted = true;
            runCounterAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    statsObserver.observe(statsStrip);
  }

  /* --------------------------------------------------------------------------
     3. Subtle Cursor Glowing Follower in Hero
     -------------------------------------------------------------------------- */
  const cursorGlow = document.querySelector('.cursor-glow');
  const heroSection = document.querySelector('.hero');

  // Only enable on non-touch devices with pointer fine
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (cursorGlow && heroSection && isFinePointer) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isInsideHero = false;

    heroSection.addEventListener('mouseenter', () => {
      isInsideHero = true;
      cursorGlow.style.opacity = '1';
    });

    heroSection.addEventListener('mouseleave', () => {
      isInsideHero = false;
      cursorGlow.style.opacity = '0';
    });

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      // Lerp smoothing (linear interpolation)
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;

      cursorGlow.style.left = `${currentX}px`;
      cursorGlow.style.top = `${currentY}px`;

      requestAnimationFrame(animateCursor);
    }

    requestAnimationFrame(animateCursor);
  }

  /* --------------------------------------------------------------------------
     4. Scroll Down Button Click Handler
     -------------------------------------------------------------------------- */
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      const target = document.querySelector('#about');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
