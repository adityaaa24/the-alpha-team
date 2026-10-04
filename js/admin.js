/**
 * The Alpha Team - Admin Dashboard Controller
 * Firebase Authentication & Firestore Realtime Content Management
 */

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("admin-login-form");
const loginAlert = document.getElementById("login-alert");
const loginSubmitBtn = document.getElementById("login-submit-btn");
const logoutBtn = document.getElementById("admin-logout-btn");
const userEmailSpan = document.getElementById("admin-user-email");
const toastContainer = document.getElementById("admin-toast-container");

// Modals
const teamModal = document.getElementById("team-modal");
const eventModal = document.getElementById("event-modal");
const galleryModal = document.getElementById("gallery-modal");
const deleteModal = document.getElementById("delete-modal");

// State for deletion confirmation
let pendingDeleteAction = null;

/* --------------------------------------------------------------------------
   1. Toast Notifications Utility
   -------------------------------------------------------------------------- */
export function showToast(message, type = "success") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <span>${type === "success" ? "✓" : "⚠️"}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(15px)";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* --------------------------------------------------------------------------
   2. Authentication State Observer
   -------------------------------------------------------------------------- */
onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in -> show dashboard
    loginView.style.display = "none";
    dashboardView.style.display = "flex";
    if (userEmailSpan) userEmailSpan.textContent = user.email || "Admin";

    // Load content across all tabs
    loadAllDashboardData();
  } else {
    // User is signed out -> show login
    loginView.style.display = "flex";
    dashboardView.style.display = "none";
  }
});

// Check for explicit ?logout=true in URL to allow instant logout if requested
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("logout") === "true") {
  signOut(auth).then(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }).catch(err => console.error("URL signout error:", err));
}

/* --------------------------------------------------------------------------
   3. Sign In Form Handler
   -------------------------------------------------------------------------- */
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showLoginAlert("Please enter both email and password.", "error");
      return;
    }

    setButtonLoading(loginSubmitBtn, true);
    hideLoginAlert();

    try {
      const rememberMe = document.getElementById("login-remember-me")?.checked;
      const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceMode);
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Signed in successfully!");
    } catch (err) {
      console.error("Login failed:", err);
      let msg = "Invalid login credentials. Please check your email and password.";
      if (err.code === "auth/too-many-requests") {
        msg = "Too many failed login attempts. Please wait a few minutes.";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please verify your credentials in Firebase.";
      }
      showLoginAlert(msg, "error");
    } finally {
      setButtonLoading(loginSubmitBtn, false);
    }
  });
}

function showLoginAlert(msg, type) {
  if (!loginAlert) return;
  loginAlert.textContent = msg;
  loginAlert.className = `admin-alert ${type}`;
  loginAlert.style.display = "block";
}

function hideLoginAlert() {
  if (!loginAlert) return;
  loginAlert.style.display = "none";
}

// Forgot Password Handler
const forgotPasswordBtn = document.getElementById("forgot-password-btn");
if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener("click", async () => {
    const emailInput = document.getElementById("login-email");
    const email = emailInput?.value.trim() || "adityarawatpvt@gmail.com";

    if (!email) {
      showLoginAlert("Please enter your admin email first.", "error");
      return;
    }

    try {
      showLoginAlert("Sending password reset email...", "info");
      await sendPasswordResetEmail(auth, email);
      showLoginAlert(`Password reset link sent to ${email}! Please check your email inbox (and Spam folder) to set a new password.`, "success");
      showToast("Reset email sent! Check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      let msg = "Failed to send reset email. " + (err.message || "");
      if (err.code === "auth/user-not-found") {
        msg = "No admin account found with this email. Please check your email address.";
      }
      showLoginAlert(msg, "error");
    }
  });
}

/* --------------------------------------------------------------------------
   4. Sign Out Handler
   -------------------------------------------------------------------------- */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showToast("Signed out successfully.");
    } catch (err) {
      console.error("Sign out error:", err);
      showToast("Failed to sign out.", "error");
    }
  });
}

/* --------------------------------------------------------------------------
   5. Tab Navigation Switching
   -------------------------------------------------------------------------- */
const tabButtons = document.querySelectorAll(".admin-tab-btn");
const tabPanels = document.querySelectorAll(".admin-tab-panel");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    const targetTab = btn.getAttribute("data-tab");
    const targetPanel = document.getElementById(`tab-${targetTab}`);
    if (targetPanel) targetPanel.classList.add("active");
  });
});

/* --------------------------------------------------------------------------
   6. Data Loader Helper
   -------------------------------------------------------------------------- */
function loadAllDashboardData() {
  loadAbout();
  loadTeam();
  loadEvents();
  loadGallery();
  loadContact();
}

function setButtonLoading(btn, isLoading, loadingText = "Saving...") {
  if (!btn) return;
  btn.disabled = isLoading;
  const textSpan = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".admin-spinner");
  if (textSpan) {
    if (isLoading) {
      btn.dataset.originalText = textSpan.textContent;
      textSpan.textContent = loadingText;
    } else {
      textSpan.textContent = btn.dataset.originalText || "Save";
    }
  }
  if (spinner) {
    spinner.style.display = isLoading ? "inline-block" : "none";
  }
}

/* --------------------------------------------------------------------------
   7. About Section & Metrics Management
   -------------------------------------------------------------------------- */
const saveAboutBtn = document.getElementById("save-about-btn");

async function loadAbout() {
  try {
    const docRef = doc(db, "siteContent", "about");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (document.getElementById("about-heading")) document.getElementById("about-heading").value = data.heading || "";
      if (document.getElementById("about-p1")) document.getElementById("about-p1").value = data.p1 || "";
      if (document.getElementById("about-p2")) document.getElementById("about-p2").value = data.p2 || "";
      if (document.getElementById("stat-members")) document.getElementById("stat-members").value = data.statMembers || "";
      if (document.getElementById("stat-events")) document.getElementById("stat-events").value = data.statEvents || "";
      if (document.getElementById("stat-followers")) document.getElementById("stat-followers").value = data.statFollowers || "";
      if (document.getElementById("stat-years")) document.getElementById("stat-years").value = data.statYears || "";
    }
  } catch (err) {
    console.error("Error loading About data:", err);
  }
}

const saveAboutBottomBtn = document.getElementById("save-about-bottom-btn");
const aboutForm = document.getElementById("about-form");

async function handleSaveAbout(btn) {
  const activeBtn = btn || saveAboutBtn || saveAboutBottomBtn;
  if (activeBtn) setButtonLoading(activeBtn, true);
  try {
    const aboutData = {
      heading: document.getElementById("about-heading").value.trim(),
      p1: document.getElementById("about-p1").value.trim(),
      p2: document.getElementById("about-p2").value.trim(),
      statMembers: document.getElementById("stat-members").value.trim(),
      statEvents: document.getElementById("stat-events").value.trim(),
      statFollowers: document.getElementById("stat-followers").value.trim(),
      statYears: document.getElementById("stat-years").value.trim(),
      updatedAt: serverTimestamp()
    };

    console.log("[Admin Panel] Saving About & Stats to Firestore:", aboutData);
    await setDoc(doc(db, "siteContent", "about"), aboutData, { merge: true });
    showToast("About & Stats saved successfully!");
  } catch (err) {
    console.error("Error saving about data:", err);
    showToast("Failed to save: " + (err.message || "Permission Denied"), "error");
  } finally {
    if (activeBtn) setButtonLoading(activeBtn, false);
  }
}

if (saveAboutBtn) {
  saveAboutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleSaveAbout(saveAboutBtn);
  });
}

if (saveAboutBottomBtn) {
  saveAboutBottomBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleSaveAbout(saveAboutBottomBtn);
  });
}

if (aboutForm) {
  aboutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSaveAbout(saveAboutBottomBtn || saveAboutBtn);
  });
}

/* --------------------------------------------------------------------------
   8. Team Members Management
   -------------------------------------------------------------------------- */
const teamListEl = document.getElementById("admin-team-list");
const openAddTeamBtn = document.getElementById("open-add-team-btn");
const teamForm = document.getElementById("team-form");
const teamModalClose = document.getElementById("team-modal-close");
const teamCancelBtn = document.getElementById("team-cancel-btn");
const teamSubmitBtn = document.getElementById("team-submit-btn");

const btnUseAdityaPhoto = document.getElementById("btn-use-aditya-photo");
if (btnUseAdityaPhoto) {
  btnUseAdityaPhoto.addEventListener("click", () => {
    document.getElementById("team-photo").value = "assets/images/aditya_rawat.jpg";
    document.getElementById("team-is-head").checked = true;
  });
}

async function loadTeam() {
  if (!teamListEl) return;
  teamListEl.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--admin-text-muted);">
      <span class="admin-spinner" style="margin-right: 0.5rem;"></span> Loading team members...
    </div>
  `;

  try {
    const querySnapshot = await getDocs(collection(db, "team"));
    teamListEl.innerHTML = "";

    if (querySnapshot.empty) {
      console.log("[Admin Panel] Initializing default team with Club Head Aditya Rawat...");
      for (const m of defaultTeam) {
        await addDoc(collection(db, "team"), { ...m, createdAt: serverTimestamp() });
      }
      return loadTeam();
    }

    const members = [];
    querySnapshot.forEach(docSnap => {
      members.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Ensure Club Head is sorted first
    members.sort((a, b) => {
      const aHead = a.isHead || a.order === 1 || a.role?.toLowerCase().includes("head") || a.role?.toLowerCase().includes("president");
      const bHead = b.isHead || b.order === 1 || b.role?.toLowerCase().includes("head") || b.role?.toLowerCase().includes("president");
      if (aHead && !bHead) return -1;
      if (!aHead && bHead) return 1;
      return (a.order || 99) - (b.order || 99);
    });

    members.forEach(data => {
      const id = data.id;
      const isClubHead = data.isHead || data.order === 1 || data.role?.toLowerCase().includes("head") || data.role?.toLowerCase().includes("president");
      const card = document.createElement("div");
      card.className = `admin-item-card ${isClubHead ? 'is-head' : ''}`;
      if (isClubHead) {
        card.style.borderColor = "rgba(245, 158, 11, 0.6)";
        card.style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.15)";
      }

      card.innerHTML = `
        <div class="admin-item-thumb">
          <img src="${escapeHtml(data.photoUrl || 'assets/images/aditya_rawat.jpg')}" alt="${escapeHtml(data.name || 'Member')}">
          <span class="admin-item-badge ${isClubHead ? 'badge-gold' : ''}" style="${isClubHead ? 'background: rgba(245, 158, 11, 0.25); color: #FBBF24; border-color: rgba(245, 158, 11, 0.5);' : ''}">
            ${isClubHead ? '👑 ' : ''}${escapeHtml(data.role || 'Creator')}
          </span>
        </div>
        <div class="admin-item-body">
          <h4 class="admin-item-title" style="display: flex; align-items: center; justify-content: space-between;">
            <span>${escapeHtml(data.name || 'Member Name')}</span>
            ${isClubHead ? '<span style="font-size: 0.75rem; color: #FBBF24; font-weight: 700;">Club Lead</span>' : ''}
          </h4>
          <div class="admin-item-sub">${escapeHtml(data.handle || '@handle')}</div>
          <div class="admin-item-desc" style="font-size: 0.8rem; color: #94A3B8;">
            ${data.socials?.instagram ? '📸 Instagram ' : ''}
            ${data.socials?.twitter ? '🐦 Twitter/X ' : ''}
            ${data.socials?.youtube ? '▶️ YouTube ' : ''}
            ${data.socials?.linkedin ? '💼 LinkedIn' : ''}
          </div>
          <div class="admin-item-actions">
            <button class="admin-btn ${isClubHead ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm edit-team-btn" data-id="${id}">
              ${isClubHead ? '👑 Edit Club Head' : '✏️ Edit Member'}
            </button>
            <button class="admin-btn admin-btn-danger admin-btn-sm delete-team-btn" data-id="${id}" data-name="${escapeHtml(data.name || 'this member')}">Delete</button>
          </div>
        </div>
      `;
      teamListEl.appendChild(card);
    });

    // Attach edit and delete listeners
    teamListEl.querySelectorAll(".edit-team-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditTeam(btn.getAttribute("data-id")));
    });

    teamListEl.querySelectorAll(".delete-team-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        confirmDelete(`Delete team member "${name}"?`, async () => {
          await deleteDoc(doc(db, "team", id));
          showToast(`Deleted ${name}.`);
          loadTeam();
        });
      });
    });

  } catch (err) {
    console.error("Error loading team members:", err);
    teamListEl.innerHTML = `<div style="grid-column: 1 / -1; color: var(--admin-danger); text-align: center; padding: 2rem;">Failed to load team members from Firestore: ${err.message}</div>`;
  }
}

if (openAddTeamBtn) {
  openAddTeamBtn.addEventListener("click", () => {
    teamForm.reset();
    document.getElementById("team-id").value = "";
    document.getElementById("team-is-head").checked = false;
    document.getElementById("team-modal-title").textContent = "Add Team Member";
    teamModal.classList.add("is-open");
  });
}

async function openEditTeam(id) {
  try {
    const snap = await getDoc(doc(db, "team", id));
    if (!snap.exists()) return;
    const data = snap.data();
    const isHead = Boolean(data.isHead || data.order === 1 || data.role?.toLowerCase().includes("head") || data.role?.toLowerCase().includes("president"));

    document.getElementById("team-id").value = id;
    document.getElementById("team-name").value = data.name || "";
    document.getElementById("team-role").value = data.role || "";
    document.getElementById("team-handle").value = data.handle || "";
    document.getElementById("team-photo").value = data.photoUrl || "";
    document.getElementById("team-is-head").checked = isHead;
    document.getElementById("team-instagram").value = data.socials?.instagram || "";
    document.getElementById("team-twitter").value = data.socials?.twitter || "";
    document.getElementById("team-youtube").value = data.socials?.youtube || "";
    document.getElementById("team-linkedin").value = data.socials?.linkedin || "";
    document.getElementById("team-modal-title").textContent = isHead ? "👑 Edit Club Head" : "✏️ Edit Team Member";
    teamModal.classList.add("is-open");
  } catch (err) {
    console.error("Error fetching team member for edit:", err);
  }
}

if (teamForm) {
  teamForm.addEventListener("submit", async e => {
    e.preventDefault();
    setButtonLoading(teamSubmitBtn, true);

    const id = document.getElementById("team-id").value;
    const isHead = document.getElementById("team-is-head").checked;
    const payload = {
      name: document.getElementById("team-name").value.trim(),
      role: document.getElementById("team-role").value.trim(),
      handle: document.getElementById("team-handle").value.trim(),
      photoUrl: document.getElementById("team-photo").value.trim(),
      isHead: isHead,
      order: isHead ? 1 : 99,
      socials: {
        instagram: document.getElementById("team-instagram").value.trim(),
        twitter: document.getElementById("team-twitter").value.trim(),
        youtube: document.getElementById("team-youtube").value.trim(),
        linkedin: document.getElementById("team-linkedin").value.trim()
      },
      updatedAt: serverTimestamp()
    };

    try {
      if (id) {
        await updateDoc(doc(db, "team", id), payload);
        showToast(isHead ? "Club Head profile updated!" : "Team member updated!");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "team"), payload);
        showToast(isHead ? "Club Head added!" : "New team member added!");
      }
      teamModal.classList.remove("is-open");
      loadTeam();
    } catch (err) {
      console.error("Error saving team member:", err);
      showToast("Failed to save: " + (err.message || "Permission Denied"), "error");
    } finally {
      setButtonLoading(teamSubmitBtn, false);
    }
  });
}

if (teamModalClose) teamModalClose.addEventListener("click", () => teamModal.classList.remove("is-open"));
if (teamCancelBtn) teamCancelBtn.addEventListener("click", () => teamModal.classList.remove("is-open"));

/* --------------------------------------------------------------------------
   9. Events Management
   -------------------------------------------------------------------------- */
const eventsListEl = document.getElementById("admin-events-list");
const openAddEventBtn = document.getElementById("open-add-event-btn");
const eventForm = document.getElementById("event-form");
const eventModalClose = document.getElementById("event-modal-close");
const eventCancelBtn = document.getElementById("event-cancel-btn");
const eventSubmitBtn = document.getElementById("event-submit-btn");

async function loadEvents() {
  if (!eventsListEl) return;
  eventsListEl.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--admin-text-muted);">
      <span class="admin-spinner" style="margin-right: 0.5rem;"></span> Loading events...
    </div>
  `;

  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    eventsListEl.innerHTML = "";

    if (querySnapshot.empty) {
      eventsListEl.innerHTML = `
        <div class="admin-empty-state" style="grid-column: 1 / -1;">
          <div class="admin-empty-icon">📅</div>
          <h3>No Events Found</h3>
          <p>Add your first workshop/meetup or seed demo events from Setup & Tools.</p>
        </div>
      `;
      return;
    }

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const card = document.createElement("div");
      card.className = "admin-item-card";
      card.innerHTML = `
        <div class="admin-item-thumb">
          <img src="${escapeHtml(data.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900')}" alt="${escapeHtml(data.title || 'Event')}">
          <span class="admin-item-badge">${escapeHtml(data.category ? data.category.toUpperCase() : 'EVENT')}</span>
        </div>
        <div class="admin-item-body">
          <div class="admin-item-sub">${escapeHtml(data.date || 'TBD')} &bull; ${escapeHtml(data.spots || 'Open')}</div>
          <h4 class="admin-item-title">${escapeHtml(data.title || 'Event Title')}</h4>
          <p class="admin-item-desc">${escapeHtml(data.desc || '')}</p>
          <div class="admin-item-actions">
            <button class="admin-btn admin-btn-secondary admin-btn-sm edit-event-btn" data-id="${id}">Edit</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm delete-event-btn" data-id="${id}" data-name="${escapeHtml(data.title || 'this event')}">Delete</button>
          </div>
        </div>
      `;
      eventsListEl.appendChild(card);
    });

    eventsListEl.querySelectorAll(".edit-event-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditEvent(btn.getAttribute("data-id")));
    });

    eventsListEl.querySelectorAll(".delete-event-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        confirmDelete(`Delete event "${name}"?`, async () => {
          await deleteDoc(doc(db, "events", id));
          showToast(`Deleted ${name}.`);
          loadEvents();
        });
      });
    });

  } catch (err) {
    console.error("Error loading events:", err);
    eventsListEl.innerHTML = `<div style="grid-column: 1 / -1; color: var(--admin-danger); text-align: center; padding: 2rem;">Failed to load events from Firestore.</div>`;
  }
}

if (openAddEventBtn) {
  openAddEventBtn.addEventListener("click", () => {
    eventForm.reset();
    document.getElementById("event-id").value = "";
    document.getElementById("event-modal-title").textContent = "Add New Event";
    eventModal.classList.add("is-open");
  });
}

async function openEditEvent(id) {
  try {
    const snap = await getDoc(doc(db, "events", id));
    if (!snap.exists()) return;
    const data = snap.data();
    document.getElementById("event-id").value = id;
    document.getElementById("event-title").value = data.title || "";
    document.getElementById("event-category").value = data.category || "workshops";
    document.getElementById("event-date").value = data.date || "";
    document.getElementById("event-spots").value = data.spots || "";
    document.getElementById("event-accent").value = data.accent || "accent-coral";
    document.getElementById("event-image").value = data.imageUrl || "";
    document.getElementById("event-desc").value = data.desc || "";
    document.getElementById("event-modal-desc-input").value = data.modalDesc || "";
    document.getElementById("event-modal-title").textContent = "Edit Event";
    eventModal.classList.add("is-open");
  } catch (err) {
    console.error("Error fetching event for edit:", err);
  }
}

if (eventForm) {
  eventForm.addEventListener("submit", async e => {
    e.preventDefault();
    setButtonLoading(eventSubmitBtn, true);

    const id = document.getElementById("event-id").value;
    const payload = {
      title: document.getElementById("event-title").value.trim(),
      category: document.getElementById("event-category").value,
      date: document.getElementById("event-date").value.trim(),
      spots: document.getElementById("event-spots").value.trim(),
      accent: document.getElementById("event-accent").value,
      imageUrl: document.getElementById("event-image").value.trim(),
      desc: document.getElementById("event-desc").value.trim(),
      modalDesc: document.getElementById("event-modal-desc-input").value.trim(),
      updatedAt: serverTimestamp()
    };

    try {
      if (id) {
        await updateDoc(doc(db, "events", id), payload);
        showToast("Event updated!");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "events"), payload);
        showToast("New event added!");
      }
      eventModal.classList.remove("is-open");
      loadEvents();
    } catch (err) {
      console.error("Error saving event:", err);
      showToast("Failed to save event.", "error");
    } finally {
      setButtonLoading(eventSubmitBtn, false);
    }
  });
}

if (eventModalClose) eventModalClose.addEventListener("click", () => eventModal.classList.remove("is-open"));
if (eventCancelBtn) eventCancelBtn.addEventListener("click", () => eventModal.classList.remove("is-open"));

/* --------------------------------------------------------------------------
   10. Gallery Management
   -------------------------------------------------------------------------- */
const galleryListEl = document.getElementById("admin-gallery-list");
const openAddGalleryBtn = document.getElementById("open-add-gallery-btn");
const galleryForm = document.getElementById("gallery-form");
const galleryModalClose = document.getElementById("gallery-modal-close");
const galleryCancelBtn = document.getElementById("gallery-cancel-btn");
const gallerySubmitBtn = document.getElementById("gallery-submit-btn");

async function loadGallery() {
  if (!galleryListEl) return;
  galleryListEl.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--admin-text-muted);">
      <span class="admin-spinner" style="margin-right: 0.5rem;"></span> Loading gallery photos...
    </div>
  `;

  try {
    const querySnapshot = await getDocs(collection(db, "gallery"));
    galleryListEl.innerHTML = "";

    if (querySnapshot.empty) {
      galleryListEl.innerHTML = `
        <div class="admin-empty-state" style="grid-column: 1 / -1;">
          <div class="admin-empty-icon">🖼️</div>
          <h3>No Photos in Gallery</h3>
          <p>Add photos of creator moments, studio rigs, or seed default images from Setup & Tools.</p>
        </div>
      `;
      return;
    }

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const card = document.createElement("div");
      card.className = "admin-item-card";
      card.innerHTML = `
        <div class="admin-item-thumb">
          <img src="${escapeHtml(data.imageUrl || '')}" alt="${escapeHtml(data.title || 'Photo')}">
          <span class="admin-item-badge">${escapeHtml(data.category ? data.category.toUpperCase() : 'PHOTO')}</span>
        </div>
        <div class="admin-item-body">
          <h4 class="admin-item-title">${escapeHtml(data.title || 'Untitled Photo')}</h4>
          <div class="admin-item-sub">${data.isTall ? 'Tall Card (2 rows)' : 'Standard Card'}</div>
          <div class="admin-item-actions">
            <button class="admin-btn admin-btn-danger admin-btn-sm delete-gallery-btn" data-id="${id}" data-name="${escapeHtml(data.title || 'this photo')}">Delete Photo</button>
          </div>
        </div>
      `;
      galleryListEl.appendChild(card);
    });

    galleryListEl.querySelectorAll(".delete-gallery-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        confirmDelete(`Delete gallery photo "${name}"?`, async () => {
          await deleteDoc(doc(db, "gallery", id));
          showToast(`Deleted ${name}.`);
          loadGallery();
        });
      });
    });

  } catch (err) {
    console.error("Error loading gallery:", err);
    galleryListEl.innerHTML = `<div style="grid-column: 1 / -1; color: var(--admin-danger); text-align: center; padding: 2rem;">Failed to load gallery from Firestore.</div>`;
  }
}

if (openAddGalleryBtn) {
  openAddGalleryBtn.addEventListener("click", () => {
    galleryForm.reset();
    galleryModal.classList.add("is-open");
  });
}

if (galleryForm) {
  galleryForm.addEventListener("submit", async e => {
    e.preventDefault();
    setButtonLoading(gallerySubmitBtn, true);

    const payload = {
      title: document.getElementById("gallery-title").value.trim(),
      category: document.getElementById("gallery-category").value,
      isTall: document.getElementById("gallery-tall").value === "true",
      imageUrl: document.getElementById("gallery-image").value.trim(),
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "gallery"), payload);
      showToast("Photo added to gallery!");
      galleryModal.classList.remove("is-open");
      loadGallery();
    } catch (err) {
      console.error("Error adding gallery photo:", err);
      showToast("Failed to add photo.", "error");
    } finally {
      setButtonLoading(gallerySubmitBtn, false);
    }
  });
}

if (galleryModalClose) galleryModalClose.addEventListener("click", () => galleryModal.classList.remove("is-open"));
if (galleryCancelBtn) galleryCancelBtn.addEventListener("click", () => galleryModal.classList.remove("is-open"));

/* --------------------------------------------------------------------------
   11. Contact Info & Socials Management
   -------------------------------------------------------------------------- */
const saveContactBtn = document.getElementById("save-contact-btn");

async function loadContact() {
  try {
    const docRef = doc(db, "siteContent", "contact");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (document.getElementById("contact-studio-email")) document.getElementById("contact-studio-email").value = data.email || "";
      if (document.getElementById("contact-studio-address")) document.getElementById("contact-studio-address").value = data.studioAddress || "";
      if (document.getElementById("contact-studio-hours")) document.getElementById("contact-studio-hours").value = data.studioHours || "";
      if (document.getElementById("contact-discord-url")) document.getElementById("contact-discord-url").value = data.discordUrl || "";
      if (document.getElementById("social-instagram")) document.getElementById("social-instagram").value = data.socials?.instagram || "";
      if (document.getElementById("social-twitter")) document.getElementById("social-twitter").value = data.socials?.twitter || "";
      if (document.getElementById("social-youtube")) document.getElementById("social-youtube").value = data.socials?.youtube || "";
    }
  } catch (err) {
    console.error("Error loading Contact data:", err);
  }
}

if (saveContactBtn) {
  saveContactBtn.addEventListener("click", async () => {
    setButtonLoading(saveContactBtn, true);
    try {
      const contactData = {
        email: document.getElementById("contact-studio-email").value.trim(),
        studioAddress: document.getElementById("contact-studio-address").value.trim(),
        studioHours: document.getElementById("contact-studio-hours").value.trim(),
        discordUrl: document.getElementById("contact-discord-url").value.trim(),
        socials: {
          instagram: document.getElementById("social-instagram").value.trim(),
          twitter: document.getElementById("social-twitter").value.trim(),
          youtube: document.getElementById("social-youtube").value.trim()
        },
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "siteContent", "contact"), contactData, { merge: true });
      showToast("Contact details saved successfully!");
    } catch (err) {
      console.error("Error saving contact data:", err);
      showToast("Failed to save contact info.", "error");
    } finally {
      setButtonLoading(saveContactBtn, false);
    }
  });
}

/* --------------------------------------------------------------------------
   12. Delete Confirmation Modal
   -------------------------------------------------------------------------- */
const deleteModalMsg = document.getElementById("delete-modal-msg");
const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
const deleteCancelBtn = document.getElementById("delete-cancel-btn");

function confirmDelete(message, onConfirm) {
  if (deleteModalMsg) deleteModalMsg.textContent = message;
  pendingDeleteAction = onConfirm;
  deleteModal.classList.add("is-open");
}

if (deleteCancelBtn) {
  deleteCancelBtn.addEventListener("click", () => {
    deleteModal.classList.remove("is-open");
    pendingDeleteAction = null;
  });
}

if (deleteConfirmBtn) {
  deleteConfirmBtn.addEventListener("click", async () => {
    if (typeof pendingDeleteAction === "function") {
      setButtonLoading(deleteConfirmBtn, true, "Deleting...");
      try {
        await pendingDeleteAction();
      } catch (err) {
        console.error("Delete failed:", err);
        showToast("Deletion failed.", "error");
      } finally {
        setButtonLoading(deleteConfirmBtn, false);
        deleteModal.classList.remove("is-open");
        pendingDeleteAction = null;
      }
    }
  });
}

/* --------------------------------------------------------------------------
   13. 1-Click Firestore Seed Utility
   -------------------------------------------------------------------------- */
const seedBtn = document.getElementById("seed-database-btn");

if (seedBtn) {
  seedBtn.addEventListener("click", async () => {
    const ok = confirm("This will write the website's initial default demo data into Firestore. Proceed?");
    if (!ok) return;

    setButtonLoading(seedBtn, true, "Seeding Firestore...");

    try {
      // 1. Seed About
      await setDoc(doc(db, "siteContent", "about"), {
        heading: "4 Years of Storytelling & Digital Media at SRMCEM",
        p1: "The Alpha Team was founded on a simple truth: college memories and creative talent deserve to be seen by the world. For almost 4 years, our team has served as the official creative media powerhouse of Shri Ramswaroop Memorial College of Engineering and Management (SRMCEM), Lucknow.",
        p2: "Led by Aditya Rawat, our crew of 15+ dedicated student creators, videographers, editors, and interviewers has successfully conducted and covered 10+ major campus events—spanning annual cultural fests like Abhivyakti, technical battles in Gantavya, sports meets, freshers' carnivals, and viral vox pop interviews.",
        statMembers: "15+",
        statEvents: "10+",
        statFollowers: "100k+",
        statYears: "4 Yrs",
        updatedAt: serverTimestamp()
      });

      // 2. Seed Contact
      await setDoc(doc(db, "siteContent", "contact"), {
        email: "thealphateamsrmcem@gmail.com",
        studioAddress: "SRMCEM Campus • Tiwariganj, Faizabad Road, Lucknow, UP 226028",
        studioHours: "Media Desk & Creator Hub: Monday – Saturday 10:00 AM – 5:00 PM",
        discordUrl: "https://discord.com",
        socials: {
          instagram: "https://instagram.com",
          twitter: "https://twitter.com",
          youtube: "https://youtube.com"
        },
        updatedAt: serverTimestamp()
      });

      // 3. Seed Team Members (6 Creators)
      const defaultTeam = [
        {
          name: "Aditya Rawat",
          role: "Club Head",
          handle: "@adtyarawt • SRMCEM Campus",
          photoUrl: "assets/images/aditya_rawat.jpg",
          socials: { instagram: "https://instagram.com/adtyarawt", twitter: "https://twitter.com", youtube: "https://youtube.com", linkedin: "https://linkedin.com" },
          order: 1
        },
        {
          name: "Alex Rivera",
          role: "Creative Director",
          handle: "@alexfilms • Filmmaker & VFX",
          photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
          socials: { instagram: "https://instagram.com", twitter: "https://twitter.com", youtube: "https://youtube.com", linkedin: "https://linkedin.com" },
          order: 2
        },
        {
          name: "Sophia Chen",
          role: "Growth Lead",
          handle: "@sophiagrowth • Viral Strategist",
          photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
          socials: { instagram: "https://instagram.com", twitter: "https://twitter.com", youtube: "https://youtube.com", linkedin: "https://linkedin.com" },
          order: 3
        },
        {
          name: "Jordan Blake",
          role: "Head of Audio & Podcasting",
          handle: "@jordanbeats • Sound Engineer",
          photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
          socials: { instagram: "https://instagram.com", twitter: "https://twitter.com", youtube: "https://youtube.com", linkedin: "https://linkedin.com" },
          order: 4
        },
        {
          name: "Elena Rostova",
          role: "Community & Events",
          handle: "@elenavibes • Event Host",
          photoUrl: "https://images.unsplash.com/photo-1534751516642-a1714f31c260?w=600&auto=format&fit=crop&q=80",
          socials: { instagram: "https://instagram.com", twitter: "https://twitter.com", youtube: "https://youtube.com", linkedin: "https://linkedin.com" },
          order: 5
        },
        {
          name: "Marcus Vance",
          role: "Brand Partnerships",
          handle: "@marcusbrand • Agency Executive",
          photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
          socials: { instagram: "https://instagram.com", twitter: "https://twitter.com", youtube: "https://youtube.com", linkedin: "https://linkedin.com" },
          order: 6
        }
      ];

      for (const m of defaultTeam) {
        await addDoc(collection(db, "team"), { ...m, createdAt: serverTimestamp() });
      }

      // 4. Seed Events (6 Workshops & Meetups)
      const defaultEvents = [
        {
          title: "Campus Vox Pop & Student Interview Bootcamp",
          category: "workshops",
          date: "Sat, Oct 10 • 2:00 PM",
          spots: "18 spots left",
          accent: "accent-coral",
          imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80",
          desc: "Master on-camera presence, spontaneous questioning techniques, wireless lapel mic setups, and viral vox pop interviewing across SRMCEM campus.",
          modalDesc: "In this hands-on lab, we break down vox pop interviewing secrets. Learn how to break the ice with students and faculty, craft viral questions, and operate wireless mic rigs with live feedback from Club Head Aditya Rawat.",
          order: 1
        },
        {
          title: "Creator Collab & Live Timeline Jam",
          category: "meetups",
          date: "Fri, Oct 16 • 4:30 PM",
          spots: "Open RSVP",
          accent: "accent-turquoise",
          imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80",
          desc: "Bring your footage and laptops. An afternoon of collaborative reel brainstorming, soundtrack selection, and timeline cuts with fellow creators.",
          modalDesc: "Our monthly campus creator gathering. Connect with editors, photographers, sound enthusiasts, and storytellers. Exchange feedback, brainstorm new reel concepts, and plan upcoming festival coverage.",
          order: 2
        },
        {
          title: "48-Hour Campus Reel Challenge (Abhivyakti Edition)",
          category: "challenges",
          date: "Oct 24-26 • 48 Hours",
          spots: "15 teams max",
          accent: "accent-yellow",
          imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
          desc: "Student creator teams receive a secret campus theme and have 48 hours to shoot, edit, and post the most creative SRMCEM reel. Top reach wins awards!",
          modalDesc: "Push your storytelling and editing speed to the limit! Prompts revealed on Friday. Judged on cinematic composition, engagement, sound design, and campus spirit. Exciting creator kits and certificates for top entries.",
          order: 3
        },
        {
          title: "Gantavya 2026: Live Stream & Multi-Cam Lab",
          category: "workshops",
          date: "Thu, Nov 05 • 3:00 PM",
          spots: "20 spots left",
          accent: "accent-turquoise",
          imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80",
          desc: "Master multi-camera feeds, OBS live broadcasting, drone coverage, and high-speed tech fest coverage for SRMCEM's premier technical conclave.",
          modalDesc: "Step behind the production desk for Gantavya Tech Fest. Learn gimbal stabilization, drone tracking, live switching, and audio feeds so our college fest reaches thousands of viewers online.",
          order: 4
        },
        {
          title: "Smartphone Cinematic Reel & CapCut Masterclass",
          category: "workshops",
          date: "Sat, Nov 14 • 1:30 PM",
          spots: "25 spots left",
          accent: "accent-coral",
          imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
          desc: "Turn raw phone clips into high-production reels. Master speed ramping, SFX layering, color grading, and optimal 4K export presets.",
          modalDesc: "No expensive DSLR needed! Aditya Rawat and senior editors walk you through mobile cinematography tricks, vertical frame composition, trending beat syncs, and viral audio selection.",
          order: 5
        },
        {
          title: "Golden Hour Campus Photowalk & Portrait Session",
          category: "meetups",
          date: "Sun, Nov 22 • 4:00 PM",
          spots: "30 spots left",
          accent: "accent-yellow",
          imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80",
          desc: "Capture warm natural light portraits, test creative focal lengths, and shoot stunning campus aesthetic reels across the college grounds.",
          modalDesc: "An informal creative meetup exploring natural flares, architecture framing, and cinematic b-roll around SRMCEM campus as the sun sets over Tiwariganj.",
          order: 6
        }
      ];

      for (const ev of defaultEvents) {
        await addDoc(collection(db, "events"), { ...ev, createdAt: serverTimestamp() });
      }

      // 5. Seed Gallery (6 Photos)
      const defaultGallery = [
        {
          title: "Storyboarding Sprint & Scripting",
          category: "workshops",
          isTall: true,
          imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
          order: 1
        },
        {
          title: "Cinema Camera Rig Testing",
          category: "behind-the-scenes",
          isTall: false,
          imageUrl: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&auto=format&fit=crop&q=80",
          order: 2
        },
        {
          title: "Alpha Creator Night & Awards",
          category: "meetups",
          isTall: true,
          imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80",
          order: 3
        },
        {
          title: "Color Grading Marathon",
          category: "behind-the-scenes",
          isTall: false,
          imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop&q=80",
          order: 4
        },
        {
          title: "Live Episode Recording Session",
          category: "workshops",
          isTall: true,
          imageUrl: "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=800&auto=format&fit=crop&q=80",
          order: 5
        },
        {
          title: "Golden Hour Photowalk Meetup",
          category: "meetups",
          isTall: false,
          imageUrl: "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&auto=format&fit=crop&q=80",
          order: 6
        }
      ];

      for (const g of defaultGallery) {
        await addDoc(collection(db, "gallery"), { ...g, createdAt: serverTimestamp() });
      }

      showToast("Initial site content successfully seeded to Firestore!");
      loadAllDashboardData();
    } catch (err) {
      console.error("Seeding error:", err);
      showToast("Failed to seed database: " + err.message, "error");
    } finally {
      setButtonLoading(seedBtn, false);
    }
  });
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
