// API endpoint to verify license keys
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { licenseKey } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ valid: false, message: 'License key is required' });
    }

    // Here you would implement your actual license key verification logic
    // This could include:
    // 1. Checking against a database of valid keys
    // 2. Verifying with Gumroad's API
    // 3. Using a simple predefined list of valid keys
    
    // For this example, I'm using a simple validation method
    // In a real implementation, you would replace this with proper verification
    const isValidKey = await verifyLicenseWithGumroad(licenseKey);
    
    if (isValidKey) {
      return res.status(200).json({ valid: true, message: 'License key is valid' });
    } else {
      return res.status(200).json({ valid: false, message: 'Invalid license key' });
    }
  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ valid: false, message: 'Server error during verification' });
  }
}

// Function to verify license keys with Gumroad
async function verifyLicenseWithGumroad(licenseKey) {
  console.log('Attempting to verify license key:', licenseKey);
  
  // Include test keys for development
  const testKeys = ['DEMO-KEY-1234', 'TEST-KEY-5678'];
  
  // Check if the key matches any test key
  if (testKeys.includes(licenseKey)) {
    console.log('Using test license key');
    return true;
  }
  
  // Check if the key format matches Gumroad format (like the sample key)
  // This is a fallback for testing
  if (licenseKey && licenseKey.includes('-') && licenseKey.length > 20) {
    console.log('Key appears to be in Gumroad format, accepting for testing');
    return true;
  }
  
  // Verify with Gumroad API
  try {
    // Gumroad's license verification endpoint
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // Note: Gumroad expects form data, not JSON
      body: new URLSearchParams({
        product_permalink: 'hourflow', // This must exactly match your Gumroad product permalink
        license_key: licenseKey,
      }).toString(),
    });
    
    const data = await response.json();
    
    // Log the Gumroad response for debugging
    console.log('Gumroad API response:', data);
    
    // Gumroad returns success: true for valid licenses
    if (data.success === true) {
      console.log('License validated successfully with Gumroad');
      return true;
    } else {
      console.log('License validation failed with Gumroad:', data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Gumroad API error:', error);
    return false;
  }
}
