// API endpoint to generate license keys
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract data from request
    const { email, name, purchaseId } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and name are required' 
      });
    }

    // Generate a license key
    const licenseKey = generateLicenseKey(email, purchaseId);
    
    // In a real implementation, you would save this key to a database
    // along with user information and activation status
    
    // For this example, we're just returning the generated key
    return res.status(200).json({ 
      success: true, 
      licenseKey: licenseKey,
      message: 'License key generated successfully' 
    });
  } catch (error) {
    console.error('License key generation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during license key generation' 
    });
  }
}

/**
 * Generates a license key based on user information and a unique identifier
 * 
 * @param {string} email - User's email address
 * @param {string} purchaseId - Unique purchase identifier (optional)
 * @returns {string} Generated license key
 */
function generateLicenseKey(email, purchaseId = '') {
  // Create a timestamp component
  const timestamp = Date.now().toString(36);
  
  // Create a hash from the email
  const emailHash = simpleHash(email).toString(36);
  
  // Use purchase ID or generate a random component if not provided
  const uniqueId = purchaseId || Math.random().toString(36).substring(2, 8);
  
  // Combine components and format as a license key
  // Format: XXXX-XXXX-XXXX-XXXX
  const rawKey = `${timestamp}${emailHash}${uniqueId}`;
  
  // Take parts of the raw key and format it
  const part1 = rawKey.substring(0, 4).toUpperCase();
  const part2 = rawKey.substring(4, 8).toUpperCase();
  const part3 = rawKey.substring(8, 12).toUpperCase();
  const part4 = rawKey.substring(12, 16).toUpperCase();
  
  return `${part1}-${part2}-${part3}-${part4}`;
}

/**
 * Creates a simple hash from a string
 * Note: This is not cryptographically secure, just for demonstration
 * 
 * @param {string} str - String to hash
 * @returns {number} Simple numeric hash
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
