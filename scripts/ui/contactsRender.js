import { state } from "../state.js";
import { getMessagePreview } from "../helpers.js";
import { renderChat } from "./chatRender.js";

export function updateContactRow(contact) {
  const rowEl = state.contactRowEls.get(contact.id);
  if (!rowEl) return;

  rowEl.querySelector(".contact-last-message").textContent = getMessagePreview(
    contact.lastMessage,
  );

  rowEl.querySelector(".contact-time").textContent = contact.time ?? "";

  const unreadBadge = rowEl.querySelector(".contact-unread");
  const unread = contact.unread ?? 0;
  unreadBadge.textContent = unread;
  unreadBadge.style.display = unread === 0 ? "none" : "";
}

export function showChatPanel(contact) {
  const panel = document.getElementById("chat-panel");
  const headerName = document.getElementById("chat-header-name");
  const headerAvatar = document.getElementById("chat-header-avatar");

  headerName.textContent = contact.name;
  headerAvatar.src = contact.avatar;

  panel.classList.remove("d-none");
}

export function openConversation(contact) {
  state.activeContactId = contact.id;

  contact.unread = 0;
  updateContactRow(contact);

  showChatPanel(contact);
  renderChat(contact);

  const input = document.getElementById("chat-input");
  if (input) input.focus();
}

export function renderContactsList(contacts) {
  const template = document.getElementById("contact-template");
  const list = document.getElementById("contact-list");

  contacts.forEach((c) => {
    const clone = template.content.cloneNode(true);

    clone.querySelector(".avatar").src = c.avatar;
    clone.querySelector(".contact-name").textContent = c.name;

    clone.querySelector(".contact-last-message").textContent =
      getMessagePreview(c.lastMessage);

    clone.querySelector(".contact-time").textContent = c.time;

    const unreadBadge = clone.querySelector(".contact-unread");
    unreadBadge.textContent = c.unread;
    if (c.unread === 0) unreadBadge.style.display = "none";

    const dot = clone.querySelector(".status-dot");
    dot.classList.toggle("bg-success", c.online);
    dot.classList.toggle("bg-secondary", !c.online);

    const link = clone.querySelector("a");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openConversation(c);
    });

    list.appendChild(clone);
    const rowEl = list.lastElementChild;
    state.contactRowEls.set(c.id, rowEl);
  });
}
