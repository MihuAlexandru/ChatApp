/** ---------------- imaginea cu avatarul nostru ---------------- */

const myAvatar =
  "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp";

/** ---------------- Local storage aici ---------------- */
/// load si save

const STORAGE_KEY = "chat-app-contacts-v1";

function loadContactsFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveContactsToStorage(contacts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

/// daca am date in local storage dau load de acolo
/// daca nu din JSON si le salvez dupa si in local storage

async function loadData() {
  const cached = loadContactsFromStorage();
  if (cached) return cached;

  const response = await fetch("data.json");
  const data = await response.json();
  saveContactsToStorage(data.contacts);
  return data.contacts;
}

/** ---------------- templaturi aici ---------------- */

/// load la cele 2 template-uri

async function loadTemplate() {
  const response = await fetch("contact-template.tpl");
  const html = await response.text();
  document.body.insertAdjacentHTML("beforeend", html);
}

async function loadChatTemplate() {
  const response = await fetch("chat-template.tpl");
  const html = await response.text();
  document.body.insertAdjacentHTML("beforeend", html);
}

/// ceva state pentru aplicatie, mostly contacte

const state = {
  contacts: [], // lista de contacte
  activeContactId: null, //id-ul conversatiei curente deschise
  contactRowEls: new Map(), // tine id-ul contactului si elementul efectiv de <li>
};

/** ---------------- niste helpere  ---------------- */

/// trunchiere preview mesaj

function getMessagePreview(text, limit = 30) {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
}

/// formatare data trimiterii mesajului

function formatTimeNow() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/// returneaza contactul caruia vrem sa trimitem mesajul

function getActiveContact() {
  return state.contacts.find((c) => c.id === state.activeContactId) ?? null;
}

/// afisarea chat-ului cu o persoana

function showChatPanel(contact) {
  const panel = document.getElementById("chat-panel");
  const headerName = document.getElementById("chat-header-name");
  const headerAvatar = document.getElementById("chat-header-avatar");

  headerName.textContent = contact.name;
  headerAvatar.src = contact.avatar;

  panel.classList.remove("d-none");
}

/** ---------------- Rendarea efectiva a ferestrei de chat ---------------- */

// ne afiseaza toate mesajele pentru chat-ul curent

function renderChat(contact) {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.innerHTML = "";

  (contact.messages ?? []).forEach((msg) => {
    const node = buildMessageNode(contact, msg);
    chatContainer.appendChild(node);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// adaugare mesaj nou trimis in UI

function appendMessageToChat(contact, msg) {
  const chatContainer = document.getElementById("chat-container");
  const node = buildMessageNode(contact, msg);
  chatContainer.appendChild(node);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// construirea efectiva a unui mesaj in conversatie
// in functie de cine trimite se schimba poza si stilul
// bulei de mesaj

function buildMessageNode(contact, msg) {
  const chatTemplate = document.getElementById("chat-message-template");
  if (!chatTemplate) {
    throw new Error(
      "chat-message-template not found. Make sure chat-template.tpl is loaded before rendering chat.",
    );
  }

  // aici facem cloneNode(true) ca sa facem clonare deep a intregului subtree
  // si in general folosim fragmente pentru ca ne lasa sa construim DOM-ul
  // off screen si sa dam insert doar o singura data
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

/** ---------------- update contact in lista ---------------- */

/// cand trimitem un mesaj in chat-ul curent
/// se face update la last message si contact time
/// cand intram pe conversatie dispare si badge-ul

function updateContactRow(contact) {
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

/** ---------------- Deschide conversatia ---------------- */

/// facem update in stanga in lista de contacte
/// show si render chat
/// focus the input

function openConversation(contact) {
  state.activeContactId = contact.id;

  contact.unread = 0;
  updateContactRow(contact);

  showChatPanel(contact);
  renderChat(contact);

  const input = document.getElementById("chat-input");
  if (input) input.focus();
}

/// dupa ce am facut toate load-urile
/// afisam lista cu toate contactele

Promise.all([loadTemplate(), loadChatTemplate(), loadData()]).then(
  ([_, __, contacts]) => {
    contacts.forEach((c, idx) => (c.id ??= idx + 1));

    state.contacts = contacts;

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

    // 1) Create WS connection (pick one)
    // const connection = new ServerConnection("wss://ws.ifelse.io"); // echoes back what you send [1](https://www.baeldung.com/linux/shell-read-websocket-response)
    const connection = new ServerConnection("wss://ws.ifelse.io"); // Postman echo [2](https://blog.postman.com/introducing-postman-websocket-echo-service/)
    connection.connect();

    // 2) Create chat window controller
    const chatWindow = new ChatWindow({ state });

    window.sendAsThem = (contactId, text) => {
      connection.send({
        type: "chat-message",
        contactId,
        text,
        time: formatTimeNow(),
        sender: "them",
        clientMsgId: crypto?.randomUUID?.() ?? String(Date.now()),
      });
    };

    // 3) PubSub wiring: UI -> WS
    chatWindow.subscribe("send", (envelope) => {
      // This prints when you send
      console.log("[APP] sending to websocket:", envelope);
      connection.send(envelope);
    });

    // 4) PubSub wiring: WS -> UI
    connection.subscribe("message", (payload) => {
      // This prints when you receive
      console.log("[APP] received from websocket:", payload);
      chatWindow.receive(payload); // optional UI rendering (currently logs only)
    });
  },
);

class PubSub {
  #subscriptions = new Map();

  subscribe(name, fn) {
    const arr = this.#subscriptions.get(name) ?? [];
    arr.push(fn);
    this.#subscriptions.set(name, arr);

    return () => {
      const next = (this.#subscriptions.get(name) ?? []).filter(
        (x) => x !== fn,
      );
      this.#subscriptions.set(name, next);
    };
  }

  publish(name, data) {
    (this.#subscriptions.get(name) ?? []).forEach((fn) => fn(data));
  }
}

class ServerConnection extends PubSub {
  #socket = null;
  #url = null;
  #queue = [];

  constructor(url) {
    super();
    this.#url = url;
  }

  connect() {
    this.#socket = new WebSocket(this.#url);

    this.#socket.addEventListener("open", (ev) => {
      console.log("[WS] open", this.#url, ev);
      this.publish("open", ev);

      while (this.#queue.length) {
        this.#socket.send(this.#queue.shift());
      }
    });

    this.#socket.addEventListener("close", (ev) => {
      console.log("[WS] close", ev.code, ev.reason);
      this.publish("close", ev);
    });

    this.#socket.addEventListener("error", (ev) => {
      console.log("[WS] error", ev);
      this.publish("error", ev);
    });

    this.#socket.addEventListener("message", (ev) => {
      let payload = ev.data;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        // keep as text if not JSON
      }

      console.log("[WS] recv", payload);
      this.publish("message", payload);
    });
  }

  send(message) {
    const data =
      typeof message === "string" ? message : JSON.stringify(message);

    console.log("[WS] send", message);

    // If not open yet, queue it
    if (!this.#socket || this.#socket.readyState !== WebSocket.OPEN) {
      this.#queue.push(data);
      return;
    }

    this.#socket.send(data);
  }
}

/**
 * ChatWindow = controller for your existing single chat panel.
 * It uses your existing state + helper functions (no UI rewrite).
 */ class ChatWindow extends PubSub {
  constructor({
    state,
    sendBtnId = "chat-send",
    inputId = "chat-input",
    // When using an echo server, you'll often get your own sent message back.
    // If you already rendered it locally (you do), ignoring "me" prevents duplicates.
    ignoreOwnEcho = true,
  }) {
    super();
    this.state = state;
    this.ignoreOwnEcho = ignoreOwnEcho;

    // Optional: dedupe by clientMsgId (useful when you later have a real server)
    this.seenIds = new Set();

    this.input = document.getElementById(inputId);
    this.sendBtn = document.getElementById(sendBtnId);

    if (!this.input || !this.sendBtn) {
      console.warn("ChatWindow: composer elements not found");
      return;
    }

    // Wire UI events once
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.#handleSend();
    });

    this.sendBtn.addEventListener("click", () => this.#handleSend());
  }

  /**
   * UI -> publish("send") and also update local UI immediately.
   * This matches your existing behavior: the sender sees their message instantly.
   */
  #handleSend() {
    const contact = getActiveContact();
    if (!contact) return;

    const text = this.input.value.trim();
    if (!text) return;

    const time = formatTimeNow();

    // 1) Update UI/state immediately as "me"
    this.#applyMessageToState({
      contactId: contact.id,
      text,
      time,
      fromMe: true,
    });

    // 2) Publish envelope for WebSocket sending
    const envelope = {
      type: "chat-message",
      contactId: contact.id,
      text,
      time,
      sender: "me",
      clientMsgId: crypto?.randomUUID?.() ?? String(Date.now()),
    };

    this.publish("send", envelope);

    // reset input
    this.input.value = "";
    this.input.focus();
  }

  /**
   * WebSocket -> UI.
   * Accepts:
   *  - object envelope: { type:"chat-message", contactId, text, time, sender, clientMsgId }
   *  - raw string: will be treated as incoming to active conversation
   */
  receive(payload) {
    // 1) Raw string (some servers echo plain text)
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

    // 2) Must be an object
    if (!payload || typeof payload !== "object") return;

    // 3) Only handle our message type
    if (payload.type !== "chat-message") {
      // ignore unknown protocol messages
      return;
    }

    const { contactId, text, time, sender, clientMsgId } = payload;
    if (!contactId || !text) return;

    // 4) Optional dedupe by clientMsgId
    if (clientMsgId) {
      if (this.seenIds.has(clientMsgId)) return;
      this.seenIds.add(clientMsgId);
    }

    // 5) If this is an echo server and sender is "me",
    // ignore to avoid duplicating the message (we already rendered it locally).
    if (this.ignoreOwnEcho && sender === "me") {
      return;
    }

    const fromMe = sender === "me"; // sender "them" -> false

    this.#applyMessageToState({
      contactId,
      text,
      time: time ?? formatTimeNow(),
      fromMe,
    });
  }

  /**
   * Single source of truth for:
   * - pushing message into state
   * - updating contact list row (last message/time/unread)
   * - rendering into chat if active
   * - saving to localStorage
   */
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
      // Only increase unread for incoming messages
      if (!fromMe) {
        contact.unread = (contact.unread ?? 0) + 1;
      }
    }

    updateContactRow(contact);
    saveContactsToStorage(this.state.contacts);
  }
}
