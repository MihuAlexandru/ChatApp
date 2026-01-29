import { state } from "./state.js";
import { WS_URL } from "./config.js";
import { loadTemplate, loadChatTemplate } from "./templates.js";
import { loadData } from "./data.js";
import { renderContactsList } from "./ui/contactsRender.js";

import { ServerConnection } from "./core/ServerConnection.js";
import { ChatWindow } from "./core/ChatWindow.js";
import { formatTimeNow } from "./helpers.js";

async function main() {
  const [_, __, contacts] = await Promise.all([
    loadTemplate(),
    loadChatTemplate(),
    loadData(),
  ]);

  contacts.forEach((c, idx) => (c.id ??= idx + 1));
  state.contacts = contacts;

  renderContactsList(contacts);

  const connection = new ServerConnection(WS_URL);
  connection.connect();

  const chatWindow = new ChatWindow({ state });

  // UI -> WS
  chatWindow.subscribe("send", (envelope) => {
    console.log("[APP] sending to websocket:", envelope);
    connection.send(envelope);
  });

  // WS -> UI
  connection.subscribe("message", (payload) => {
    console.log("[APP] received from websocket:", payload);
    chatWindow.receive(payload);
  });

  // dev helper
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
}

main();
