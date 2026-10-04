// src/lib/db/localStorageStore.js
// Swappable localStorage data adapter for Ventora (MongoDB-shaped collections)

const PREFIX = "ventora:v1:";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Mirror every change to MongoDB. Fire-and-forget: if the server is off, the app still works.
function syncToServer(collection, payload) {
  try {
    fetch(`${API_URL}/api/sync/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export const COLLECTIONS = [
  "users",
  "ideas",
  "tokenLedger",
  "connectionRequests",
  "conversations",
  "messages",
  "savedIdeas"
];

function getKey(collection) {
  return `${PREFIX}${collection}`;
}

export function initStorage() {
  try {
    const metaKey = `${PREFIX}meta`;
    const metaStr = localStorage.getItem(metaKey);
    if (!metaStr) {
      const meta = {
        version: 1,
        initializedAt: new Date().toISOString(),
        counters: {
          users: 1000,
          ideas: 100
        },
        ignoredRequests: []
      };
      localStorage.setItem(metaKey, JSON.stringify(meta));

      // Ensure empty arrays for all collections
      for (const col of COLLECTIONS) {
        if (!localStorage.getItem(getKey(col))) {
          localStorage.setItem(getKey(col), JSON.stringify([]));
        }
      }
    }
  } catch (err) {
    console.error("Storage initialization failed:", err);
  }
}

export function getMeta() {
  try {
    const metaStr = localStorage.getItem(`${PREFIX}meta`);
    return metaStr ? JSON.parse(metaStr) : null;
  } catch {
    return null;
  }
}

export function updateMeta(updater) {
  try {
    const meta = getMeta() || { version: 1, counters: { users: 1000 } };
    const updated = typeof updater === "function" ? updater(meta) : { ...meta, ...updater };
    localStorage.setItem(`${PREFIX}meta`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Error updating meta:", err);
    return null;
  }
}

export function read(collection) {
  try {
    const raw = localStorage.getItem(getKey(collection));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`Error reading collection ${collection}:`, err);
    return [];
  }
}

export function write(collection, docs) {
  try {
    localStorage.setItem(getKey(collection), JSON.stringify(docs));
    // Dispatch local live sync event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ventora:db", { detail: { collection } })
      );
    }
    return docs;
  } catch (err) {
    console.error(`Error writing collection ${collection}:`, err);
    throw err;
  }
}

export function insert(collection, doc) {
  const docs = read(collection);
  const newDoc = {
    _id: doc._id || crypto.randomUUID(),
    createdAt: doc.createdAt || new Date().toISOString(),
    ...doc
  };
  docs.push(newDoc);
  write(collection, docs);
  syncToServer(collection, { op: "upsert", docs: [newDoc] });
  return newDoc;
}

export function updateOne(collection, _id, patch) {
  const docs = read(collection);
  const index = docs.findIndex((d) => d._id === _id);
  if (index === -1) return null;

  const updatedDoc = {
    ...docs[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  docs[index] = updatedDoc;
  write(collection, docs);
  syncToServer(collection, { op: "upsert", docs: [updatedDoc] });
  return updatedDoc;
}

export function remove(collection, _id) {
  const docs = read(collection);
  const filtered = docs.filter((d) => d._id !== _id);
  write(collection, filtered);
  syncToServer(collection, { op: "remove", id: _id });
  return true;
}

export function find(collection, predicate) {
  const docs = read(collection);
  return predicate ? docs.filter(predicate) : docs;
}

export function findById(collection, _id) {
  const docs = read(collection);
  return docs.find((d) => d._id === _id) || null;
}

export function clearAll() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }
    // Remove session
    keysToRemove.push("ventora:v1:session");
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    initStorage();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ventora:db", { detail: { collection: "all" } }));
    }
  } catch (err) {
    console.error("Error clearing local data:", err);
  }
}

// Auto-initialize on import
initStorage();
