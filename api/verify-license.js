// API endpoint to verify licenses
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { licenseKey } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ 
        valid: false, 
        message: 'License key is required' 
      });
    }

    // First check for test keys (for development and testing)
    const testKeys = ['DEMO-KEY-1234', 'TEST-KEY-5678'];
    if (testKeys.includes(licenseKey)) {
      console.log('Test key used:', licenseKey);
      return res.status(200).json({ 
        valid: true, 
        message: 'Test key accepted' 
      });
    }
    
    // Check for valid Gumroad format (must contain at least 3 dashes and be 20+ characters long)
    const isValidFormat = licenseKey.split('-').length >= 4 && licenseKey.length >= 20;
    if (!isValidFormat) {
      return res.status(200).json({ 
        valid: false, 
        message: 'Invalid license key. A valid key has the format XXXX-XXXX-XXXX-XXXX.' 
      });
    }
    
    // List of valid licenses (in a real implementation, you would retrieve these from a database)
    // You can add your own valid licenses here
    const validLicenses = [
      // Add your valid licenses here
      'HOUR-FLOW-2025-PREMIUM',
      'HOUR-FLOW-2025-STANDARD'
    ];
    
    // Check if the key is in the list of valid licenses
    if (validLicenses.includes(licenseKey)) {
      return res.status(200).json({ 
        valid: true, 
        message: 'License key is valid',
        licenseKey: licenseKey 
      });
    }
    
    // Verify with Gumroad API as the last step
    const isValidKey = await verifyLicenseWithGumroad(licenseKey);
    
    if (isValidKey) {
      return res.status(200).json({ 
        valid: true, 
        message: 'License key is valid',
        licenseKey: licenseKey 
      });
    } else {
      return res.status(200).json({ 
        valid: false, 
        message: 'Invalid license key. Please check if you entered the correct code.' 
      });
    }
  } catch (error) {
    console.error('License verification error:', error);
    
    return res.status(500).json({ 
      valid: false, 
      message: 'An error occurred while verifying your license. Please try again later.' 
    });
  }
}

// Function to verify licenses with Gumroad
async function verifyLicenseWithGumroad(licenseKey) {
  console.log('Verifying license key:', licenseKey);
  
  // First check if the key has a valid format
  // Gumroad licenses usually have the format XXXX-XXXX-XXXX-XXXX
  if (!licenseKey || licenseKey.split('-').length < 4 || licenseKey.length < 20) {
    console.log('Invalid license format');
    return false;
  }
  
  // Verifieer met Gumroad API
  try {
    // Gumroad's license verification endpoint
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_permalink: 'HourFlow', // Updated Gumroad product permalink
        license_key: licenseKey,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Gumroad API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the Gumroad response for debugging
    console.log('Gumroad API response:', data);
    
    // Gumroad returns success: true for valid licenses
    if (data.success === true) {
      // Check if the license is not expired (if there is a uses_count)
      if (data.purchase && data.purchase.refunded) {
        console.log('License is refunded/cancelled');
        return false;
      }
      
      // Check if the license has not been used too many times (if there is a uses_count)
      // You can set a limit here based on your license policy
      if (data.uses && typeof data.uses_count === 'number') {
        const maxUses = 5; // Maximum 5 devices/browsers per license
        if (data.uses_count > maxUses) {
          console.log(`License has been used too many times: ${data.uses_count} times (max: ${maxUses})`);
          return false;
        }
      }
      
      console.log('License successfully validated with Gumroad');
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
