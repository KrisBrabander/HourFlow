// Firebase Authentication Check
// This script checks if a user is logged in and redirects to login page if not

// Check if user is authenticated
function checkAuth() {
    // Skip auth check on login and license pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html') || currentPath.includes('license.html')) {
        console.log('On login or license page, skipping auth check');
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
            console.log('User not authenticated, redirecting to login page');
            // Clear any existing license check flags to prevent loops
            sessionStorage.removeItem('license_check_in_progress');
            // Set a flag to indicate we're in auth flow
            sessionStorage.setItem('auth_redirect_in_progress', 'true');
            window.location.href = 'login.html';
        } else {
            console.log('User authenticated:', user.email);
            // Clear auth redirect flag
            sessionStorage.removeItem('auth_redirect_in_progress');
            // Store user info in localStorage for app use
            storeUserInfo(user);
            
            // Now check if user has a valid license
            const licenseKey = localStorage.getItem('hourflow_license');
            if (!licenseKey && !currentPath.includes('license.html')) {
                console.log('User authenticated but no license found, redirecting to license page');
                window.location.href = 'license.html';
                return;
            }
            
            // Make the app visible now that we know user is authenticated and has a license
            document.body.style.visibility = 'visible';
        }
    });

    // Initially hide the body until auth check completes
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
