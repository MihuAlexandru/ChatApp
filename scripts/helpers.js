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

  const time = now.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const date = now.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
  });

  return `${time} | ${date}`;
}

/// returneaza contactul caruia vrem sa trimitem mesajul

export function getActiveContact() {
  return state.contacts.find((c) => c.id === state.activeContactId) ?? null;
}
