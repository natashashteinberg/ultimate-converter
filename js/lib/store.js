export const store = {
  get(key, fallback) {
    try {
      const raw = globalThis.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked or full: the app keeps working without saving */
    }
  },
};
