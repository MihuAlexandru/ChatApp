import { loadContactsFromStorage, saveContactsToStorage } from "./storage.js";

export async function loadData() {
  const cached = loadContactsFromStorage();
  if (cached) return cached;

  const response = await fetch("data.json");
  const data = await response.json();

  saveContactsToStorage(data.contacts);
  return data.contacts;
}
