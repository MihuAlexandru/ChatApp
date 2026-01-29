/** ---------------- niste helpere  ---------------- */

import { state } from "./state.js";

/// trunchiere preview mesaj

export function getMessagePreview(text, limit = 30) {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
}

/// formatare data trimiterii mesajului

export function formatTimeNow() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/// returneaza contactul caruia vrem sa trimitem mesajul

export function getActiveContact() {
  return state.contacts.find((c) => c.id === state.activeContactId) ?? null;
}
