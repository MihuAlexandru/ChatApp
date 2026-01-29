/** ---------------- Clasa ServerConnection ---------------- */
// socket tine socketul curent
// url e url-ul websocketului
//queue e lista cu mesaje ce asteapta sa fie trimise
//

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

    /// dam publish si log la event de "open"
    /// trimitem orice mesaje mai erau ramase in queue
    this.#socket.addEventListener("open", (ev) => {
      console.log("[WS] open", this.#url, ev);
      this.publish("open", ev);

      while (this.#queue.length) {
        this.#socket.send(this.#queue.shift());
      }
    });

    /// adaugam event listener de close
    this.#socket.addEventListener("close", (ev) => {
      console.log("[WS] close", ev.code, ev.reason);
      this.publish("close", ev);
    });

    /// adaugam event listener de eroare
    this.#socket.addEventListener("error", (ev) => {
      console.log("[WS] error", ev);
      this.publish("error", ev);
    });

    /// adaugam event listener pentru mesaje
    /// daca e JSON il parseaza, daca nu atunci ramane text
    this.#socket.addEventListener("message", (ev) => {
      let payload = ev.data;
      try {
        payload = JSON.parse(ev.data);
      } catch {}
      console.log("[WS] recv", payload);
      this.publish("message", payload);
    });
  }

  /// functia de trimitere mesaje
  /// daca e JSON trimite text, daca nu trimite normal
  /// daca socketul nu e gata atunci punem in queue
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
