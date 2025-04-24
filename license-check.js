// license-check.js - Client-side middleware om licentie te verifiëren voor toegang

// Deze functie controleert of de gebruiker een geldige licentie heeft
async function checkLicense() {
  // Als we op de licentiepagina zijn, validatie overslaan
  if (window.location.pathname.includes('license.html')) {
    console.log('Op licentiepagina, validatie overgeslagen');
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
    redirectToLicensePage();
    return false;
  }
  
  // Valideer de licentie met een vast wachtwoord
  // Sterk wachtwoord dat voor iedereen hetzelfde is
  const validPasswords = [

    'K1VngY5&k,eB#o`'  // Legacy sleutel
  ];
  
  if (validPasswords.includes(licenseKey)) {
    console.log('License key verified, access granted');
    return true;
  } else {
    console.log('Invalid license key. Redirecting to license page.');
    localStorage.removeItem('hourflow_license');
    redirectToLicensePage();
    return false;
  }
}

// Redirect naar de licentiepagina
function redirectToLicensePage() {
  // Alleen redirecten als we nog niet op de licentiepagina zijn
  if (!window.location.pathname.includes('license.html')) {
    window.location.href = '/license.html';
  }
}

// Exporteer de check functie voor gebruik in andere bestanden
export { checkLicense };
