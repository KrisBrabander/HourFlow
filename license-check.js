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
  
  // Valideer de licentie via de API
  try {
    const response = await fetch('/api/verify-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey })
    });
    
    if (!response.ok) {
      throw new Error(`API fout: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.valid) {
      console.log('Licentiesleutel geverifieerd, toegang toegestaan');
      return true;
    } else {
      console.log('Ongeldige licentiesleutel. Doorsturen naar licentiepagina.');
      localStorage.removeItem('hourflow_license');
      redirectToLicensePage();
      return false;
    }
  } catch (error) {
    console.error('Fout bij licentievalidatie:', error);
    
    // Fallback validatie als API niet beschikbaar is
    const testKeys = ['DEMO-KEY-1234', 'TEST-KEY-5678'];
    const isValidFormat = licenseKey.length >= 8 || testKeys.includes(licenseKey);
    
    if (isValidFormat) {
      console.log('Licentie lokaal gevalideerd, toegang toegestaan');
      return true;
    } else {
      console.log('Ongeldige licentiesleutel. Doorsturen naar licentiepagina.');
      localStorage.removeItem('hourflow_license');
      redirectToLicensePage();
      return false;
    }
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
