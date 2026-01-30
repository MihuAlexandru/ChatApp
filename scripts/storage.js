/** ---------------- Local storage aici ---------------- */
/// load si save

import { STORAGE_KEY } from "./config.js";

function userKey(userId) {
  return `${STORAGE_KEY}:u:${userId}`;
}

// load per-user conversation map: { [contactId]: {messages, unread, lastMessage, time} }
export function loadUserConversations(userId) {
  const raw = localStorage.getItem(userKey(userId));
  return raw ? JSON.parse(raw) : null;
}

// save per-user conversation map
export function saveUserConversations(userId, conversationsMap) {
  localStorage.setItem(userKey(userId), JSON.stringify(conversationsMap));
}

export function contactsToConversationsMap(contacts) {
  const map = {};
  for (const c of contacts) {
    map[c.id] = {
      messages: c.messages ?? [],
      unread: c.unread ?? 0,
      lastMessage: c.lastMessage ?? "",
      time: c.time ?? "",
    };
  }
  return map;
}
