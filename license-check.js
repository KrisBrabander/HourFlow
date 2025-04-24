// license-check.js - Client-side middleware to verify license before allowing access

// Deze functie controleert of de gebruiker een geldige licentie heeft
function checkLicense() {
  // Controleer op development mode
  const isDevelopmentMode = localStorage.getItem('devMode') === 'true' || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
  
  if (isDevelopmentMode) {
    console.log('Development mode actief - licentiecontrole overgeslagen');
    return true;
  }

  // Controleer op URL parameter licentie
  const params = new URLSearchParams(window.location.search);
  if (params.get('license')) {
    console.log('Licentie gevonden in URL parameters');
    localStorage.setItem('hourflow_license', params.get('license'));
    return true;
  }

  // Haal de licentie op uit localStorage
  const licenseKey = localStorage.getItem('hourflow_license');
  
  // Als er geen licentie is, redirect naar de licentiepagina
  if (!licenseKey) {
    redirectToLicensePage();
    return false;
  }
  
  // Voorkom redirect-lus door te controleren of we al te vaak hebben geredirect
  const redirectCount = parseInt(sessionStorage.getItem('license_redirect_count') || '0');
  if (redirectCount > 2) {
    console.log('Teveel redirects gedetecteerd, sta toegang toe om lus te voorkomen');
    return true;
  }
  
  // Eenvoudige validatie - controleer of de sleutel een minimale lengte heeft
  // of overeenkomt met een van onze testsleutels
  const testKeys = ['DEMO-KEY-1234', 'TEST-KEY-5678'];
  const isValidFormat = licenseKey.length >= 8 || testKeys.includes(licenseKey);
  
  if (isValidFormat) {
    return true;
  } else {
    localStorage.removeItem('hourflow_license');
    redirectToLicensePage();
    return false;
  }
}

// Redirect naar de licentiepagina
function redirectToLicensePage() {
  // Alleen redirecten als we nog niet op de licentiepagina zijn
  if (!window.location.pathname.includes('license.html')) {
    // Verhoog redirect teller om lussen te detecteren
    const redirectCount = parseInt(sessionStorage.getItem('license_redirect_count') || '0');
    sessionStorage.setItem('license_redirect_count', (redirectCount + 1).toString());
    
    // Markeer dat we van de licentiepagina komen
    sessionStorage.setItem('from_license_page', 'true');
    
    // Redirect naar licentiepagina
    window.location.href = '/license.html';
  }
}

// Exporteer de check functie voor gebruik in andere bestanden
export { checkLicense };
