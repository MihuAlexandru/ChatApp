import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// userId -> Set<WebSocket>
const users = new Map();

function addSocket(userId, ws) {
  const set = users.get(userId) ?? new Set();
  set.add(ws);
  users.set(userId, set);
}

function removeSocket(userId, ws) {
  const set = users.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) users.delete(userId);
}

function sendToUser(userId, obj) {
  const set = users.get(userId);
  if (!set) return;
  const data = JSON.stringify(obj);
  for (const ws of set) {
    if (ws.readyState === 1) ws.send(data);
  }
}

wss.on("connection", (ws) => {
  ws.userId = null;

  ws.on("message", (raw) => {
    let payload;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // 1) First message: register
    if (payload.type === "hello") {
      const userId = Number(payload.userId);
      if (!Number.isFinite(userId) || userId <= 0) return;

      ws.userId = userId;
      addSocket(userId, ws);

      ws.send(JSON.stringify({ type: "hello-ack", userId }));
      return;
    }

    // 2) Chat messages
    if (payload.type === "chat-message") {
      const { fromUserId, toUserId, text, time, clientMsgId } = payload;

      if (!fromUserId || !toUserId || !text) return;

      // basic integrity check: sender must match registered socket user
      if (ws.userId !== fromUserId) return;

      const msg = {
        type: "chat-message",
        fromUserId,
        toUserId,
        text,
        time,
        clientMsgId,
      };

      // Deliver to recipient only
      sendToUser(toUserId, msg);

      // Optional: echo back to sender (usually not needed if UI already appends locally)
      // sendToUser(fromUserId, msg);

      return;
    }
  });

  ws.on("close", () => {
    if (ws.userId != null) removeSocket(ws.userId, ws);
  });
});

console.log("WS server running on ws://localhost:8080");
``;
