/**
 * firebase-storage.js - EENVOUDIGE VERSIE
 * Zorgt voor gebruikersspecifieke gegevensopslag in Firebase Cloud Firestore
 * Synchroniseert gegevens tussen verschillende apparaten en browsers
 */

// Firebase Storage Manager - Eenvoudige Versie
const firebaseStorage = {
    // Debug mode
    debug: true,
    
    // Firebase modules
    firebase: null,
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
            this.log('Initializing Firebase Storage...');
            
            // Importeer Firebase modules
            const firebase = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
            const firestore = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
            const auth = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
            
            // Firebase configuratie
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
            const app = firebase.initializeApp(firebaseConfig, "firebaseStorage");
            this.db = firestore.getFirestore(app);
            this.auth = auth.getAuth(app);
            
            // Bewaar Firebase modules
            this.firebase = {
                app: firebase,
                firestore: firestore,
                auth: auth
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
    
    // Sla een JSON-item op in Firebase
    saveData: async function(key, data) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.userId) {
            this.log('No user logged in, cannot save data to Firebase');
            return false;
        }
        
        try {
            this.log(`Saving data to Firebase: ${key}`);
            
            // Maak een document reference
            const docRef = this.firebase.firestore.doc(this.db, `users/${this.userId}/data/${key}`);
            
            // Sla de data op
            await this.firebase.firestore.setDoc(docRef, {
                value: data,
                updatedAt: new Date().toISOString()
            });
            
            this.log(`Data saved to Firebase: ${key}`);
            return true;
        } catch (e) {
            console.error(`[FirebaseStorage] Error saving data to Firebase: ${key}`, e);
            return false;
        }
    },
    
    // Haal een JSON-item op uit Firebase
    loadData: async function(key, defaultValue = null) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.userId) {
            this.log('No user logged in, cannot load data from Firebase');
            return defaultValue;
        }
        
        try {
            this.log(`Loading data from Firebase: ${key}`);
            
            // Maak een document reference
            const docRef = this.firebase.firestore.doc(this.db, `users/${this.userId}/data/${key}`);
            
            // Haal de data op
            const docSnap = await this.firebase.firestore.getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.log(`Data loaded from Firebase: ${key}`, data.value);
                return data.value;
            }
            
            this.log(`No data found in Firebase: ${key}, using default value`);
            return defaultValue;
        } catch (e) {
            console.error(`[FirebaseStorage] Error loading data from Firebase: ${key}`, e);
            return defaultValue;
        }
    },
    
    // Synchroniseer data tussen localStorage en Firebase
    sync: async function(keys) {
        if (!this.initialized) {
            if (!await this.init()) {
                this.log('Could not initialize Firebase Storage, sync not possible');
                return false;
            }
        }
        
        if (!this.userId) {
            this.log('No user logged in, sync not possible');
            return false;
        }
        
        this.log(`Syncing data for user: ${this.userId}`);
        let syncedItems = 0;
        
        // Gebruikersprefix voor localStorage
        const userPrefix = `user_${this.userId}_`;
        
        // Synchroniseer elke key
        for (const key of keys) {
            try {
                // Haal data op uit Firebase
                const firebaseData = await this.loadData(key);
                
                // Haal data op uit localStorage
                let localData = null;
                const localValue = localStorage.getItem(userPrefix + key);
                if (localValue) {
                    try {
                        localData = JSON.parse(localValue);
                    } catch (e) {
                        localData = localValue;
                    }
                }
                
                // STRATEGIE: Firebase heeft data, localStorage niet
                if (firebaseData && !localData) {
                    try {
                        localStorage.setItem(userPrefix + key, JSON.stringify(firebaseData));
                        this.log(`Sync: Firebase → Local for ${key}`);
                        syncedItems++;
                    } catch (e) {
                        console.error(`Error syncing Firebase → Local for ${key}:`, e);
                    }
                }
                // STRATEGIE: localStorage heeft data, Firebase niet
                else if (!firebaseData && localData) {
                    try {
                        await this.saveData(key, localData);
                        this.log(`Sync: Local → Firebase for ${key}`);
                        syncedItems++;
                    } catch (e) {
                        console.error(`Error syncing Local → Firebase for ${key}:`, e);
                    }
                }
                // STRATEGIE: Beide hebben data, gebruik nieuwste
                else if (firebaseData && localData) {
                    // Voor nu gebruiken we Firebase als bron van waarheid
                    try {
                        localStorage.setItem(userPrefix + key, JSON.stringify(firebaseData));
                        this.log(`Sync: Firebase → Local for ${key} (conflict resolution)`);
                        syncedItems++;
                    } catch (e) {
                        console.error(`Error resolving conflict for ${key}:`, e);
                    }
                }
            } catch (e) {
                console.error(`Error syncing ${key}:`, e);
            }
        }
        
        this.log(`Sync completed: ${syncedItems} items synchronized`);
        return syncedItems > 0;
    }
};

// Export the firebaseStorage module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseStorage;
}
