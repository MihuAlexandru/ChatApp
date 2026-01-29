import { myAvatar } from "../config.js";

export function renderChat(contact) {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.innerHTML = "";

  (contact.messages ?? []).forEach((msg) => {
    const node = buildMessageNode(contact, msg);
    chatContainer.appendChild(node);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

export function appendMessageToChat(contact, msg) {
  const chatContainer = document.getElementById("chat-container");
  const node = buildMessageNode(contact, msg);
  chatContainer.appendChild(node);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

export function buildMessageNode(contact, msg) {
  const chatTemplate = document.getElementById("chat-message-template");
  if (!chatTemplate) {
    throw new Error(
      "chat-message-template not found. Make sure chat-template.tpl is loaded before rendering chat.",
    );
  }

  const fragment = chatTemplate.content.cloneNode(true);

  const row = fragment.querySelector(".chat-row");
  const avatar = fragment.querySelector(".chat-avatar");
  const bubble = fragment.querySelector(".chat-bubble");
  const time = fragment.querySelector(".chat-time");
  const container = fragment.querySelector(".chat-bubble-container");

  avatar.src = msg.fromMe ? myAvatar : contact.avatar;
  bubble.textContent = msg.text;
  time.textContent = msg.time;

  row.classList.remove("justify-content-end", "justify-content-start");
  container.classList.remove("text-end", "me-3", "text-start", "ms-3");
  bubble.classList.remove("text-white", "bg-primary", "bg-body-secondary");

  if (msg.fromMe) {
    row.classList.add("justify-content-end");
    row.appendChild(avatar);
    bubble.classList.add("text-white", "bg-primary");
    container.classList.add("text-end", "me-3");
  } else {
    row.classList.add("justify-content-start");
    bubble.classList.add("bg-body-secondary");
    container.classList.add("text-start", "ms-3");
  }

  return fragment;
}
