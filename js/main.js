/**
 * The Alpha Team - Main Controller
 * Navbar scroll transitions, active scroll spy, mobile drawer, modal triggers
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Sticky Navbar Glassmorphism on Scroll
     -------------------------------------------------------------------------- */
  const navbar = document.querySelector('.navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  /* --------------------------------------------------------------------------
     2. Mobile Drawer Navigation
     -------------------------------------------------------------------------- */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileBackdrop = document.querySelector('.mobile-nav-backdrop');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  function openMobileNav() {
    hamburger.classList.add('is-active');
    mobileNav.classList.add('is-open');
    mobileBackdrop.classList.add('is-open');
    document.body.classList.add('modal-open');
  }

  function closeMobileNav() {
    hamburger.classList.remove('is-active');
    mobileNav.classList.remove('is-open');
    mobileBackdrop.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  if (hamburger && mobileNav && mobileBackdrop) {
    hamburger.addEventListener('click', () => {
      if (mobileNav.classList.contains('is-open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    mobileBackdrop.addEventListener('click', closeMobileNav);

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });
  }

  /* --------------------------------------------------------------------------
     3. Active Nav Link Scroll Spy
     -------------------------------------------------------------------------- */
  const sections = document.querySelectorAll('section[id]');
  const desktopNavLinks = document.querySelectorAll('.nav-menu .nav-link');

  function updateActiveNavLink() {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        desktopNavLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  /* --------------------------------------------------------------------------
     4. "Join Us" Modal Opening & Closing
     -------------------------------------------------------------------------- */
  const joinModal = document.getElementById('join-modal');
  const joinModalClose = document.getElementById('join-modal-close');
  const joinButtons = document.querySelectorAll('.open-join-modal-btn');

  if (joinModal) {
    joinButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        joinModal.classList.add('is-open');
        document.body.classList.add('modal-open');
        // If mobile nav is open, close it
        if (mobileNav && mobileNav.classList.contains('is-open')) {
          closeMobileNav();
        }
      });
    });

    if (joinModalClose) {
      joinModalClose.addEventListener('click', () => {
        joinModal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
      });
    }

    joinModal.addEventListener('click', e => {
      if (e.target === joinModal) {
        joinModal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && joinModal.classList.contains('is-open')) {
        joinModal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Back to Top Button
     -------------------------------------------------------------------------- */
  const backToTopBtn = document.querySelector('.back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
