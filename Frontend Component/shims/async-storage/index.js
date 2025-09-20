/*
  Minimal web shim for @react-native-async-storage/async-storage
  Uses window.localStorage when available, otherwise falls back to an in-memory Map.
*/

(function () {
  const hasLocalStorage = typeof window !== 'undefined' && window.localStorage;
  const memory = new Map();

  const get = (key) => {
    if (hasLocalStorage) {
      return window.localStorage.getItem(key);
    }
    return memory.has(key) ? memory.get(key) : null;
  };

  const set = (key, value) => {
    if (hasLocalStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    memory.set(key, value);
  };

  const remove = (key) => {
    if (hasLocalStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    memory.delete(key);
  };

  const AsyncStorage = {
    getItem(key) {
      try { return Promise.resolve(get(String(key))); } catch (e) { return Promise.reject(e); }
    },
    setItem(key, value) {
      try { set(String(key), String(value)); return Promise.resolve(); } catch (e) { return Promise.reject(e); }
    },
    removeItem(key) {
      try { remove(String(key)); return Promise.resolve(); } catch (e) { return Promise.reject(e); }
    },
    clear() {
      try {
        if (hasLocalStorage) { window.localStorage.clear(); }
        else { memory.clear(); }
        return Promise.resolve();
      } catch (e) { return Promise.reject(e); }
    },
    getAllKeys() {
      try {
        if (hasLocalStorage) {
          const keys = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k != null) keys.push(k);
          }
          return Promise.resolve(keys);
        }
        return Promise.resolve(Array.from(memory.keys()));
      } catch (e) { return Promise.reject(e); }
    },
    multiGet(keys) {
      try { return Promise.resolve(keys.map((k) => [k, get(String(k))])); } catch (e) { return Promise.reject(e); }
    },
    multiSet(pairs) {
      try { pairs.forEach(([k, v]) => set(String(k), String(v))); return Promise.resolve(); } catch (e) { return Promise.reject(e); }
    },
    multiRemove(keys) {
      try { keys.forEach((k) => remove(String(k))); return Promise.resolve(); } catch (e) { return Promise.reject(e); }
    }
  };

  // CommonJS export with default compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AsyncStorage;
    module.exports.default = AsyncStorage;
  } else if (typeof define === 'function' && define.amd) {
    define([], function () { return AsyncStorage; });
  } else {
    this.AsyncStorage = AsyncStorage;
  }
}).call(this);
