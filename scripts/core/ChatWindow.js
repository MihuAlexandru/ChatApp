import { PubSub } from "./PubSub.js";
import { getActiveContact, formatTimeNow } from "../helpers.js";
import { saveContactsToStorage } from "../storage.js";
import { appendMessageToChat } from "../ui/chatRender.js";
import { updateContactRow } from "../ui/contactsRender.js";

export class ChatWindow extends PubSub {
  constructor({
    state,
    sendBtnId = "chat-send",
    inputId = "chat-input",
    ignoreOwnEcho = true,
  }) {
    super();
    this.state = state;
    this.ignoreOwnEcho = ignoreOwnEcho;
    this.seenIds = new Set();

    this.input = document.getElementById(inputId);
    this.sendBtn = document.getElementById(sendBtnId);

    if (!this.input || !this.sendBtn) {
      console.warn("ChatWindow: composer elements not found");
      return;
    }

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.#handleSend();
    });
    this.sendBtn.addEventListener("click", () => this.#handleSend());
  }

  addIncomingMessage({ contactId, text, time }) {
    this.#applyMessageToState({
      contactId,
      text,
      time: time ?? formatTimeNow(),
      fromMe: false,
    });
  }

  #handleSend() {
    const contact = getActiveContact();
    if (!contact) return;

    const text = this.input.value.trim();
    if (!text) return;

    const time = formatTimeNow();

    this.#applyMessageToState({
      contactId: contact.id,
      text,
      time,
      fromMe: true,
    });

    const envelope = {
      type: "chat-message",
      contactId: contact.id,
      text,
      time,
      sender: "me",
      clientMsgId: crypto?.randomUUID?.() ?? String(Date.now()),
    };

    this.publish("send", envelope);

    this.input.value = "";
    this.input.focus();
  }

  receive(payload) {
    if (typeof payload === "string") {
      const active = getActiveContact();
      if (!active) return;
      this.#applyMessageToState({
        contactId: active.id,
        text: payload,
        time: formatTimeNow(),
        fromMe: false,
      });
      return;
    }

    if (!payload || typeof payload !== "object") return;
    if (payload.type !== "chat-message") return;

    const { contactId, text, time, sender, clientMsgId } = payload;
    if (!contactId || !text) return;

    if (clientMsgId) {
      if (this.seenIds.has(clientMsgId)) return;
      this.seenIds.add(clientMsgId);
    }

    if (this.ignoreOwnEcho && sender === "me") return;

    const fromMe = sender === "me";

    this.#applyMessageToState({
      contactId,
      text,
      time: time ?? formatTimeNow(),
      fromMe,
    });
  }

  #applyMessageToState({ contactId, text, time, fromMe }) {
    const contact = this.state.contacts.find((c) => c.id === contactId);
    if (!contact) return;

    const msg = { fromMe, text, time };

    contact.messages ??= [];
    contact.messages.push(msg);

    contact.lastMessage = text;
    contact.time = time;

    if (this.state.activeContactId === contactId) {
      appendMessageToChat(contact, msg);
      contact.unread = 0;
    } else {
      if (!fromMe) contact.unread = (contact.unread ?? 0) + 1;
    }

    updateContactRow(contact);
    saveContactsToStorage(this.state.contacts);
  }
}
