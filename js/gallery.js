/**
 * The Alpha Team - Gallery & Lightbox Module
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* --------------------------------------------------------------------------
     1. Gallery Category Filtering & Lightbox Binding (Rebindable for Firestore)
     -------------------------------------------------------------------------- */
  window.rebindGalleryListeners = function() {
    const galleryFilterBtns = document.querySelectorAll('.gallery-filter-bar .filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryFilterBtns.forEach(btn => {
      btn.onclick = () => {
        galleryFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const selectedCategory = btn.getAttribute('data-category');
        const currentItems = document.querySelectorAll('.gallery-item');

        currentItems.forEach(item => {
          const itemCategory = item.getAttribute('data-category');
          if (selectedCategory === 'all' || itemCategory === selectedCategory) {
            item.style.display = 'block';
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            }, 20);
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
              item.style.display = 'none';
            }, 250);
          }
        });
      };
    });

    galleryItems.forEach(item => {
      item.onclick = () => openLightbox(item);
    });
  };

  /* --------------------------------------------------------------------------
     2. Lightbox Controller
     -------------------------------------------------------------------------- */
  const lightboxModal = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let currentGalleryIndex = 0;
  let activeItems = [];

  function getVisibleGalleryItems() {
    const currentItems = document.querySelectorAll('.gallery-item');
    return Array.from(currentItems).filter(item => window.getComputedStyle(item).display !== 'none');
  }

  function updateLightbox(index) {
    activeItems = getVisibleGalleryItems();
    if (activeItems.length === 0) return;

    if (index < 0) index = activeItems.length - 1;
    if (index >= activeItems.length) index = 0;

    currentGalleryIndex = index;
    const currentItem = activeItems[currentGalleryIndex];
    const imgElement = currentItem.querySelector('.gallery-img');
    const titleElement = currentItem.querySelector('.gallery-title');
    const tagElement = currentItem.querySelector('.gallery-tag');

    const fullSrc = imgElement.getAttribute('data-full') || imgElement.src;
    const title = titleElement ? titleElement.textContent : '';
    const tag = tagElement ? tagElement.textContent : '';

    lightboxImg.style.opacity = '0.4';
    lightboxImg.src = fullSrc;
    lightboxImg.alt = title;

    lightboxImg.onload = () => {
      lightboxImg.style.opacity = '1';
    };

    if (lightboxCaption) {
      lightboxCaption.innerHTML = `<strong>${title}</strong> &bull; <span style="color: var(--color-accent);">${tag}</span>`;
    }
  }

  function openLightbox(item) {
    activeItems = getVisibleGalleryItems();
    currentGalleryIndex = activeItems.indexOf(item);
    if (currentGalleryIndex === -1) currentGalleryIndex = 0;

    updateLightbox(currentGalleryIndex);
    if (lightboxModal) {
      lightboxModal.classList.add('is-open');
      document.body.classList.add('modal-open');
    }
  }

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove('is-open');
      document.body.classList.remove('modal-open');
    }
  }

  // Initial binding
  window.rebindGalleryListeners();

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', e => {
      e.stopPropagation();
      updateLightbox(currentGalleryIndex - 1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', e => {
      e.stopPropagation();
      updateLightbox(currentGalleryIndex + 1);
    });
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', e => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', e => {
    if (!lightboxModal.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      updateLightbox(currentGalleryIndex - 1);
    } else if (e.key === 'ArrowRight') {
      updateLightbox(currentGalleryIndex + 1);
    }
  });
});
