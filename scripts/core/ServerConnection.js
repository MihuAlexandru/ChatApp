import { PubSub } from "./PubSub.js";

export class ServerConnection extends PubSub {
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

    if (!this.#socket || this.#socket.readyState !== WebSocket.OPEN) {
      this.#queue.push(data);
      return;
    }

    this.#socket.send(data);
  }
}
