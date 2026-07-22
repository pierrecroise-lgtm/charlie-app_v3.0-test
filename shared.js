// ═══════════════════════════════════════════════════════════════
// shared.js — fonctions communes à config.html et index.html
// Évite de dupliquer cette logique dans les deux pages.
// ═══════════════════════════════════════════════════════════════
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export const FB_CONFIG_KEY = 'charlie_fb_config';
export const BABY_KEY = 'charlie_baby';
export const MY_NAME_KEY = 'charlie_my_name';

export function getSavedFbConfig() {
  try {
    const raw = localStorage.getItem(FB_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

export function getBabyLocal() {
  try { const r = localStorage.getItem(BABY_KEY); return r ? JSON.parse(r) : null; } catch(e) { return null; }
}

export function setBabyLocal(obj) {
  try { localStorage.setItem(BABY_KEY, JSON.stringify(obj)); } catch(e) {}
}

// Vrai uniquement si les 3 conditions de premier lancement sont réunies sur CET appareil
export function isOnboardingComplete() {
  const baby = getBabyLocal();
  return !!getSavedFbConfig() && !!baby && !!baby.name && !!baby.birth && !!localStorage.getItem(MY_NAME_KEY);
}

// Teste une configuration Firebase en écrivant un document de vérification (auto-suffisant,
// ne conserve aucune connexion : config.html n'a pas besoin d'une instance Firebase durable).
export async function tryConnectConfig(config) {
  try {
    const testApp = initializeApp(config, 'test-' + Date.now());
    const testDb = getFirestore(testApp);
    await setDoc(doc(testDb, '_health', 'ping'), { ts: Date.now() });
    return true;
  } catch(e) { return false; }
}

// Lecture souple de la config Firebase collée depuis la console (JSON strict ou objet JS non strict)
export function parseFirebaseConfigInput(raw) {
  let text = raw.trim();
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1) throw new Error('Aucune accolade trouvée');
  text = text.slice(braceStart, braceEnd + 1);
  try {
    return JSON.parse(text);
  } catch(e) {
    const loose = text
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,(\s*})/g, '$1');
    return JSON.parse(loose);
  }
}

// Construit l'URL de partage (config.html?setup=...), exploitable par l'appareil photo natif du téléphone
export function buildSetupUrl(payload) {
  // Toujours vers config.html, même appelé depuis app.html (ex: partage QR depuis Réglages)
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'config.html');
  return base + '?setup=' + encodeURIComponent(JSON.stringify(payload));
}

// Décode un texte scanné : soit une URL contenant ?setup=..., soit du JSON brut (compatibilité)
export function extractSetupPayloadFromText(text) {
  try { return JSON.parse(text); } catch(e) {}
  try {
    const url = new URL(text);
    const raw = url.searchParams.get('setup');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

let toastTimer = null;
export function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
