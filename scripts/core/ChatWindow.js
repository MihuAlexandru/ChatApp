/** ---------------- Clasa Chat Window ---------------- */

import { PubSub } from "./PubSub.js";
import { getActiveContact, formatTimeNow } from "../helpers.js";
import { saveContactsToStorage } from "../storage.js";
import { appendMessageToChat } from "../ui/chatRender.js";
import { updateContactRow } from "../ui/contactsRender.js";

// clasa asta nu stie de websocket,
// stie doar ca trebuie sa publice un event

export class ChatWindow extends PubSub {
  /// bagam event listener pe clasa asta pentru enter si click send
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

  /// metoda de testare fara websocket de trimitere mesaje
  /// din partea celorlalti
  addIncomingMessage({ contactId, text, time }) {
    this.#applyMessageToState({
      contactId,
      text,
      time: time ?? formatTimeNow(),
      fromMe: false,
    });
  }

  /// finds the contact it needs to send the message to
  /// mesajul e structurat intr-un envelope pe care o sa il trimit prin websocket
  /// update the UI prin applyMessageToState
  /// publish la event de send care va fi trimis separat de websocket, nu e treaba noastra
  #handleSend() {
    const contact = getActiveContact();
    if (!contact) return;

    const text = this.input.value.trim();
    if (!text) return;

    const time = formatTimeNow();

    // Update UI immediately
    this.#applyMessageToState({
      contactId: contact.id,
      text,
      time,
      fromMe: true,
    });

    const envelope = {
      type: "chat-message",
      fromUserId: this.state.myUserId, // ✅ who am I
      toUserId: contact.id, // ✅ who I'm sending to
      text,
      time,
      clientMsgId: crypto?.randomUUID?.() ?? String(Date.now()),
    };

    this.publish("send", envelope);

    this.input.value = "";
    this.input.focus();
  }

  /// rezolva mesajele PRIMITE de la websocket
  receive(payload) {
    if (!payload || typeof payload !== "object") return;
    if (payload.type !== "chat-message") return;

    const { fromUserId, toUserId, text, time, clientMsgId } = payload;
    if (!fromUserId || !toUserId || !text) return;

    // Deduplicate (optional but good)
    if (clientMsgId) {
      if (this.seenIds.has(clientMsgId)) return;
      this.seenIds.add(clientMsgId);
    }

    const myId = this.state.myUserId;

    // Only accept messages that involve me
    const involvesMe = toUserId === myId || fromUserId === myId;
    if (!involvesMe) return;

    // Figure out which contact thread to update:
    // - if it's from someone else to me => thread is fromUserId
    // - if it's from me to someone else => thread is toUserId
    const threadContactId = fromUserId === myId ? toUserId : fromUserId;

    const fromMe = fromUserId === myId;

    // Optional: ignore echo of my own message if server echoes back
    if (this.ignoreOwnEcho && fromMe) return;

    this.#applyMessageToState({
      contactId: threadContactId,
      text,
      time: time ?? formatTimeNow(),
      fromMe,
    });
  }

  ///aici facem update la UI si states
  #applyMessageToState({ contactId, text, time, fromMe }) {
    ///cautam si gasim contactul dupa id in lista
    const contact = this.state.contacts.find((c) => c.id === contactId);
    if (!contact) return;

    ///store the message into the list of messages
    const msg = { fromMe, text, time };

    contact.messages ??= [];
    contact.messages.push(msg);

    ///actualizeaza preview info din lista de contacte
    contact.lastMessage = text;
    contact.time = time;

    /// daca conversatia e deschisa atunci da apend la mesaj pe UI
    /// daca nu doar actualizeaza unread messages count
    if (this.state.activeContactId === contactId) {
      appendMessageToChat(contact, msg);
      contact.unread = 0;
    } else {
      if (!fromMe) contact.unread = (contact.unread ?? 0) + 1;
    }
    ///update the row pe partea stanga cu lista
    updateContactRow(contact);
    saveContactsToStorage(this.state.contacts);
  }
}
