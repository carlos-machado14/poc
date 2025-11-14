// db.ts
const DB_NAME = 'noteApp';
const STORE_NAME = 'notes';

export interface Note {
  id: number;
  content: string;
  updatedAt: number;
}

// ---------------------------
// Utils de disponibilidade
// ---------------------------
const isIndexedDBAvailable = (): boolean => {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
};

const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// ---------------------------
// IndexedDB helpers
// ---------------------------
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBRequest).result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onerror = () => {
      reject(request.error || new Error('Error opening database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

const getNoteFromIndexedDB = async (): Promise<Note | null> => {
  if (!isIndexedDBAvailable()) return null;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(1);

    const note = await new Promise<Note | null>((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });

    db.close();
    return note;
  } catch {
    return null;
  }
};

const saveNoteToIndexedDB = async (note: Note): Promise<void> => {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put(note);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction error'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });

    db.close();
  } catch {
    // silencioso: IndexedDB é opcional, localStorage já salvou
  }
};

// ---------------------------
// localStorage helpers
// ---------------------------
const LOCAL_KEY_CONTENT = 'noteApp_backup';
const LOCAL_KEY_TIME = 'noteApp_backup_time';

const getNoteFromLocalStorage = (): Note | null => {
  if (!isLocalStorageAvailable()) return null;

  try {
    const content = localStorage.getItem(LOCAL_KEY_CONTENT);
    const updatedAtStr = localStorage.getItem(LOCAL_KEY_TIME);

    if (!content || !updatedAtStr) return null;

    const updatedAt = parseInt(updatedAtStr, 10) || Date.now();

    return {
      id: 1,
      content,
      updatedAt,
    };
  } catch {
    return null;
  }
};

const saveNoteToLocalStorage = (note: Note): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(LOCAL_KEY_CONTENT, note.content);
    localStorage.setItem(LOCAL_KEY_TIME, note.updatedAt.toString());
  } catch {
    // se falhar, segue a vida, IndexedDB ainda pode salvar
  }
};

// ---------------------------
// API pública
// ---------------------------
export const getNote = async (): Promise<Note | null> => {
  // 1. tenta localStorage (mais simples e rápido)
  const localNote = getNoteFromLocalStorage();

  if (localNote) {
    return localNote;
  }

  // 2. fallback: IndexedDB
  const indexedDBNote = await getNoteFromIndexedDB();
  return indexedDBNote;
};

export const saveNote = async (content: string): Promise<Note> => {
  const note: Note = {
    id: 1,
    content,
    updatedAt: Date.now(),
  };

  // Sempre salva em localStorage
  saveNoteToLocalStorage(note);

  // Tenta salvar em IndexedDB (sem travar UI)
  saveNoteToIndexedDB(note).catch(() => {
    // ignorado, localStorage já está ok
  });

  return note;
};

// Opcional: helper de debug
export const verifyIndexedDB = async (): Promise<boolean> => {
  if (!isIndexedDBAvailable()) return false;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countRequest = store.count();

    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    db.close();
    console.log(`IndexedDB: ${count} note(s) stored`);
    return true;
  } catch {
    return false;
  }
};
