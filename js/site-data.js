/**
 * The Alpha Team - Public Site Live Firestore Hydration
 * Asynchronously loads dynamic content from Firestore into index.html
 * If Firestore has no records or fails, gracefully falls back to existing HTML markup
 */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function initHydration() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      hydrateSiteFromFirestore();
    });
  } else {
    // DOM is already ready (module loaded after HTML parsing)
    hydrateSiteFromFirestore();
  }

  // Also hydrate when auth state resolves (attaches logged-in session permissions)
  try {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[The Alpha Team] Admin session detected (" + user.email + "). Syncing live data...");
        hydrateSiteFromFirestore();
      }
    });
  } catch (e) {
    // Ignore auth observer error
  }
}

initHydration();

async function hydrateSiteFromFirestore() {
  console.log("[The Alpha Team] Fetching live data from Cloud Firestore...");
  try {
    const results = await Promise.allSettled([
      hydrateAbout(),
      hydrateTeam(),
      hydrateEvents(),
      hydrateGallery(),
      hydrateContact()
    ]);
    console.log("[The Alpha Team] Firestore hydration finished:", results);
  } catch (err) {
    console.warn("[The Alpha Team] Firestore live hydration notice (falling back to static content):", err);
  }
}

/* --------------------------------------------------------------------------
   1. Hydrate About Section & Stats Metrics
   -------------------------------------------------------------------------- */
async function hydrateAbout() {
  try {
    const snap = await getDoc(doc(db, "siteContent", "about"));
    if (!snap.exists()) return;
    const data = snap.data();
    console.log("[The Alpha Team] Hydrated About section from Firestore:", data);

    // 1. Story heading and paragraphs
    const headingEl = document.querySelector(".about-text-content h3");
    const paragraphs = document.querySelectorAll(".about-text-content p");
    if (headingEl && data.heading) headingEl.textContent = data.heading;
    if (paragraphs[0] && data.p1) paragraphs[0].textContent = data.p1;
    if (paragraphs[1] && data.p2) paragraphs[1].textContent = data.p2;

    // 2. Stats Strip Targets & Custom Live Numbers
    if (typeof window.applyLiveStats === "function") {
      window.applyLiveStats(data.statMembers, data.statEvents, data.statFollowers, data.statYears);
    } else {
      const statElements = document.querySelectorAll(".hero-stats-strip .stat-number");
      if (statElements.length >= 4) {
        if (data.statMembers) {
          statElements[0].setAttribute("data-live-val", data.statMembers);
          statElements[0].textContent = data.statMembers;
        }
        if (data.statEvents) {
          statElements[1].setAttribute("data-live-val", data.statEvents);
          statElements[1].textContent = data.statEvents;
        }
        if (data.statFollowers) {
          statElements[2].setAttribute("data-live-val", data.statFollowers);
          statElements[2].textContent = data.statFollowers;
        }
        if (data.statYears) {
          statElements[3].setAttribute("data-live-val", data.statYears);
          statElements[3].textContent = data.statYears;
        }
      }
    }
  } catch (e) {
    if (e.code === "permission-denied") {
      console.error("[The Alpha Team Firestore] Permission Denied: Make sure Cloud Firestore security rules are published in Firebase Console.", e);
    } else {
      console.warn("About hydration skipped:", e.message);
    }
  }
}

/* --------------------------------------------------------------------------
   2. Hydrate Team Members
   -------------------------------------------------------------------------- */
async function hydrateTeam() {
  try {
    const querySnapshot = await getDocs(collection(db, "team"));
    if (querySnapshot.empty) return; // Keep existing static members as fallback

    const teamGrid = document.querySelector(".team-grid");
    if (!teamGrid) return;

    const members = [];
    querySnapshot.forEach(docSnap => {
      members.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort by order or Club Head flag
    members.sort((a, b) => {
      const aHead = a.isHead || a.order === 1 || a.role?.toLowerCase().includes("head") || a.role?.toLowerCase().includes("president");
      const bHead = b.isHead || b.order === 1 || b.role?.toLowerCase().includes("head") || b.role?.toLowerCase().includes("president");
      if (aHead && !bHead) return -1;
      if (!aHead && bHead) return 1;
      return (a.order || 99) - (b.order || 99);
    });

    console.log(`[The Alpha Team] Hydrating ${members.length} team members from Firestore.`);

    teamGrid.innerHTML = "";
    members.forEach((m, idx) => {
      const delayClass = `delay-${((idx % 3) + 1) * 100}`;
      const card = document.createElement("div");
      card.className = `team-card reveal is-revealed ${delayClass}`;
      card.innerHTML = `
        <div class="team-image-container">
          <img class="team-photo" src="${escapeHtml(m.photoUrl || 'assets/images/aditya_rawat.jpg')}" alt="${escapeHtml(m.name || 'Creator')}" loading="lazy" style="object-position: center 20%;">
          <div class="team-social-overlay">
            ${m.socials?.instagram ? `
              <a href="${escapeHtml(m.socials.instagram)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            ` : ''}
            ${m.socials?.twitter ? `
              <a href="${escapeHtml(m.socials.twitter)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="Twitter/X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768"></path></svg>
              </a>
            ` : ''}
            ${m.socials?.youtube ? `
              <a href="${escapeHtml(m.socials.youtube)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            ` : ''}
            ${m.socials?.linkedin ? `
              <a href="${escapeHtml(m.socials.linkedin)}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            ` : ''}
          </div>
        </div>
        <div class="team-info">
          <span class="team-role">${escapeHtml(m.role || 'Member')}</span>
          <h3 class="team-name">${escapeHtml(m.name || 'Creator Name')}</h3>
          <p class="team-handle">${escapeHtml(m.handle || '')}</p>
        </div>
      `;
      teamGrid.appendChild(card);
    });
  } catch (e) {
    console.warn("Team hydration skipped:", e.message);
  }
}

/* --------------------------------------------------------------------------
   3. Hydrate Events Section
   -------------------------------------------------------------------------- */
async function hydrateEvents() {
  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    if (querySnapshot.empty) return; // Keep existing static events as fallback

    const eventsGrid = document.querySelector(".events-grid");
    if (!eventsGrid) return;

    const events = [];
    querySnapshot.forEach(docSnap => {
      events.push({ id: docSnap.id, ...docSnap.data() });
    });

    events.sort((a, b) => (a.order || 99) - (b.order || 99));

    eventsGrid.innerHTML = "";
    events.forEach((ev, idx) => {
      const accent = ev.accent || (idx % 3 === 0 ? "accent-coral" : idx % 3 === 1 ? "accent-turquoise" : "accent-yellow");
      const badgeClass = accent === "accent-coral" ? "badge-coral" : accent === "accent-turquoise" ? "badge-turquoise" : "badge-yellow";
      const categoryTag = ev.category === "workshops" ? "Workshop" : ev.category === "meetups" ? "Meetup" : "Challenge";
      const delayClass = `delay-${((idx % 3) + 1) * 100}`;

      const card = document.createElement("div");
      card.className = `event-card ${accent} reveal is-revealed ${delayClass}`;
      card.setAttribute("data-category", ev.category || "workshops");
      card.innerHTML = `
        <div class="event-card-media">
          <img class="event-card-img" src="${escapeHtml(ev.imageUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600')}" alt="${escapeHtml(ev.title || 'Event')}" loading="lazy">
          <div class="event-category-badge">
            <span class="badge ${badgeClass}">${categoryTag}</span>
          </div>
        </div>
        <div class="event-card-body">
          <div class="event-date-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>${escapeHtml(ev.date || 'Upcoming')}</span>
          </div>
          <h4 class="event-title">${escapeHtml(ev.title || 'Event Title')}</h4>
          <p class="event-desc">${escapeHtml(ev.desc || '')}</p>
          <div class="event-card-footer">
            <span class="event-spots">👥 ${escapeHtml(ev.spots || 'Open')}</span>
            <button class="btn btn-outline btn-sm event-learn-more-btn"
              data-title="${escapeHtml(ev.title || '')}"
              data-date="${escapeHtml(ev.date || '')}"
              data-desc="${escapeHtml(ev.modalDesc || ev.desc || '')}"
              data-tag="${categoryTag}"
              data-spots="${escapeHtml(ev.spots || '')}">
              Learn More
            </button>
          </div>
        </div>
      `;
      eventsGrid.appendChild(card);
    });

    // Rebind event card filter triggers and modal listeners
    if (typeof window.rebindEventsListeners === "function") {
      window.rebindEventsListeners();
    }
  } catch (e) {
    console.warn("Events hydration skipped:", e.message);
  }
}

/* --------------------------------------------------------------------------
   4. Hydrate Gallery Section
   -------------------------------------------------------------------------- */
async function hydrateGallery() {
  try {
    const querySnapshot = await getDocs(collection(db, "gallery"));
    if (querySnapshot.empty) return; // Keep existing static gallery as fallback

    const galleryGrid = document.querySelector(".gallery-grid");
    if (!galleryGrid) return;

    const photos = [];
    querySnapshot.forEach(docSnap => {
      photos.push({ id: docSnap.id, ...docSnap.data() });
    });

    photos.sort((a, b) => (a.order || 99) - (b.order || 99));

    galleryGrid.innerHTML = "";
    photos.forEach((item, idx) => {
      const tallClass = item.isTall ? "tall" : "";
      const delayClass = `delay-${((idx % 3) + 1) * 100}`;
      const tagText = item.category === "workshops" ? "Workshops" : item.category === "meetups" ? "Meetups" : "Behind The Scenes";

      const card = document.createElement("div");
      card.className = `gallery-item ${tallClass} reveal is-revealed ${delayClass}`;
      card.setAttribute("data-category", item.category || "workshops");
      card.innerHTML = `
        <img class="gallery-img" src="${escapeHtml(item.imageUrl || '')}" alt="${escapeHtml(item.title || 'Photo')}" loading="lazy">
        <div class="gallery-overlay">
          <span class="gallery-tag">${tagText}</span>
          <div class="gallery-title">${escapeHtml(item.title || '')}</div>
        </div>
      `;
      galleryGrid.appendChild(card);
    });

    // Rebind gallery filter triggers and lightbox listeners
    if (typeof window.rebindGalleryListeners === "function") {
      window.rebindGalleryListeners();
    }
  } catch (e) {
    console.warn("Gallery hydration skipped:", e.message);
  }
}

/* --------------------------------------------------------------------------
   5. Hydrate Contact & Socials
   -------------------------------------------------------------------------- */
async function hydrateContact() {
  try {
    const snap = await getDoc(doc(db, "siteContent", "contact"));
    if (!snap.exists()) return;
    const data = snap.data();

    // Studio Email Card
    const contactCards = document.querySelectorAll(".contact-info-card .contact-card-content");
    if (contactCards[0] && data.email) {
      const p = contactCards[0].querySelector("p");
      if (p) p.textContent = data.email;
    }

    // Studio Location Card
    if (contactCards[1]) {
      const pElements = contactCards[1].querySelectorAll("p");
      if (pElements[0] && data.studioAddress) pElements[0].textContent = data.studioAddress;
      if (pElements[1] && data.studioHours) pElements[1].textContent = data.studioHours;
    }

    // Discord Banner Link
    const discordBtn = document.querySelector(".discord-banner a.discord-btn");
    if (discordBtn && data.discordUrl) {
      discordBtn.href = data.discordUrl;
    }

    // Footer Social Media Links
    const footerSocialBtns = document.querySelectorAll(".footer-social-links .footer-social-btn");
    if (footerSocialBtns.length >= 4 && data.socials) {
      if (data.socials.instagram) footerSocialBtns[0].href = data.socials.instagram;
      if (data.socials.twitter) footerSocialBtns[1].href = data.socials.twitter;
      if (data.socials.youtube) footerSocialBtns[2].href = data.socials.youtube;
    }
  } catch (e) {
    console.warn("Contact hydration skipped:", e.message);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
