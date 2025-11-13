const DB_NAME = 'noteApp';
const STORE_NAME = 'notes';
interface Note {
  id: number;
  content: string;
  updatedAt: number;
}
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBRequest).result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onerror = (e) => {
      reject('Error opening database');
    };
    request.onsuccess = (e) => {
      resolve((e.target as IDBRequest).result);
    };
  });
};
// Get or create the note
const getNote = async (): Promise<Note | null> => {
  // Try to get from IndexedDB first
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(1);
    
    const note = await new Promise<Note | null>((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log('Note loaded from IndexedDB');
          resolve(result);
        } else {
          // Try localStorage as fallback
          const backup = localStorage.getItem('noteApp_backup');
          if (backup) {
            console.log('Note loaded from localStorage backup');
            resolve({
              id: 1,
              content: backup,
              updatedAt: parseInt(localStorage.getItem('noteApp_backup_time') || '0', 10)
            });
          } else {
            resolve(null);
          }
        }
      };
      request.onerror = () => {
        // Try localStorage as fallback
        const backup = localStorage.getItem('noteApp_backup');
        if (backup) {
          console.log('Note loaded from localStorage backup (IndexedDB error)');
          resolve({
            id: 1,
            content: backup,
            updatedAt: parseInt(localStorage.getItem('noteApp_backup_time') || '0', 10)
          });
        } else {
          reject('Error getting note');
        }
      };
    });
    
    return note;
  } catch (error) {
    // Fallback to localStorage
    const backup = localStorage.getItem('noteApp_backup');
    if (backup) {
      console.log('Note loaded from localStorage backup (catch)');
      return {
        id: 1,
        content: backup,
        updatedAt: parseInt(localStorage.getItem('noteApp_backup_time') || '0', 10)
      };
    }
    throw error;
  }
};

// Save or update the note
const saveNote = async (content: string): Promise<Note> => {
  // Also save to localStorage as backup
  try {
    localStorage.setItem('noteApp_backup', content);
    localStorage.setItem('noteApp_backup_time', Date.now().toString());
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }

  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  // Get existing note first
  const existingRequest = store.get(1);
  const existingNote = await new Promise<Note | null>((resolve, reject) => {
    existingRequest.onsuccess = () => {
      const result = existingRequest.result as Note | undefined;
      resolve(result || null);
    };
    existingRequest.onerror = () => reject('Error getting existing note');
  });
  
  const note: Note = existingNote
    ? { id: existingNote.id, content, updatedAt: Date.now() }
    : { id: 1, content, updatedAt: Date.now() };
  
  const putRequest = store.put(note);
  return new Promise((resolve, reject) => {
    putRequest.onsuccess = () => {
      console.log('Note saved successfully to IndexedDB');
      resolve(note);
    };
    putRequest.onerror = () => {
      console.error('Error saving to IndexedDB, but saved to localStorage');
      // Even if IndexedDB fails, we saved to localStorage
      resolve(note);
    };
    transaction.oncomplete = () => {
      // Transaction completed
    };
    transaction.onerror = () => {
      console.error('Transaction error, but saved to localStorage');
      resolve(note); // Don't reject, we have localStorage backup
    };
  });
};

export { getNote, saveNote };
export type { Note };