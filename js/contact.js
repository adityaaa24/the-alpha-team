/**
 * The Alpha Team - Contact, Application & Newsletter Forms + Toast Manager
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Toast Notification System
     -------------------------------------------------------------------------- */
  function showToast(title, message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    // Trigger reveal transition
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 400);
    }, 4500);
  }

  window.showToast = showToast;

  /* --------------------------------------------------------------------------
     2. Form Validation Helpers
     -------------------------------------------------------------------------- */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setFieldError(input, message) {
    const group = input.closest('.form-group');
    if (group) {
      group.classList.add('has-error');
      let errEl = group.querySelector('.form-error-msg');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'form-error-msg';
        group.appendChild(errEl);
      }
      errEl.textContent = message;
    }
  }

  function clearFieldError(input) {
    const group = input.closest('.form-group');
    if (group) {
      group.classList.remove('has-error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Clear errors when user types
    document.querySelectorAll('.form-control').forEach(input => {
      input.addEventListener('input', () => clearFieldError(input));
      input.addEventListener('change', () => clearFieldError(input));
    });

    /* --------------------------------------------------------------------------
       3. Main Contact Form Submission
       -------------------------------------------------------------------------- */
    const contactForm = document.getElementById('main-contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();

        const nameInput = document.getElementById('contact-name');
        const emailInput = document.getElementById('contact-email');
        const subjectInput = document.getElementById('contact-subject');
        const messageInput = document.getElementById('contact-message');
        const submitBtn = contactForm.querySelector('button[type="submit"]');

        let hasError = false;

        // Name validation
        if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
          setFieldError(nameInput, 'Please enter your full name (at least 2 characters).');
          hasError = true;
        }

        // Email validation
        if (!emailInput.value.trim() || !isValidEmail(emailInput.value.trim())) {
          setFieldError(emailInput, 'Please enter a valid email address.');
          hasError = true;
        }

        // Subject validation
        if (!subjectInput.value) {
          setFieldError(subjectInput, 'Please select what you are inquiring about.');
          hasError = true;
        }

        // Message validation
        if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
          setFieldError(messageInput, 'Please include a message with at least 10 characters.');
          hasError = true;
        }

        if (hasError) return;

        // Button state
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Sending... 🚀`;

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          contactForm.reset();

          showToast(
            'Message Sent! 📬',
            `Thanks ${nameInput.value.trim()}! An Alpha Team team member will reply within 24 hours.`
          );
        }, 800);
      });
    }

    /* --------------------------------------------------------------------------
       4. Join Us Application Form
       -------------------------------------------------------------------------- */
    const joinForm = document.getElementById('join-club-form');
    const joinModal = document.getElementById('join-modal');

    if (joinForm) {
      joinForm.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('join-name');
        const email = document.getElementById('join-email');
        const handle = document.getElementById('join-handle');
        const role = document.getElementById('join-role');
        const reason = document.getElementById('join-reason');
        const submitBtn = joinForm.querySelector('button[type="submit"]');

        let hasError = false;

        if (!name.value.trim()) {
          setFieldError(name, 'Please enter your name.');
          hasError = true;
        }

        if (!email.value.trim() || !isValidEmail(email.value.trim())) {
          setFieldError(email, 'Please provide a valid email.');
          hasError = true;
        }

        if (!handle.value.trim()) {
          setFieldError(handle, 'Please share your primary social handle.');
          hasError = true;
        }

        if (role && (!role.value || role.value === '')) {
          setFieldError(role, 'Please select a role.');
          hasError = true;
        }

        if (reason && !reason.value.trim()) {
          setFieldError(reason, 'Please tell us why you want to join the club.');
          hasError = true;
        }

        if (hasError) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Application...';

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Application';
          joinForm.reset();

          if (joinModal) {
            joinModal.classList.remove('is-open');
            document.body.classList.remove('modal-open');
          }

          showToast(
            'Application Received! 🎉',
            `Welcome, ${name.value.trim()}! We received your application for ${role ? role.value : 'the team'}. Check your email for next steps.`
          );
        }, 1000);
      });
    }

    /* --------------------------------------------------------------------------
       5. Newsletter Signup (Footer)
       -------------------------------------------------------------------------- */
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', e => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email');
        const emailVal = emailInput.value.trim();

        if (!emailVal || !isValidEmail(emailVal)) {
          showToast('Invalid Email', 'Please enter a valid email address to subscribe.', 'error');
          return;
        }

        emailInput.value = '';
        showToast(
          'Subscribed! ⚡',
          'You are now receiving the Alpha Weekly creator round-up and secret drops.'
        );
      });
    }
  });
})();
