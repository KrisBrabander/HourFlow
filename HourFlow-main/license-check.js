// license-check.js - Client-side middleware to verify license before allowing access

// This function checks if the user has a valid license key stored
function checkLicense() {
  // Get the stored license key from localStorage
  const licenseKey = localStorage.getItem('licenseKey');
  
  // If no license key is found, redirect to the license page
  if (!licenseKey) {
    redirectToLicensePage();
    return false;
  }
  
  // Verify the license key with the server
  fetch('/api/verify-license', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ licenseKey })
  })
  .then(response => response.json())
  .then(data => {
    if (!data.valid) {
      // If the license is invalid, clear it from storage and redirect
      localStorage.removeItem('licenseKey');
      redirectToLicensePage();
    }
  })
  .catch(error => {
    console.error('License verification error:', error);
    // On error, we'll allow access for now to prevent blocking legitimate users
    // You might want to change this behavior based on your requirements
  });
  
  return true;
}

// Redirect to the license page
function redirectToLicensePage() {
  // Only redirect if we're not already on the license page
  if (!window.location.pathname.includes('license.html')) {
    window.location.href = '/license.html';
  }
}

// Export the check function for use in other files
export { checkLicense };
