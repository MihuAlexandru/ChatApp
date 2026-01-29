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

/** ---------------- trimitere mesaj ---------------- */

/// iei id-ul contactului curent si adaugi mesajul la conversatia cu el
/// handler pentru event listener de trimitere mesaj

function sendActiveMessage() {
  const contact = getActiveContact();
  if (!contact) return;

  const input = document.getElementById("chat-input");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const msg = {
    fromMe: true,
    text,
    time: formatTimeNow(),
  };

  contact.messages ??= [];
  contact.messages.push(msg);

  contact.lastMessage = text;
  contact.time = msg.time;
  contact.unread = 0;

  appendMessageToChat(contact, msg);
  updateContactRow(contact);

  saveContactsToStorage(state.contacts);

  input.value = "";
  input.focus();
}

/// adaugam event listeners pentru cand dai click send sau enter

function wireComposer() {
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");

  if (!input || !sendBtn) {
    console.warn(
      "Composer not found (#chat-input / #chat-send). Add IDs in HTML for best results.",
    );
    return;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendActiveMessage();
  });

  sendBtn.addEventListener("click", sendActiveMessage);
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

    wireComposer();
  },
);
