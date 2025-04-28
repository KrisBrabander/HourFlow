// license-check.js - Client-side middleware om licentie te verifiëren voor toegang

// Deze functie controleert of de gebruiker een geldige licentie heeft
async function checkLicense() {
  // Als we op de licentiepagina of login pagina zijn, validatie overslaan
  if (window.location.pathname.includes('license.html') || window.location.pathname.includes('login.html')) {
    console.log('Op licentie- of login-pagina, validatie overgeslagen');
    return true;
  }
  
  // Controleer of we in een Firebase auth redirect zitten
  const authRedirectInProgress = sessionStorage.getItem('auth_redirect_in_progress');
  if (authRedirectInProgress === 'true') {
    console.log('Firebase auth redirect in progress, licentiecontrole overgeslagen');
    return true;
  }

  // Controleer op URL parameter licentie
  const params = new URLSearchParams(window.location.search);
  if (params.get('license')) {
    console.log('Licentie gevonden in URL parameters');
    localStorage.setItem('hourflow_license', params.get('license'));
    // Verwijder licentie uit URL om problemen te voorkomen bij vernieuwen
    if (window.history && window.history.replaceState) {
      const newUrl = window.location.pathname + 
                    (window.location.search ? window.location.search.replace(/[&?]license=[^&]+/, '') : '') + 
                    window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }

  // Controleer op development mode - ALLEEN VOOR LOKALE ONTWIKKELING
  const isDevelopmentMode = localStorage.getItem('devMode') === 'true' && 
                          (window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1');
  
  if (isDevelopmentMode) {
    console.log('Development mode actief - licentiecontrole overgeslagen');
    return true;
  }

  // Haal de licentie op uit localStorage
  const licenseKey = localStorage.getItem('hourflow_license');
  
  // Als er geen licentie is, redirect naar de licentiepagina
  if (!licenseKey) {
    console.log('Geen licentiesleutel gevonden. Doorsturen naar licentiepagina.');
    // Markeer dat we bezig zijn met een licentiecontrole om Firebase auth te laten weten
    sessionStorage.setItem('license_check_in_progress', 'true');
    redirectToLicensePage();
    return false;
  }
  
  // Valideer de licentie met een vast wachtwoord of via API
  // Sterk wachtwoord dat voor iedereen hetzelfde is
  const validPasswords = [
    'K1VngY5&k,eB#o`',  // Legacy sleutel
    'DEMO-KEY-1234',     // Demo sleutel
    'TEST-KEY-5678',     // Test sleutel
    'HOUR-FLOW-2025-PREMIUM', // Premium licentie
    'HOUR-FLOW-2025-STANDARD' // Standaard licentie
  ];
  
  // Check eerst of het een van onze bekende geldige sleutels is
  if (validPasswords.includes(licenseKey)) {
    console.log('License key verified locally, access granted');
    return true;
  }
  
  // Als het geen bekende sleutel is, probeer te verifiëren via de Gumroad API
  try {
    // Controleer of de licentie al eerder is geverifieerd en nog geldig is
    const verifiedLicense = localStorage.getItem('hourflow_verified_license');
    if (verifiedLicense === licenseKey) {
      console.log('Using previously verified license key');
      return true;
    }
    
    // Verifieer de licentie via de API
    console.log('Verifying license via API...');
    const response = await fetch('/api/verify-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });
    
    const data = await response.json();
    console.log('License verification response:', data);
    
    if (data.valid === true) {
      console.log('License verified via API, access granted');
      // Sla de geverifieerde licentie op voor toekomstig gebruik
      localStorage.setItem('hourflow_verified_license', licenseKey);
      return true;
    } else {
      console.log('Invalid license key via API. Redirecting to license page.');
      localStorage.removeItem('hourflow_license');
      // Markeer dat we bezig zijn met een licentiecontrole om Firebase auth te laten weten
      sessionStorage.setItem('license_check_in_progress', 'true');
      redirectToLicensePage();
      return false;
    }
  } catch (error) {
    console.error('Error verifying license:', error);
    
    // Bij een fout in de API, proberen we de app toch te laden als de gebruiker een licentie heeft ingevoerd
    // Dit voorkomt dat gebruikers buitengesloten worden bij API-problemen
    console.log('API error, but allowing access with existing license key');
    return true;
  }
}

// Redirect naar de licentiepagina
function redirectToLicensePage() {
  // Alleen redirecten als we nog niet op de licentiepagina zijn
  if (!window.location.pathname.includes('license.html')) {
    // Bepaal het juiste pad voor de redirect
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const licensePath = basePath + 'license.html';
    console.log('Redirecting to license page:', licensePath);
    // Markeer dat we bezig zijn met een licentiecontrole
    sessionStorage.setItem('license_check_in_progress', 'true');
    window.location.href = licensePath;
  }
}

// Exporteer de check functie voor gebruik in andere bestanden
export { checkLicense };
