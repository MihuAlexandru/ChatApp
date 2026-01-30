import { state } from "./state.js";
import { WS_URL, getMyAvatar } from "./config.js";
import { loadTemplate, loadChatTemplate } from "./templates.js";
import { loadData } from "./data.js";
import { renderContactsList } from "./ui/contactsRender.js";
import { ServerConnection } from "./core/ServerConnection.js";
import { ChatWindow } from "./core/ChatWindow.js";
import { formatTimeNow } from "./helpers.js";
import { wireEmojiPicker } from "./ui/emojiPicker.js";

/// dupa ce am facut toate load-urile
/// afisam lista cu toate contactele
/// creeam conexiunea
/// instantiem chatwindow cu state-ul curent
/// facem subscribe la send si message
/// pentru cand trimitem si primim mesaje
/// also functie helper sendAsThem

function getOrCreateSelfId() {
  const key = "chat:selfId";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto?.randomUUID?.() ?? String(Date.now());
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getUserIdFromUrlOrSession() {
  const params = new URLSearchParams(location.search);
  const fromUrl = Number(params.get("userId"));

  const key = "chat:userId";
  const fromSession = Number(sessionStorage.getItem(key));

  const id =
    Number.isFinite(fromUrl) && fromUrl > 0
      ? fromUrl
      : Number.isFinite(fromSession) && fromSession > 0
        ? fromSession
        : 1;

  sessionStorage.setItem(key, String(id));
  return id;
}

state.myUserId = getUserIdFromUrlOrSession();

async function main() {
  const [_, __, contacts] = await Promise.all([
    loadTemplate(),
    loadChatTemplate(),
    loadData(state.myUserId),
  ]);

  state.myAvatar = getMyAvatar(state.myUserId);
  const composerAvatar = document.getElementById("chat-composer-avatar");
  if (composerAvatar) composerAvatar.src = state.myAvatar;

  state.selfId = getOrCreateSelfId();
  contacts.forEach((c, idx) => (c.id ??= idx + 1));
  state.contacts = contacts;

  renderContactsList(contacts.filter((c) => c.id !== state.myUserId));

  const connection = new ServerConnection(WS_URL);
  connection.connect();

  connection.subscribe("open", () => {
    connection.send({ type: "hello", userId: state.myUserId });
  });

  const chatWindow = new ChatWindow({ state });

  wireEmojiPicker();

  /// UI -> WS
  chatWindow.subscribe("send", (envelope) => {
    console.log("[APP] sending to websocket:", envelope);
    connection.send(envelope);
  });

  /// WS -> UI
  connection.subscribe("message", (payload) => {
    console.log("[APP] received from websocket:", payload);
    chatWindow.receive(payload);
  });

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
