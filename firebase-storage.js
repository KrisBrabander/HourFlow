/**
 * firebase-storage.js
 * Zorgt voor gebruikersspecifieke gegevensopslag in Firebase Cloud Firestore
 * Synchroniseert gegevens tussen verschillende apparaten en browsers
 */

// Firebase Storage Manager
const firebaseStorage = {
    // Debug mode
    debug: true,
    
    // Firebase app en Firestore referenties
    app: null,
    db: null,
    auth: null,
    
    // Gebruikers-ID
    userId: null,
    
    // Geeft aan of de module is geïnitialiseerd
    initialized: false,
    
    // Log een bericht naar de console
    log: function(message, data) {
        if (this.debug) {
            if (data !== undefined) {
                console.log(`[FirebaseStorage] ${message}`, data);
            } else {
                console.log(`[FirebaseStorage] ${message}`);
            }
        }
    },
    
    // Initialiseer de Firebase Storage module
    init: async function() {
        if (this.initialized) {
            this.log('Already initialized');
            return true;
        }
        
        try {
            // Importeer Firebase modules
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
            const { getFirestore, collection, doc, setDoc, getDoc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
            const { getAuth } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
            
            // Firebase configuratie (gebruik dezelfde als in login.html)
            const firebaseConfig = {
                apiKey: "AIzaSyBrMzcoCMN9tXROYdJCMq9iT9NX5IW_fqE",
                authDomain: "hourflow-54a34.firebaseapp.com",
                projectId: "hourflow-54a34",
                storageBucket: "hourflow-54a34.appspot.com",
                messagingSenderId: "1068006762571",
                appId: "1:1068006762571:web:c5bfb2e1a4e9d0e9b0a8e8",
                measurementId: "G-VKXCL7NWTH"
            };
            
            // Initialiseer Firebase
            this.app = initializeApp(firebaseConfig, "firebaseStorage");
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);
            
            // Bewaar Firebase modules voor later gebruik
            this.firestore = {
                collection,
                doc,
                setDoc,
                getDoc,
                deleteDoc
            };
            
            // Haal huidige gebruiker op
            const userJson = localStorage.getItem('currentUser');
            if (userJson) {
                const user = JSON.parse(userJson);
                if (user && user.uid) {
                    this.userId = user.uid;
                    this.initialized = true;
                    this.log('Initialized for user:', this.userId);
                    return true;
                }
            }
            
            this.userId = null;
            this.initialized = false;
            console.warn('[FirebaseStorage] No user logged in, cross-device storage not possible');
            return false;
        } catch (e) {
            console.error('[FirebaseStorage] Error initializing:', e);
            this.userId = null;
            this.initialized = false;
            return false;
        }
    },
    
    // Haal de huidige gebruikers-ID op
    getCurrentUserId: function() {
        if (!this.initialized) {
            this.init();
        }
        return this.userId;
    },
    
    // Haal een item op uit Firebase
    getItem: async function(key, defaultValue = null) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.userId) {
            this.log('No user logged in, cannot get item from Firebase');
            return defaultValue;
        }
        
        try {
            const docRef = this.firestore.doc(this.db, `users/${this.userId}/data/${key}`);
            const docSnap = await this.firestore.getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.log(`Item retrieved from Firebase: ${key}`, data);
                return data.value;
            }
            
            this.log(`No item found in Firebase: ${key}, using default value`);
            return defaultValue;
        } catch (e) {
            console.error(`[FirebaseStorage] Error retrieving ${key} from Firebase:`, e);
            return defaultValue;
        }
    },
    
    // Sla een item op in Firebase
    setItem: async function(key, value) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.userId) {
            this.log('No user logged in, cannot save item to Firebase');
            return false;
        }
        
        try {
            const docRef = this.firestore.doc(this.db, `users/${this.userId}/data/${key}`);
            await this.firestore.setDoc(docRef, {
                value: value,
                updatedAt: new Date().toISOString()
            });
            
            this.log(`Item stored in Firebase: ${key}`);
            return true;
        } catch (e) {
            console.error(`[FirebaseStorage] Error storing ${key} in Firebase:`, e);
            return false;
        }
    },
    
    // Verwijder een item uit Firebase
    removeItem: async function(key) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.userId) {
            this.log('No user logged in, cannot remove item from Firebase');
            return false;
        }
        
        try {
            const docRef = this.firestore.doc(this.db, `users/${this.userId}/data/${key}`);
            await this.firestore.deleteDoc(docRef);
            
            this.log(`Item removed from Firebase: ${key}`);
            return true;
        } catch (e) {
            console.error(`[FirebaseStorage] Error removing ${key} from Firebase:`, e);
            return false;
        }
    },
    
    // Haal een JSON-item op uit Firebase
    getJSON: async function(key, defaultValue = null) {
        try {
            const value = await this.getItem(key);
            if (value === null) {
                return defaultValue;
            }
            
            this.log(`JSON retrieved from Firebase: ${key}`);
            return value;
        } catch (e) {
            console.error(`[FirebaseStorage] Error parsing JSON for ${key}:`, e);
            return defaultValue;
        }
    },
    
    // Sla een JSON-item op in Firebase
    setJSON: async function(key, value) {
        try {
            const result = await this.setItem(key, value);
            this.log(`JSON stored in Firebase: ${key}`);
            return result;
        } catch (e) {
            console.error(`[FirebaseStorage] Error storing JSON for ${key}:`, e);
            return false;
        }
    },
    
    // Migreer gegevens van localStorage naar Firebase
    migrateFromLocalStorage: async function(keys) {
        if (!this.initialized) {
            if (!await this.init()) {
                console.warn('[FirebaseStorage] No user logged in, migration not possible');
                return false;
            }
        }
        
        console.log(`[FirebaseStorage] Migrating data from localStorage to Firebase for user ${this.userId}...`);
        let migrated = 0;
        
        // Gebruikersprefix voor localStorage
        const userPrefix = `user_${this.userId}_`;
        
        for (const key of keys) {
            try {
                // Haal gegevens op uit localStorage (met gebruikersprefix)
                const value = localStorage.getItem(userPrefix + key);
                if (value !== null) {
                    try {
                        // Parse JSON als het JSON is
                        const parsedValue = JSON.parse(value);
                        await this.setJSON(key, parsedValue);
                    } catch (e) {
                        // Als het geen JSON is, sla het op als string
                        await this.setItem(key, value);
                    }
                    this.log(`Data for ${key} migrated from localStorage to Firebase`);
                    migrated++;
                } else {
                    this.log(`No data found for ${key} in localStorage, nothing to migrate`);
                }
            } catch (e) {
                console.error(`[FirebaseStorage] Error migrating ${key} from localStorage:`, e);
            }
        }
        
        console.log(`[FirebaseStorage] Migration completed: ${migrated} items migrated to Firebase`);
        return true;
    },
    
    // Synchroniseer gegevens tussen localStorage en Firebase
    syncWithLocalStorage: async function(keys) {
        if (!this.initialized) {
            if (!await this.init()) {
                console.warn('[FirebaseStorage] No user logged in, sync not possible');
                return false;
            }
        }
        
        console.log(`[FirebaseStorage] Syncing data between localStorage and Firebase for user ${this.userId}...`);
        
        // Gebruikersprefix voor localStorage
        const userPrefix = `user_${this.userId}_`;
        
        for (const key of keys) {
            try {
                // Haal gegevens op uit Firebase
                const firebaseValue = await this.getItem(key);
                
                if (firebaseValue !== null) {
                    // Firebase heeft gegevens, update localStorage
                    try {
                        if (typeof firebaseValue === 'object') {
                            localStorage.setItem(userPrefix + key, JSON.stringify(firebaseValue));
                        } else {
                            localStorage.setItem(userPrefix + key, firebaseValue);
                        }
                        this.log(`Updated localStorage from Firebase for ${key}`);
                    } catch (e) {
                        console.error(`[FirebaseStorage] Error updating localStorage from Firebase for ${key}:`, e);
                    }
                } else {
                    // Firebase heeft geen gegevens, haal op uit localStorage en update Firebase
                    const localValue = localStorage.getItem(userPrefix + key);
                    if (localValue !== null) {
                        try {
                            // Parse JSON als het JSON is
                            const parsedValue = JSON.parse(localValue);
                            await this.setJSON(key, parsedValue);
                        } catch (e) {
                            // Als het geen JSON is, sla het op als string
                            await this.setItem(key, localValue);
                        }
                        this.log(`Updated Firebase from localStorage for ${key}`);
                    }
                }
            } catch (e) {
                console.error(`[FirebaseStorage] Error syncing ${key}:`, e);
            }
        }
        
        console.log(`[FirebaseStorage] Sync completed between localStorage and Firebase`);
        return true;
    }
};

// Export the firebaseStorage module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseStorage;
}
