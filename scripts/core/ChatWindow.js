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

  /// rezolva mesajele PRIMITE de la websocket
  receive(payload) {
    /// daca serverul trimite un string atunci presupune
    // ca mesajul e pentru conversatia curenta
    // pentru ca nu are nicaieri specificat un ID
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
    /// serverul da reject la orice nu respecta formatul acelui envelope
    if (!payload || typeof payload !== "object") return;
    if (payload.type !== "chat-message") return;

    const { contactId, text, time, sender, clientMsgId } = payload;
    if (!contactId || !text) return;

    ///previne duplicarea mesajelor daca serverul a trimis de mai multe ori
    if (clientMsgId) {
      if (this.seenIds.has(clientMsgId)) return;
      this.seenIds.add(clientMsgId);
    }

    ///posibilitate de ignore you're own echo
    if (this.ignoreOwnEcho && sender === "me") return;

    const fromMe = sender === "me";

    this.#applyMessageToState({
      contactId,
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
