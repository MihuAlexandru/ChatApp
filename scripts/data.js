/// daca am date in local storage dau load de acolo
/// daca nu din JSON si le salvez dupa si in local storage

import { loadUserConversations } from "./storage.js";

export async function loadData(myUserId) {
  // 1) Always load static contacts from JSON (source of truth for directory)
  const response = await fetch("data.json");
  const data = await response.json();
  const contacts = data.contacts;

  // Ensure ids
  contacts.forEach((c, idx) => (c.id ??= idx + 1));

  // 2) Load per-user conversations map
  const convMap = loadUserConversations(myUserId) ?? {};

  // 3) Merge conversation state into contacts
  contacts.forEach((c) => {
    const conv = convMap[c.id];
    c.messages = conv?.messages ?? [];
    c.unread = conv?.unread ?? 0;
    c.lastMessage = conv?.lastMessage ?? "";
    c.time = conv?.time ?? "";
  });

  return contacts;
}
