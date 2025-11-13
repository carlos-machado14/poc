const DB_NAME = 'noteApp';
const STORE_NAME = 'notes';
interface Note {
  id: number;
  content: string;
  updatedAt: number;
}

// Check if IndexedDB is available
const isIndexedDBAvailable = (): boolean => {
  try {
    return 'indexedDB' in window && indexedDB !== null;
  } catch (e) {
    return false;
  }
};

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (e) => {
      try {
        const db = (e.target as IDBRequest).result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      } catch (error) {
        console.error('Error upgrading database:', error);
      }
    };
    
    request.onerror = (e) => {
      const error = (e.target as IDBRequest).error;
      console.error('Error opening IndexedDB:', error);
      reject(error || new Error('Error opening database'));
    };
    
    request.onsuccess = (e) => {
      const db = (e.target as IDBRequest).result;
      resolve(db);
    };
    
    request.onblocked = () => {
      console.warn('IndexedDB blocked - another tab may be using it');
    };
  });
};
// Get or create the note
const getNote = async (): Promise<Note | null> => {
  // First, try localStorage (more reliable in production)
  if (isLocalStorageAvailable()) {
    try {
      const backup = localStorage.getItem('noteApp_backup');
      if (backup) {
        console.log('Note loaded from localStorage');
        return {
          id: 1,
          content: backup,
          updatedAt: parseInt(localStorage.getItem('noteApp_backup_time') || '0', 10)
        };
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }

  // Then try IndexedDB
  if (isIndexedDBAvailable()) {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(1);
      
      const note = await new Promise<Note | null>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('IndexedDB request timeout'));
        }, 5000); // 5 second timeout

        request.onsuccess = () => {
          clearTimeout(timeout);
          const result = request.result;
          if (result) {
            console.log('Note loaded from IndexedDB');
            resolve(result);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => {
          clearTimeout(timeout);
          console.warn('IndexedDB get error, returning null');
          resolve(null);
        };
      });
      
      if (note) {
        return note;
      }
    } catch (error) {
      console.warn('Error loading from IndexedDB:', error);
    }
  }

  // Return null if nothing found
  return null;
};

// Save or update the note
const saveNote = async (content: string): Promise<Note> => {
  const now = Date.now();
  const note: Note = { id: 1, content, updatedAt: now };

  // Save to localStorage FIRST (most reliable)
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem('noteApp_backup', content);
      localStorage.setItem('noteApp_backup_time', now.toString());
      console.log('Note saved to localStorage');
    } catch (e) {
      console.error('Could not save to localStorage:', e);
    }
  }

  // Then try to save to IndexedDB (optional, localStorage is primary)
  if (isIndexedDBAvailable()) {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const putRequest = store.put(note);
      
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('IndexedDB save timeout, but saved to localStorage');
          resolve();
        }, 3000); // 3 second timeout

        putRequest.onsuccess = () => {
          clearTimeout(timeout);
          console.log('Note saved to IndexedDB');
          resolve();
        };
        
        putRequest.onerror = () => {
          clearTimeout(timeout);
          console.warn('Error saving to IndexedDB, but saved to localStorage');
          resolve(); // Don't reject, we have localStorage
        };
        
        transaction.oncomplete = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        transaction.onerror = () => {
          clearTimeout(timeout);
          console.warn('Transaction error, but saved to localStorage');
          resolve();
        };
      });
    } catch (error) {
      console.warn('Error saving to IndexedDB:', error);
      // Continue anyway, localStorage is saved
    }
  }

  return note;
};

export { getNote, saveNote };
export type { Note };