const myAvatar =
  "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp";

async function loadData() {
  const response = await fetch("data.json");
  const data = await response.json();
  return data.contacts;
}

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

Promise.all([loadTemplate(), loadChatTemplate(), loadData()]).then(
  ([_, __, contacts]) => {
    const template = document.getElementById("contact-template");
    const list = document.getElementById("contact-list");

    contacts.forEach((c) => {
      const clone = template.content.cloneNode(true);

      clone.querySelector(".avatar").src = c.avatar;
      clone.querySelector(".contact-name").textContent = c.name;
      clone.querySelector(".contact-last-message").textContent = c.lastMessage;
      clone.querySelector(".contact-time").textContent = c.time;

      const unreadBadge = clone.querySelector(".contact-unread");
      unreadBadge.textContent = c.unread;
      if (c.unread === 0) unreadBadge.style.display = "none";

      const dot = clone.querySelector(".status-dot");
      dot.classList.toggle("bg-success", c.online);
      dot.classList.toggle("bg-secondary", !c.online);

      clone.querySelector("a").addEventListener("click", () => {
        showChatPanel(c);
        loadChatForContact(c);
      });

      list.appendChild(clone);
    });
  },
);

function loadChatForContact(contact) {
  const chatTemplate = document.getElementById("chat-message-template");
  const chatContainer = document.getElementById("chat-container");

  chatContainer.innerHTML = "";

  contact.messages.forEach((msg) => {
    const clone = chatTemplate.content.cloneNode(true);

    const row = clone.querySelector(".chat-row");
    const avatar = clone.querySelector(".chat-avatar");
    const bubble = clone.querySelector(".chat-bubble");
    const time = clone.querySelector(".chat-time");
    const container = clone.querySelector(".chat-bubble-container");

    avatar.src = msg.fromMe ? myAvatar : contact.avatar;
    bubble.textContent = msg.text;
    time.textContent = msg.time;

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

    chatContainer.appendChild(clone);
  });
}

function showChatPanel(contact) {
  const panel = document.getElementById("chat-panel");
  const headerName = document.getElementById("chat-header-name");
  const headerAvatar = document.getElementById("chat-header-avatar");

  headerName.textContent = contact.name;
  headerAvatar.src = contact.avatar;

  panel.classList.remove("d-none");
}
