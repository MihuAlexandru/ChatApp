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
