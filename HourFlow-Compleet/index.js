// Dit bestand dient als entry point voor Vercel
// Het is aangepast om het licentiesysteem te integreren

// Importeer de licentiecontrole functie
import { checkLicense } from './license-check.js';

// Controleer licentie wanneer de pagina laadt
document.addEventListener('DOMContentLoaded', function() {
    // Controleer of gebruiker een geldige licentie heeft
    const hasValidLicense = checkLicense();
    
    // Alleen app starten als licentie geldig is
    // De checkLicense functie zal automatisch doorverwijzen naar de licentie pagina indien nodig
    if (hasValidLicense) {
        console.log('HourFlow Premium - Gebruiker heeft geldige licentie');
    }
});
