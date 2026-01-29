import { state } from "./state.js";

export function getMessagePreview(text, limit = 30) {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
}

export function formatTimeNow() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function getActiveContact() {
  return state.contacts.find((c) => c.id === state.activeContactId) ?? null;
}
