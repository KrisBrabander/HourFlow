// Firebase Authentication Check
// This script checks if a user is logged in and redirects to login page if not

// Debug functie om te zien wat er gebeurt
function debugLog(message) {
    console.log('[AUTH-DEBUG] ' + message);
    // Maak een debug element als het nog niet bestaat
    let debugElement = document.getElementById('auth-debug-log');
    if (!debugElement) {
        debugElement = document.createElement('div');
        debugElement.id = 'auth-debug-log';
        debugElement.style.position = 'fixed';
        debugElement.style.top = '10px';
        debugElement.style.right = '10px';
        debugElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
        debugElement.style.color = 'white';
        debugElement.style.padding = '10px';
        debugElement.style.borderRadius = '5px';
        debugElement.style.maxWidth = '80%';
        debugElement.style.maxHeight = '200px';
        debugElement.style.overflow = 'auto';
        debugElement.style.zIndex = '9999';
        document.body.appendChild(debugElement);
    }
    // Voeg het bericht toe aan het debug element
    const logItem = document.createElement('div');
    logItem.textContent = message;
    debugElement.appendChild(logItem);
    // Scroll naar beneden
    debugElement.scrollTop = debugElement.scrollHeight;
}

// Check if user is authenticated
function checkAuth() {
    // Skip auth check on login and license pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html') || currentPath.includes('license.html')) {
        debugLog('Op login of licentie pagina, auth check overgeslagen');
        document.body.style.visibility = 'visible';
        return;
    }
    
    // Controleer of we handmatig hebben ingelogd via de login pagina
    const manualLoginCompleted = localStorage.getItem('manual_login_completed');
    if (manualLoginCompleted === 'true') {
        debugLog('Handmatige login gedetecteerd, auth check overgeslagen');
        document.body.style.visibility = 'visible';
        return;
    }
    
    // Controleer eerst of er al een gebruiker in localStorage staat
    const storedUser = localStorage.getItem('currentUser');
    const licenseKey = localStorage.getItem('hourflow_license');
    
    if (storedUser && licenseKey) {
        debugLog('Gebruiker en licentie gevonden in localStorage');
        document.body.style.visibility = 'visible';
        return;
    }
    
    if (storedUser && !licenseKey) {
        debugLog('Gebruiker gevonden in localStorage maar geen licentie, automatisch licentie toekennen');
        localStorage.setItem('hourflow_license', 'AUTH-USER-LICENSE');
        localStorage.setItem('hourflow_verified_license', 'AUTH-USER-LICENSE');
        licenseKey = 'AUTH-USER-LICENSE';
        document.body.style.visibility = 'visible';
        return;
    }
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        debugLog('Firebase nog niet beschikbaar, even wachten...');
        setTimeout(checkAuth, 500);
        return;
    }

    debugLog('Authenticatiestatus controleren...');
    
    // Verberg de body totdat de auth check voltooid is
    document.body.style.visibility = 'hidden';
    
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            debugLog('Gebruiker niet geauthenticeerd, doorsturen naar login pagina');
            // Wis alle sessie-flags om loops te voorkomen
            sessionStorage.removeItem('license_check_in_progress');
            sessionStorage.removeItem('auth_redirect_in_progress');
            // Doorsturen naar login pagina
            window.location.replace('login.html');
        } else {
            debugLog('Gebruiker geauthenticeerd: ' + user.email);
            // Wis redirect flags
            sessionStorage.removeItem('auth_redirect_in_progress');
            // Sla gebruikersinfo op in localStorage
            storeUserInfo(user);
            
            // Ken automatisch een licentie toe aan ingelogde gebruikers als ze er nog geen hebben
            if (!licenseKey) {
                debugLog('Automatisch licentie toekennen aan ingelogde gebruiker');
                localStorage.setItem('hourflow_license', 'AUTH-USER-LICENSE');
                localStorage.setItem('hourflow_verified_license', 'AUTH-USER-LICENSE');
                licenseKey = 'AUTH-USER-LICENSE';
            }
            
            // Maak de app zichtbaar nu we weten dat de gebruiker is geauthenticeerd en een licentie heeft
            document.body.style.visibility = 'visible';
        }
    });
}

// Store user information in localStorage
function storeUserInfo(user) {
    const userInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
}

// Run the auth check when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting auth check...');
    checkAuth();
});
