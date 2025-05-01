/**
 * user-storage.js - v3.0
 * Zorgt voor gebruikersspecifieke gegevensopslag in localStorage
 * Elke gebruiker heeft zijn eigen geïsoleerde gegevens
 */

const userStorage = (function() {
    // Private variabelen
    let _userId = null;
    let _debug = true;
    
    // Log een bericht naar de console als debug is ingeschakeld
    function _log(message, data) {
        if (_debug) {
            if (data !== undefined) {
                console.log(`[UserStorage] ${message}`, data);
            } else {
                console.log(`[UserStorage] ${message}`);
            }
        }
    }
    
    // Haal de huidige gebruiker op uit localStorage
    function _getCurrentUser() {
        try {
            const userJson = localStorage.getItem('currentUser');
            if (!userJson) return null;
            
            const user = JSON.parse(userJson);
            return user && user.uid ? user : null;
        } catch (e) {
            console.error('[UserStorage] Error getting current user:', e);
            return null;
        }
    }
    
    // Initialiseer de module
    function _init() {
        const user = _getCurrentUser();
        if (user) {
            _userId = user.uid;
            _log(`Geïnitialiseerd voor gebruiker: ${_userId}`);
        } else {
            _userId = null;
            console.warn('[UserStorage] Geen gebruiker ingelogd, gebruikersspecifieke opslag is niet mogelijk');
        }
        return !!_userId;
    }
    
    // Maak een gebruikersspecifieke sleutel
    function _getUserKey(key) {
        if (!_userId) {
            _log(`Geen gebruiker ingelogd, gebruik globale sleutel: ${key}`);
            return key;
        }
        
        const userKey = `user_${_userId}_${key}`;
        return userKey;
    }
    
    // Public API
    return {
        // Initialiseer de module
        init: function() {
            return _init();
        },
        
        // Haal de huidige gebruikers-ID op
        getCurrentUserId: function() {
            if (!_userId) _init();
            return _userId;
        },
        
        // Haal een item op uit localStorage
        getItem: function(key, defaultValue = null) {
            if (!_userId) _init();
            const userKey = _getUserKey(key);
            
            try {
                const value = localStorage.getItem(userKey);
                if (value !== null) {
                    _log(`Item opgehaald: ${key}`);
                    return value;
                }
                _log(`Geen item gevonden: ${key}, standaardwaarde gebruikt`);
                return defaultValue;
            } catch (e) {
                console.error(`[UserStorage] Fout bij ophalen van ${key}:`, e);
                return defaultValue;
            }
        },
        
        // Sla een item op in localStorage
        setItem: function(key, value) {
            if (!_userId) _init();
            const userKey = _getUserKey(key);
            
            try {
                localStorage.setItem(userKey, value);
                _log(`Item opgeslagen: ${key}`);
                return true;
            } catch (e) {
                console.error(`[UserStorage] Fout bij opslaan van ${key}:`, e);
                return false;
            }
        },
        
        // Verwijder een item uit localStorage
        removeItem: function(key) {
            if (!_userId) _init();
            const userKey = _getUserKey(key);
            
            try {
                localStorage.removeItem(userKey);
                _log(`Item verwijderd: ${key}`);
                return true;
            } catch (e) {
                console.error(`[UserStorage] Fout bij verwijderen van ${key}:`, e);
                return false;
            }
        },
        
        // Haal een JSON-item op uit localStorage
        getJSON: function(key, defaultValue = null) {
            try {
                const value = this.getItem(key);
                if (value === null) return defaultValue;
                
                const parsedValue = JSON.parse(value);
                _log(`JSON opgehaald: ${key}`);
                return parsedValue;
            } catch (e) {
                console.error(`[UserStorage] Fout bij parsen van JSON voor ${key}:`, e);
                return defaultValue;
            }
        },
        
        // Sla een JSON-item op in localStorage
        setJSON: function(key, value) {
            try {
                const jsonValue = JSON.stringify(value);
                const result = this.setItem(key, jsonValue);
                _log(`JSON opgeslagen: ${key}`);
                return result;
            } catch (e) {
                console.error(`[UserStorage] Fout bij omzetten naar JSON voor ${key}:`, e);
                return false;
            }
        },
        
        // Migreer bestaande gegevens van algemene localStorage naar gebruikersspecifieke localStorage
        migrateData: function(keys) {
            if (!_userId) {
                if (!_init()) {
                    console.warn('[UserStorage] Geen gebruiker ingelogd, migratie is niet mogelijk');
                    return false;
                }
            }
            
            console.log(`[UserStorage] Migreren van gegevens naar gebruiker ${_userId}...`);
            let migrated = 0;
            
            keys.forEach(key => {
                try {
                    // Controleer of er al gebruikersspecifieke gegevens zijn
                    const userKey = _getUserKey(key);
                    if (localStorage.getItem(userKey) !== null) {
                        _log(`Gebruikersspecifieke gegevens voor ${key} bestaan al`);
                        return;
                    }
                    
                    // Haal de algemene gegevens op
                    const value = localStorage.getItem(key);
                    if (value !== null) {
                        // Sla de gegevens op onder de gebruikersspecifieke sleutel
                        localStorage.setItem(userKey, value);
                        _log(`Gegevens voor ${key} gemigreerd naar gebruikersspecifieke opslag`);
                        migrated++;
                    } else {
                        _log(`Geen gegevens gevonden voor ${key}, niets om te migreren`);
                    }
                } catch (e) {
                    console.error(`[UserStorage] Fout bij het migreren van ${key}:`, e);
                }
            });
            
            console.log(`[UserStorage] Migratie voltooid: ${migrated} items gemigreerd`);
            return true;
        },
        
        // Test de userStorage module
        test: function() {
            if (!_userId) {
                if (!_init()) {
                    console.warn('[UserStorage] Test mislukt: Geen gebruiker ingelogd');
                    return false;
                }
            }
            
            try {
                const testData = { test: true, timestamp: Date.now() };
                this.setJSON('__test', testData);
                const retrievedData = this.getJSON('__test');
                
                const success = JSON.stringify(testData) === JSON.stringify(retrievedData);
                if (success) {
                    console.log('[UserStorage] Test geslaagd: Gegevensintegriteit geverifieerd');
                } else {
                    console.error('[UserStorage] Test mislukt: Gegevensintegriteit probleem');
                }
                
                this.removeItem('__test');
                return success;
            } catch (e) {
                console.error('[UserStorage] Test mislukt:', e);
                return false;
            }
        }
    };
})();


// Export the userStorage module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = userStorage;
}
