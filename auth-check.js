// Firebase Authentication Check
// This script checks if a user is logged in and redirects to login page if not

// Check if user is authenticated
function checkAuth() {
    // Skip auth check on login and license pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html') || currentPath.includes('license.html')) {
        console.log('Op login of licentie pagina, auth check overgeslagen');
        document.body.style.visibility = 'visible';
        return;
    }
    
    // Controleer eerst of er al een gebruiker in localStorage staat
    // Dit kan gebeuren als de login.html pagina de gebruiker al heeft opgeslagen
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        console.log('Gebruiker gevonden in localStorage');
        // Controleer of er een licentie is
        const licenseKey = localStorage.getItem('hourflow_license');
        if (!licenseKey && !currentPath.includes('license.html')) {
            console.log('Gebruiker ingelogd maar geen licentie gevonden, doorsturen naar licentiepagina');
            window.location.href = 'license.html';
            return;
        }
        
        // Gebruiker is ingelogd en heeft een licentie
        document.body.style.visibility = 'visible';
        return;
    }
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.log('Firebase not yet available, waiting...');
        setTimeout(checkAuth, 500);
        return;
    }

    console.log('Checking authentication state...');
    
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            console.log('Gebruiker niet geauthenticeerd, doorsturen naar login pagina');
            // Wis alle sessie-flags om loops te voorkomen
            sessionStorage.removeItem('license_check_in_progress');
            sessionStorage.removeItem('auth_redirect_in_progress');
            // Doorsturen naar login pagina
            window.location.href = 'login.html';
        } else {
            console.log('Gebruiker geauthenticeerd:', user.email);
            // Wis redirect flags
            sessionStorage.removeItem('auth_redirect_in_progress');
            // Sla gebruikersinfo op in localStorage
            storeUserInfo(user);
            
            // Controleer of gebruiker een geldige licentie heeft
            const licenseKey = localStorage.getItem('hourflow_license');
            if (!licenseKey && !currentPath.includes('license.html')) {
                console.log('Gebruiker geauthenticeerd maar geen licentie gevonden, doorsturen naar licentiepagina');
                window.location.href = 'license.html';
                return;
            }
            
            // Maak de app zichtbaar nu we weten dat de gebruiker is geauthenticeerd en een licentie heeft
            document.body.style.visibility = 'visible';
        }
    });

    // Verberg de body totdat de auth check voltooid is
    document.body.style.visibility = 'hidden';
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
