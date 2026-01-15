const DB_NAME = 'StackTaskDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

/**
 * Initializes and returns a promise resolving to the IDBDatabase instance.
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getStore(db, mode = 'readonly') {
  const tx = db.transaction(STORE_NAME, mode);
  return tx.objectStore(STORE_NAME);
}

export async function getAllTasks(userId = null) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const request = getStore(db).getAll();
    request.onsuccess = () => {
      let tasks = request.result;
      if (userId) {
        tasks = tasks.filter(t => t.userId === userId);
      }
      resolve(tasks);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveTask(task) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const request = getStore(db, 'readwrite').put(task); // .put() updates or adds
    request.onsuccess = () => resolve(task);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTask(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const request = getStore(db, 'readwrite').delete(id);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}
