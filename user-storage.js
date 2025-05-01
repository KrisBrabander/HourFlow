/**
 * user-storage.js - DEFINITIEVE VERSIE
 * Zorgt voor gebruikersspecifieke gegevensopslag in localStorage
 * Elke gebruiker heeft zijn eigen geïsoleerde gegevens
 */

// Eenvoudige implementatie van userStorage
const userStorage = {
    // Debug mode
    debug: true,
    
    // Gebruikers-ID
    userId: null,
    
    // Geeft aan of de module is geïnitialiseerd
    initialized: false,
    
    // Log een bericht naar de console
    log: function(message, data) {
        if (this.debug) {
            if (data !== undefined) {
                console.log(`[UserStorage] ${message}`, data);
            } else {
                console.log(`[UserStorage] ${message}`);
            }
        }
    },
    
    // Initialiseer de module
    init: function() {
        if (this.initialized) {
            this.log('Already initialized');
            return true;
        }
        
        try {
            // Haal gebruiker op uit localStorage
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
            console.warn('[UserStorage] No user logged in, user-specific storage not possible');
            return false;
        } catch (e) {
            console.error('[UserStorage] Error initializing:', e);
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
    
    // Maak een gebruikersspecifieke sleutel
    getUserKey: function(key) {
        if (!this.initialized) {
            this.init();
        }
        
        if (!this.userId) {
            this.log(`No user logged in, using global key: ${key}`);
            return key;
        }
        
        const userKey = `user_${this.userId}_${key}`;
        return userKey;
    },
    
    // Haal een item op uit localStorage
    getItem: function(key, defaultValue = null) {
        if (!this.initialized) {
            this.init();
        }
        
        const userKey = this.getUserKey(key);
        try {
            const value = localStorage.getItem(userKey);
            if (value !== null) {
                this.log(`Item retrieved: ${key}`);
                return value;
            }
            this.log(`No item found: ${key}, using default value`);
            return defaultValue;
        } catch (e) {
            console.error(`[UserStorage] Error retrieving ${key}:`, e);
            return defaultValue;
        }
    },
    
    // Sla een item op in localStorage
    setItem: function(key, value) {
        if (!this.initialized) {
            this.init();
        }
        
        const userKey = this.getUserKey(key);
        try {
            localStorage.setItem(userKey, value);
            this.log(`Item stored: ${key}`);
            return true;
        } catch (e) {
            console.error(`[UserStorage] Error storing ${key}:`, e);
            return false;
        }
    },
    
    // Verwijder een item uit localStorage
    removeItem: function(key) {
        if (!this.initialized) {
            this.init();
        }
        
        const userKey = this.getUserKey(key);
        try {
            localStorage.removeItem(userKey);
            this.log(`Item removed: ${key}`);
            return true;
        } catch (e) {
            console.error(`[UserStorage] Error removing ${key}:`, e);
            return false;
        }
    },
    
    // Haal een JSON-item op uit localStorage
    getJSON: function(key, defaultValue = null) {
        try {
            const value = this.getItem(key);
            if (value === null) {
                return defaultValue;
            }
            
            const parsedValue = JSON.parse(value);
            this.log(`JSON retrieved: ${key}`);
            return parsedValue;
        } catch (e) {
            console.error(`[UserStorage] Error parsing JSON for ${key}:`, e);
            return defaultValue;
        }
    },
    
    // Sla een JSON-item op in localStorage
    setJSON: function(key, value) {
        try {
            const jsonValue = JSON.stringify(value);
            const result = this.setItem(key, jsonValue);
            this.log(`JSON stored: ${key}`);
            return result;
        } catch (e) {
            console.error(`[UserStorage] Error converting to JSON for ${key}:`, e);
            return false;
        }
    },
    
    // Migreer bestaande gegevens van algemene localStorage naar gebruikersspecifieke localStorage
    migrateData: function(keys) {
        if (!this.initialized) {
            if (!this.init()) {
                console.warn('[UserStorage] No user logged in, migration not possible');
                return false;
            }
        }
        
        console.log(`[UserStorage] Migrating data to user ${this.userId}...`);
        let migrated = 0;
        
        keys.forEach(key => {
            try {
                // Controleer of er al gebruikersspecifieke gegevens zijn
                const userKey = this.getUserKey(key);
                if (localStorage.getItem(userKey) !== null) {
                    this.log(`User-specific data for ${key} already exists`);
                    return;
                }
                
                // Haal de algemene gegevens op
                const value = localStorage.getItem(key);
                if (value !== null) {
                    // Sla de gegevens op onder de gebruikersspecifieke sleutel
                    localStorage.setItem(userKey, value);
                    this.log(`Data for ${key} migrated to user-specific storage`);
                    migrated++;
                } else {
                    this.log(`No data found for ${key}, nothing to migrate`);
                }
            } catch (e) {
                console.error(`[UserStorage] Error migrating ${key}:`, e);
            }
        });
        
        console.log(`[UserStorage] Migration completed: ${migrated} items migrated`);
        return true;
    },
    
    // Test de userStorage module
    test: function() {
        if (!this.initialized) {
            if (!this.init()) {
                console.warn('[UserStorage] Test failed: No user logged in');
                return false;
            }
        }
        
        try {
            const testData = { test: true, timestamp: Date.now() };
            this.setJSON('__test', testData);
            const retrievedData = this.getJSON('__test');
            
            const success = JSON.stringify(testData) === JSON.stringify(retrievedData);
            if (success) {
                console.log('[UserStorage] Test successful: Data integrity verified');
            } else {
                console.error('[UserStorage] Test failed: Data integrity issue');
            }
            
            this.removeItem('__test');
            return success;
        } catch (e) {
            console.error('[UserStorage] Test failed:', e);
            return false;
        }
    }
};

// Initialiseer userStorage direct bij het laden van het script
(function() {
    console.log('[UserStorage] Auto-initializing...');
    userStorage.init();
})();

// Export the userStorage module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = userStorage;
}
