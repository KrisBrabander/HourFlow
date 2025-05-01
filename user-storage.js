// user-storage.js - Helper functions for user-specific localStorage storage

/**
 * Helper functions for user-specific localStorage storage
 * This ensures each user has their own isolated data storage
 */
const userStorage = {
    /**
     * Get the current user ID from localStorage
     * @returns {string} The user ID or an empty string if no user is logged in
     */
    getCurrentUserId: function() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            return currentUser.uid || '';
        } catch (e) {
            console.error('Error retrieving current user:', e);
            return '';
        }
    },
    
    /**
     * Create a user-specific key
     * @param {string} key - The base key
     * @returns {string} The user-specific key
     */
    getUserKey: function(key) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.warn('No user ID found, user-specific storage not possible');
            return key;
        }
        return `user_${userId}_${key}`;
    },
    
    /**
     * Get an item from localStorage, specific to the current user
     * @param {string} key - The key to retrieve
     * @param {*} defaultValue - The default value if no item is found
     * @returns {*} The retrieved item or the default value
     */
    getItem: function(key, defaultValue = null) {
        const userKey = this.getUserKey(key);
        try {
            const value = localStorage.getItem(userKey);
            return value !== null ? value : defaultValue;
        } catch (e) {
            console.error(`Error retrieving ${key} from localStorage:`, e);
            return defaultValue;
        }
    },
    
    /**
     * Store an item in localStorage, specific to the current user
     * @param {string} key - The key to store
     * @param {*} value - The value to store
     * @returns {boolean} True if storage succeeded, otherwise false
     */
    setItem: function(key, value) {
        const userKey = this.getUserKey(key);
        try {
            localStorage.setItem(userKey, value);
            return true;
        } catch (e) {
            console.error(`Error storing ${key} in localStorage:`, e);
            return false;
        }
    },
    
    /**
     * Remove an item from localStorage, specific to the current user
     * @param {string} key - The key to remove
     * @returns {boolean} True if removal succeeded, otherwise false
     */
    removeItem: function(key) {
        const userKey = this.getUserKey(key);
        try {
            localStorage.removeItem(userKey);
            return true;
        } catch (e) {
            console.error(`Error removing ${key} from localStorage:`, e);
            return false;
        }
    },
    
    /**
     * Get a JSON item from localStorage, specific to the current user
     * @param {string} key - The key to retrieve
     * @param {*} defaultValue - The default value if no item is found or if parsing fails
     * @returns {*} The parsed JSON item or the default value
     */
    getJSON: function(key, defaultValue = null) {
        try {
            const value = this.getItem(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error(`Error parsing JSON for ${key}:`, e);
            return defaultValue;
        }
    },
    
    /**
     * Store a JSON item in localStorage, specific to the current user
     * @param {string} key - The key to store
     * @param {*} value - The value to store (will be converted to JSON)
     * @returns {boolean} True if storage succeeded, otherwise false
     */
    setJSON: function(key, value) {
        try {
            const jsonValue = JSON.stringify(value);
            return this.setItem(key, jsonValue);
        } catch (e) {
            console.error(`Error converting to JSON for ${key}:`, e);
            return false;
        }
    },
    
    /**
     * Migrate existing data from general localStorage to user-specific localStorage
     * @param {Array<string>} keys - The keys to migrate
     */
    migrateData: function(keys) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.warn('No user ID found, migration not possible');
            return;
        }
        
        console.log(`Migrating data to user ${userId}...`);
        
        keys.forEach(key => {
            try {
                // Check if user-specific data already exists
                const userKey = this.getUserKey(key);
                if (localStorage.getItem(userKey) !== null) {
                    console.log(`User-specific data for ${key} already exists, no migration needed`);
                    return;
                }
                
                // Get the general data
                const value = localStorage.getItem(key);
                if (value !== null) {
                    // Store the data under the user-specific key
                    localStorage.setItem(userKey, value);
                    console.log(`Data for ${key} migrated to user-specific storage`);
                }
            } catch (e) {
                console.error(`Error migrating ${key}:`, e);
            }
        });
    }
};

// Export the userStorage module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = userStorage;
}
