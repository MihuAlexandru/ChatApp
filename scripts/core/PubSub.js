/** ---------------- Clasa PubSub ---------------- */
// tine un map cu event name si array de callbackuri asociate
// subscribe ca sa inregistrezi callbackuri noi pe event
// intoarce un unsubscribe function pe care il poti apela mai tarziu
// publish e ca sa activezi un event, apeleaza toate callbackurile asociate

export class PubSub {
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
