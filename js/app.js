// Vector app.js — Skeleton, Navigation, Theme and Unit Settings

const STORAGE_KEY = 'vector-settings';

const defaultSettings = {
  theme: 'blue',
  unit: 'kmph',
  view: 'speed'
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    return { ...defaultSettings };
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

let settings = loadSettings();

window.Vector = window.Vector || {};
window.Vector.settings = settings;

// Elements
const body = document.body;
const screenTitle = document.getElementById('screenTitle');
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const openSettingsBtn = document.getElementById('openSettings');
const openAboutBtn = document.getElementById('openAbout');
const closeSettingsBtn = document.getElementById('closeSettings');
const closeAboutBtn = document.getElementById('closeAbout');
const settingsModal = document.getElementById('settingsModal');
const aboutModal = document.getElementById('aboutModal');
const navBtns = document.querySelectorAll('.nav-btn');
const viewSpeed = document.getElementById('view-speed');
const viewCompass = document.getElementById('view-compass');
const statsSpeed = document.getElementById('statsSpeed');
const statsCompass = document.getElementById('statsCompass');
const themeOptions = document.getElementById('themeOptions');
const unitOptions = document.getElementById('unitOptions');

const VIEW_TITLES = { speed: 'Speedometer', compass: 'Compass' };

// View Switching
function applyView(view) {
  settings.view = view;
  body.dataset.view = view;
  screenTitle.textContent = VIEW_TITLES[view];

  const isSpeed = view === 'speed';
  viewSpeed.hidden = !isSpeed;
  viewCompass.hidden = isSpeed;
  statsSpeed.hidden = !isSpeed;
  statsCompass.hidden = isSpeed;

  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === view);
  });

  saveSettings(settings);
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => applyView(btn.dataset.target));
});

// Dropdown Menu
function closeDropdown() { dropdownMenu.hidden = true; }

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.hidden = !dropdownMenu.hidden;
});
document.addEventListener('click', closeDropdown);
dropdownMenu.addEventListener('click', (e) => e.stopPropagation());

// Modals
function openModal(modal) { modal.hidden = false; closeDropdown(); }
function closeModal(modal) { modal.hidden = true; }

openSettingsBtn.addEventListener('click', () => openModal(settingsModal));
openAboutBtn.addEventListener('click', () => openModal(aboutModal));
closeSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
closeAboutBtn.addEventListener('click', () => closeModal(aboutModal));

[settingsModal, aboutModal].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

// Theme Selection
function applyTheme(theme) {
  settings.theme = theme;
  body.className = `theme-${theme}`;

  themeOptions.querySelectorAll('.swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.theme === theme);
  });

  saveSettings(settings);
}

themeOptions.querySelectorAll('.swatch').forEach(sw => {
  sw.addEventListener('click', () => applyTheme(sw.dataset.theme));
});

// Unit Selection
function applyUnit(unit) {
  settings.unit = unit;

  unitOptions.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.unit === unit);
  });

  saveSettings(settings);
  document.dispatchEvent(new CustomEvent('vector:unitchange', { detail: unit }));
}

unitOptions.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', () => applyUnit(btn.dataset.unit));
});

// Init
applyView(settings.view);
applyTheme(settings.theme);
applyUnit(settings.unit);