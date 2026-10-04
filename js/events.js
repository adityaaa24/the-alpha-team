/**
 * The Alpha Team - Events Module
 * Live countdown timer, category filtering, and event details modal
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Live Featured Event Countdown Timer
     -------------------------------------------------------------------------- */
  const daysEl = document.getElementById('count-days');
  const hoursEl = document.getElementById('count-hours');
  const minutesEl = document.getElementById('count-minutes');
  const secondsEl = document.getElementById('count-seconds');

  if (daysEl && hoursEl && minutesEl && secondsEl) {
    // Set target date 18 days and 14 hours from now for dynamic realism
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 18);
    targetDate.setHours(targetDate.getHours() + 14);
    targetDate.setMinutes(targetDate.getMinutes() + 35);

    function updateCountdown() {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = days < 10 ? `0${days}` : days;
      hoursEl.textContent = hours < 10 ? `0${hours}` : hours;
      minutesEl.textContent = minutes < 10 ? `0${minutes}` : minutes;
      secondsEl.textContent = seconds < 10 ? `0${seconds}` : seconds;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* --------------------------------------------------------------------------
     2. Event Category Filtering & Modal Triggers (Rebindable for Firestore)
     -------------------------------------------------------------------------- */
  window.rebindEventsListeners = function() {
    const eventFilterBtns = document.querySelectorAll('.events-filter-bar .filter-btn');
    const eventCards = document.querySelectorAll('.event-card');
    const learnMoreBtns = document.querySelectorAll('.event-learn-more-btn');
    const eventModal = document.getElementById('event-details-modal');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventModalDate = document.getElementById('event-modal-date');
    const eventModalDesc = document.getElementById('event-modal-desc');
    const eventModalTag = document.getElementById('event-modal-tag');
    const eventModalSpots = document.getElementById('event-modal-spots');

    // Filtering
    eventFilterBtns.forEach(btn => {
      // Remove old clone or attach cleanly
      btn.onclick = () => {
        eventFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const selectedCategory = btn.getAttribute('data-category');
        const currentCards = document.querySelectorAll('.event-card');

        currentCards.forEach(card => {
          const cardCategory = card.getAttribute('data-category');
          if (selectedCategory === 'all' || cardCategory === selectedCategory) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 20);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(15px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 250);
          }
        });
      };
    });

    // Learn More modal openers
    learnMoreBtns.forEach(btn => {
      btn.onclick = () => {
        const title = btn.getAttribute('data-title') || 'Club Event';
        const date = btn.getAttribute('data-date') || 'Upcoming';
        const desc = btn.getAttribute('data-desc') || 'Join our upcoming creator workshop!';
        const tag = btn.getAttribute('data-tag') || 'Event';
        const spots = btn.getAttribute('data-spots') || 'Limited Spots';

        if (eventModalTitle) eventModalTitle.textContent = title;
        if (eventModalDate) eventModalDate.textContent = date;
        if (eventModalDesc) eventModalDesc.textContent = desc;
        if (eventModalTag) eventModalTag.textContent = tag;
        if (eventModalSpots) eventModalSpots.textContent = spots;

        if (eventModal) {
          eventModal.classList.add('is-open');
          document.body.classList.add('modal-open');
        }
      };
    });
  };

  // Initial binding
  window.rebindEventsListeners();

  const eventModal = document.getElementById('event-details-modal');
  const eventModalClose = document.getElementById('event-modal-close');

  if (eventModalClose && eventModal) {
    eventModalClose.addEventListener('click', () => {
      eventModal.classList.remove('is-open');
      document.body.classList.remove('modal-open');
    });

    eventModal.addEventListener('click', e => {
      if (e.target === eventModal) {
        eventModal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
      }
    });

    // RSVP button in modal
    const rsvpBtn = document.getElementById('event-rsvp-submit-btn');
    if (rsvpBtn) {
      rsvpBtn.addEventListener('click', () => {
        rsvpBtn.textContent = 'Spot Reserved! 🎉';
        rsvpBtn.style.background = 'var(--color-secondary)';
        if (window.showToast) {
          window.showToast('Registration Confirmed', 'You have been registered for this event! Check your email for details.', 'success');
        }
        setTimeout(() => {
          eventModal.classList.remove('is-open');
          document.body.classList.remove('modal-open');
          setTimeout(() => {
            rsvpBtn.textContent = 'Reserve My Spot (Free)';
            rsvpBtn.style.background = '';
          }, 500);
        }, 1200);
      });
    }
  }
});
