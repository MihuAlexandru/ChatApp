import { STORAGE_KEY } from "./config.js";

export function loadContactsFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveContactsToStorage(contacts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}
