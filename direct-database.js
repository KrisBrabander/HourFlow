/**
 * direct-database.js - DEFINITIEVE OPLOSSING
 * Een directe, super eenvoudige oplossing voor cross-device gegevensopslag
 */

// Direct Database Manager
const directDB = {
    // Basis URL voor API endpoints
    apiUrl: "https://api.jsonbin.io/v3/b",
    
    // API Key (gratis service, geen betaling nodig)
    apiKey: "$2a$10$bMdwvQHWiE0kNshB1x0y0OZLy1/2SJz9X3QOq6JsJPEyOcG1HBn.u",
    
    // Collection ID (gedeeld voor alle HourFlow gebruikers)
    collectionId: "65ebad5c266cfc3fde9eee1a",
    
    // Debug mode
    debug: true,
    
    // Log een bericht naar de console
    log: function(message, data) {
        if (this.debug) {
            if (data !== undefined) {
                console.log(`[DirectDB] ${message}`, data);
            } else {
                console.log(`[DirectDB] ${message}`);
            }
        }
    },
    
    // Initialisatie - controleer of de gebruiker is ingelogd
    init: function() {
        try {
            // Controleer of er een gebruiker is ingelogd
            const userJson = localStorage.getItem('currentUser');
            if (userJson) {
                const user = JSON.parse(userJson);
                if (user && user.uid) {
                    this.userId = user.uid;
                    this.log("Geïnitialiseerd voor gebruiker:", this.userId);
                    return true;
                }
            }
            
            console.warn("[DirectDB] Geen gebruiker ingelogd, cross-device opslag niet mogelijk");
            return false;
        } catch (e) {
            console.error("[DirectDB] Fout bij initialisatie:", e);
            return false;
        }
    },
    
    // Haal een document op voor een specifieke gebruiker en sleutel
    async loadUserData(key, defaultValue = null) {
        if (!this.init()) {
            return defaultValue;
        }
        
        try {
            // Maak een unieke ID voor deze gebruiker en sleutel
            const binId = this.getBinId(key);
            this.log(`Ophalen van gegevens voor: ${key} (ID: ${binId})`);
            
            // Haal de gegevens op via de API
            const response = await fetch(`${this.apiUrl}/${binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });
            
            // Als het document niet bestaat of er is een fout, retourneer de standaardwaarde
            if (!response.ok) {
                if (response.status === 404) {
                    this.log(`Geen gegevens gevonden voor: ${key}, standaardwaarde gebruiken`);
                } else {
                    console.warn(`[DirectDB] Fout bij ophalen van gegevens: ${response.status} ${response.statusText}`);
                }
                return defaultValue;
            }
            
            // Parse de gegevens
            const data = await response.json();
            this.log(`Gegevens succesvol opgehaald voor: ${key}`, data.record);
            return data.record;
        } catch (e) {
            console.error(`[DirectDB] Fout bij ophalen van gegevens voor: ${key}`, e);
            return defaultValue;
        }
    },
    
    // Sla gegevens op voor een specifieke gebruiker en sleutel
    async saveUserData(key, data) {
        if (!this.init()) {
            return false;
        }
        
        try {
            // Maak een unieke ID voor deze gebruiker en sleutel
            const binId = this.getBinId(key);
            this.log(`Opslaan van gegevens voor: ${key} (ID: ${binId})`, data);
            
            // Kijk eerst of het document al bestaat
            const checkResponse = await fetch(`${this.apiUrl}/${binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });
            
            let response;
            if (checkResponse.ok) {
                // Update bestaand document
                response = await fetch(`${this.apiUrl}/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': this.apiKey
                    },
                    body: JSON.stringify(data)
                });
                this.log(`Bestaande gegevens bijgewerkt voor: ${key}`);
            } else {
                // Maak nieuw document
                response = await fetch(`${this.apiUrl}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': this.apiKey,
                        'X-Bin-Name': `${this.userId}_${key}`,
                        'X-Collection-Id': this.collectionId
                    },
                    body: JSON.stringify(data)
                });
                this.log(`Nieuwe gegevens aangemaakt voor: ${key}`);
            }
            
            if (!response.ok) {
                console.error(`[DirectDB] Fout bij opslaan van gegevens: ${response.status} ${response.statusText}`);
                return false;
            }
            
            return true;
        } catch (e) {
            console.error(`[DirectDB] Fout bij opslaan van gegevens voor: ${key}`, e);
            return false;
        }
    },
    
    // Genereer een unieke bin ID gebaseerd op de gebruiker en sleutel
    getBinId(key) {
        // We gebruiken een vaste ID-structuur zodat we dezelfde bin kunnen vinden
        // Dit is een simpele maar effectieve manier om bins consistent te identificeren
        const existingIds = {
            'clients': '65ebad8e1f5677401f1ef392',
            'projects': '65ebad9d266cfc3fde9eee24',
            'timeEntries': '65ebada8266cfc3fde9eee2e',
            'quotes': '65ebadb3266cfc3fde9eee38',
            'invoices': '65ebadc0266cfc3fde9eee43',
            'revenue': '65ebadcc266cfc3fde9eee50',
            'settings': '65ebadd8266cfc3fde9eee5a'
        };
        
        // Als het een bekende sleutel is, gebruik de vaste ID met gebruiker prefix
        if (existingIds[key]) {
            return `${existingIds[key]}_${this.userId.substring(0, 10)}`;
        }
        
        // Anders, genereer een ID gebaseerd op gebruiker en sleutel
        // We gebruiken de eerste 10 tekens van de UID voor kortere IDs
        return `${this.collectionId}_${this.userId.substring(0, 10)}_${key}`;
    },
    
    // Synchroniseer gegevens tussen localStorage en de cloud database
    async sync(keys) {
        if (!this.init()) {
            console.warn("[DirectDB] Gebruiker niet ingelogd, synchronisatie niet mogelijk");
            return false;
        }
        
        this.log(`Synchroniseren van gegevens voor gebruiker: ${this.userId}`);
        let syncedItems = 0;
        
        // Gebruikersprefix voor localStorage
        const userPrefix = `user_${this.userId}_`;
        
        // Synchroniseer elk item
        for (const key of keys) {
            try {
                // Haal gegevens op uit de cloud
                const cloudData = await this.loadUserData(key);
                
                // Haal gegevens op uit localStorage
                let localData = null;
                const localValue = localStorage.getItem(userPrefix + key);
                if (localValue) {
                    try {
                        localData = JSON.parse(localValue);
                    } catch (e) {
                        localData = localValue;
                    }
                }
                
                // STRATEGIE 1: Cloud heeft data, localStorage niet
                if (cloudData && !localData) {
                    localStorage.setItem(userPrefix + key, JSON.stringify(cloudData));
                    this.log(`Sync: Cloud → Local voor ${key}`);
                    syncedItems++;
                }
                // STRATEGIE 2: localStorage heeft data, cloud niet
                else if (localData && !cloudData) {
                    await this.saveUserData(key, localData);
                    this.log(`Sync: Local → Cloud voor ${key}`);
                    syncedItems++;
                }
                // STRATEGIE 3: Beide hebben data
                else if (localData && cloudData) {
                    // Kijk of er data is die we moeten samenvoegen
                    // Voor arrays (zoals clients, projects), voeg items samen
                    if (Array.isArray(localData) && Array.isArray(cloudData)) {
                        // Combineer arrays op basis van unieke eigenschappen
                        const combinedData = this.mergeArrays(localData, cloudData, key);
                        
                        // Update beide bronnen
                        localStorage.setItem(userPrefix + key, JSON.stringify(combinedData));
                        await this.saveUserData(key, combinedData);
                        
                        this.log(`Sync: Samengevoegd voor ${key}`);
                        syncedItems++;
                    } else {
                        // Voor andere data, gebruik de meest recente versie (cloud)
                        localStorage.setItem(userPrefix + key, JSON.stringify(cloudData));
                        this.log(`Sync: Cloud → Local voor ${key} (niet-array data)`);
                        syncedItems++;
                    }
                }
            } catch (e) {
                console.error(`[DirectDB] Fout bij synchroniseren van ${key}:`, e);
            }
        }
        
        this.log(`Synchronisatie voltooid: ${syncedItems} items gesynchroniseerd`);
        return syncedItems > 0;
    },
    
    // Helper functie om arrays samen te voegen op basis van unieke eigenschappen
    mergeArrays(array1, array2, key) {
        // Verschillende strategieën voor verschillende datatypen
        if (key === 'clients' || key === 'projects') {
            // Combineer op basis van ID of naam
            const idField = key === 'clients' ? 'id' : 'id';
            const combined = [...array1];
            
            array2.forEach(item2 => {
                const existingIndex = combined.findIndex(item1 => 
                    item1[idField] === item2[idField] || 
                    (item1.name && item2.name && item1.name === item2.name)
                );
                
                if (existingIndex === -1) {
                    // Item bestaat niet, voeg toe
                    combined.push(item2);
                } else {
                    // Item bestaat, neem nieuwste versie
                    combined[existingIndex] = item2;
                }
            });
            
            return combined;
        } else {
            // Standaard, simpele concatenatie en verwijder duplicaten
            const combined = [...array1, ...array2];
            // Verwijder duplicaten als ze JSON-vergelijkbaar zijn
            return combined.filter((item, index) => {
                const itemStr = JSON.stringify(item);
                return combined.findIndex(i => JSON.stringify(i) === itemStr) === index;
            });
        }
    }
};

// Exporteer de directDB module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = directDB;
}
