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
  let indexedDBNote: Note | null = null;
  let localStorageNote: Note | null = null;

  // Try localStorage FIRST (more reliable in production/Vercel)
  if (isLocalStorageAvailable()) {
    try {
      const backup = localStorage.getItem('noteApp_backup');
      const backupTime = localStorage.getItem('noteApp_backup_time');
      console.log('🔍 Checking localStorage:', { 
        hasBackup: !!backup, 
        backupLength: backup?.length || 0,
        backupTime: backupTime 
      });
      
      if (backup) {
        localStorageNote = {
          id: 1,
          content: backup,
          updatedAt: parseInt(backupTime || '0', 10)
        };
        console.log('✅ Found note in localStorage, length:', backup.length);
      } else {
        console.log('ℹ️ No note found in localStorage');
      }
    } catch (e) {
      console.warn('❌ Error reading from localStorage:', e);
    }
  } else {
    console.warn('⚠️ localStorage not available');
  }

  // Also try IndexedDB as secondary source
  if (isIndexedDBAvailable()) {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(1);
      
      indexedDBNote = await new Promise<Note | null>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('⏱️ IndexedDB request timeout');
          resolve(null);
        }, 5000); // 5 second timeout

        request.onsuccess = () => {
          clearTimeout(timeout);
          const result = request.result;
          if (result) {
            console.log('✅ Found note in IndexedDB, length:', result.content?.length || 0);
          } else {
            console.log('ℹ️ No note found in IndexedDB');
          }
          resolve(result || null);
        };
        
        request.onerror = (event) => {
          clearTimeout(timeout);
          const error = (event.target as IDBRequest).error;
          console.warn('❌ IndexedDB get error:', error);
          resolve(null);
        };
      });
      
      db.close();
    } catch (error) {
      console.warn('❌ Error loading from IndexedDB:', error);
    }
  } else {
    console.warn('⚠️ IndexedDB not available');
  }

  // Return localStorage if available (most reliable), otherwise IndexedDB
  if (localStorageNote) {
    console.log('📦 Returning note from localStorage');
    return localStorageNote;
  }
  
  if (indexedDBNote) {
    console.log('📦 Returning note from IndexedDB');
    return indexedDBNote;
  }

  console.log('❌ No note found in any storage');
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
      console.log('💾 Saved to localStorage:', {
        contentLength: content.length,
        timestamp: new Date(now).toLocaleString()
      });
      
      // Verify it was saved
      const verify = localStorage.getItem('noteApp_backup');
      if (verify === content) {
        console.log('✅ localStorage save verified successfully');
      } else {
        console.warn('⚠️ localStorage save verification failed');
      }
    } catch (e) {
      console.error('❌ Could not save to localStorage:', e);
    }
  } else {
    console.warn('⚠️ localStorage not available for saving');
  }

  // Then try to save to IndexedDB (optional, localStorage is primary)
  if (isIndexedDBAvailable()) {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const putRequest = store.put(note);
      
      await new Promise<void>((resolve) => {
        let resolved = false;
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }, 5000); // 5 second timeout

        // Log transaction events only on error
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
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        };
        
        transaction.onabort = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        };

        putRequest.onsuccess = () => {
          // Transaction will complete automatically, oncomplete will resolve
        };
        
        putRequest.onerror = (event) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            const error = (event.target as IDBRequest).error;
            console.error('❌ IndexedDB put error:', error);
            resolve(); // Don't reject, we have localStorage
          }
        };
      });
      
      db.close();
    } catch (error) {
      console.error('❌ Error saving to IndexedDB:', error);
      // Continue anyway, localStorage is saved
    }
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
    
    // Also try to get the actual note to see what's stored
    if (count > 0) {
      const getRequest = store.get(1);
      await new Promise<void>((resolve) => {
        getRequest.onsuccess = () => {
          const note = getRequest.result;
          if (note) {
            console.log('IndexedDB note details:', {
              id: note.id,
              contentLength: note.content?.length || 0,
              contentPreview: note.content?.substring(0, 50) || '',
              updatedAt: new Date(note.updatedAt).toLocaleString()
            });
          }
          resolve();
        };
        getRequest.onerror = () => {
          console.warn('Could not retrieve note details');
          resolve();
        };
      });
    }
    
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