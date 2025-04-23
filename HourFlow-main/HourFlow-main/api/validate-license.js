// File: /api/validate-license.js

export default async function handler(req, res) {
  const { licenseKey } = req.query;

  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: 'No license key provided.' });
  }

  try {
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product_permalink: 'hourflow', // <-- replace with your actual Gumroad product permalink
        license_key: licenseKey,
      })
    });

    const data = await gumroadResponse.json();

    if (data.success) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(403).json({ valid: false, message: data.message });
    }
  } catch (err) {
    return res.status(500).json({ valid: false, error: 'Server error' });
  }
}
