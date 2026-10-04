/**
 * The Alpha Team - Theme Manager (Light / Dark Mode)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'alpha_theme_mode';
  const root = document.documentElement;

  // Detect saved preference or system preference
  function getPreferredTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply theme to document
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update ARIA attributes on toggle buttons
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });

    window.dispatchEvent(new CustomEvent('alphaThemeChange', { detail: { theme } }));
  }

  // Toggle theme between light and dark
  function toggleTheme() {
    const currentTheme = root.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  // Initialize
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Bind click listener to all theme toggle buttons
  document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });

    // Listen to system color scheme changes if user hasn't set explicit preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  });

  // Expose global helper if needed
  window.AlphaTheme = {
    toggle: toggleTheme,
    apply: applyTheme,
    current: () => root.getAttribute('data-theme') || 'light'
  };
})();
