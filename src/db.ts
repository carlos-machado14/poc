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
      console.log('Attempting to load from IndexedDB...');
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(1);
      
      const note = await new Promise<Note | null>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('IndexedDB request timeout');
          resolve(null);
        }, 5000); // 5 second timeout

        request.onsuccess = () => {
          clearTimeout(timeout);
          const result = request.result;
          if (result) {
            console.log('✅ Note loaded from IndexedDB:', result);
            resolve(result);
          } else {
            console.log('No note found in IndexedDB');
            resolve(null);
          }
        };
        
        request.onerror = (event) => {
          clearTimeout(timeout);
          const error = (event.target as IDBRequest).error;
          console.warn('❌ IndexedDB get error:', error);
          resolve(null);
        };
      });
      
      db.close();
      
      if (note) {
        return note;
      }
    } catch (error) {
      console.warn('❌ Error loading from IndexedDB:', error);
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
      console.log('Attempting to save to IndexedDB...');
      const db = await openDB();
      console.log('IndexedDB opened successfully');
      
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const putRequest = store.put(note);
      
      await new Promise<void>((resolve) => {
        let resolved = false;
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.warn('⚠️ IndexedDB save timeout after 5s, but saved to localStorage');
            resolve();
          }
        }, 5000); // 5 second timeout

        // Log transaction events
        transaction.onerror = (event) => {
          const error = (event.target as IDBTransaction).error;
          console.error('❌ IndexedDB transaction error:', error);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        };
        
        transaction.oncomplete = () => {
          console.log('✅ IndexedDB transaction completed');
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        };
        
        transaction.onabort = () => {
          console.warn('⚠️ IndexedDB transaction aborted');
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        };

        putRequest.onsuccess = () => {
          console.log('✅ Note put request successful, waiting for transaction...');
          // Transaction will complete automatically, oncomplete will resolve
        };
        
        putRequest.onerror = (event) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            const error = (event.target as IDBRequest).error;
            console.error('❌ IndexedDB put error:', error);
            console.warn('⚠️ Saved to localStorage instead');
            resolve(); // Don't reject, we have localStorage
          }
        };
      });
      
      db.close();
      console.log('IndexedDB connection closed');
    } catch (error) {
      console.error('❌ Error saving to IndexedDB:', error);
      console.warn('⚠️ Saved to localStorage instead');
      // Continue anyway, localStorage is saved
    }
  } else {
    console.warn('IndexedDB not available, using localStorage only');
  }

  return note;
};

// Helper function to verify IndexedDB is working
const verifyIndexedDB = async (): Promise<boolean> => {
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB is not available');
    return false;
  }

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();
    
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    
    db.close();
    console.log(`IndexedDB verification: ${count} note(s) found`);
    return true;
  } catch (error) {
    console.error('IndexedDB verification failed:', error);
    return false;
  }
};

export { getNote, saveNote, verifyIndexedDB };
export type { Note };