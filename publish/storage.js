window.CardShop = window.CardShop || {};

window.CardShop.storage = {
  async get(key) {
    try {
      if (window.dzmm?.kv) {
        const data = await window.dzmm.kv.get(key);
        return data?.value ?? null;
      }
    } catch (err) {
      console.warn('kv get failed:', err.code, err.message);
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  },

  async put(key, value) {
    try {
      if (window.dzmm?.kv) await window.dzmm.kv.put(key, value);
    } catch (err) {
      console.warn('kv put failed:', err.code, err.message);
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  },
};
