// API endpoint om licenties te verifiëren
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode niet toegestaan' });
  }

  try {
    const { licenseKey } = req.body;
    
    if (!licenseKey) {
      return res.status(400).json({ valid: false, message: 'Licentiesleutel is vereist' });
    }

    // Controleer eerst op testsleutels (voor ontwikkeling en testen)
    const testKeys = ['DEMO-KEY-1234', 'TEST-KEY-5678'];
    if (testKeys.includes(licenseKey)) {
      console.log('Testsleutel gebruikt:', licenseKey);
      return res.status(200).json({ valid: true, message: 'Testsleutel geaccepteerd' });
    }
    
    // Verifieer met Gumroad API
    const isValidKey = await verifyLicenseWithGumroad(licenseKey);
    
    if (isValidKey) {
      return res.status(200).json({ 
        valid: true, 
        message: 'Licentiesleutel is geldig',
        licenseKey: licenseKey 
      });
    } else {
      return res.status(200).json({ 
        valid: false, 
        message: 'Ongeldige licentiesleutel. Controleer of je de juiste code hebt ingevoerd.'
      });
    }
  } catch (error) {
    console.error('Licentieverificatie fout:', error);
    
    // Bij een API-fout, controleer of de sleutel een geldig formaat heeft
    // Dit is een fallback voor als de Gumroad API niet beschikbaar is
    if (req.body.licenseKey && req.body.licenseKey.includes('-') && req.body.licenseKey.length > 20) {
      console.log('Gumroad API niet beschikbaar, accepteer sleutel met geldig formaat');
      return res.status(200).json({ 
        valid: true, 
        message: 'Licentie geaccepteerd (fallback validatie)',
        licenseKey: req.body.licenseKey 
      });
    }
    
    return res.status(500).json({ 
      valid: false, 
      message: 'Er is een fout opgetreden bij het verifiëren van je licentie. Probeer het later opnieuw.'
    });
  }
}

// Functie om licenties te verifiëren met Gumroad
async function verifyLicenseWithGumroad(licenseKey) {
  console.log('Bezig met verifiëren van licentiesleutel:', licenseKey);
  
  // Verifieer met Gumroad API
  try {
    // Gumroad's license verification endpoint
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // Let op: Gumroad verwacht form data, geen JSON
      body: new URLSearchParams({
        product_permalink: 'hourflow', // Dit moet exact overeenkomen met je Gumroad product permalink
        license_key: licenseKey,
      }).toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Gumroad API fout: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log de Gumroad response voor debugging
    console.log('Gumroad API response:', data);
    
    // Gumroad geeft success: true terug voor geldige licenties
    if (data.success === true) {
      // Controleer of de licentie niet is verlopen (als er een uses_count is)
      if (data.purchase && data.purchase.refunded) {
        console.log('Licentie is terugbetaald/geannuleerd');
        return false;
      }
      
      // Controleer of de licentie niet te vaak is gebruikt (als er een uses_count is)
      // Je kunt hier een limiet instellen op basis van je licentiebeleid
      if (data.uses && typeof data.uses_count === 'number') {
        const maxUses = 5; // Maximaal 5 apparaten/browsers per licentie
        if (data.uses_count > maxUses) {
          console.log(`Licentie is te vaak gebruikt: ${data.uses_count} keer (max: ${maxUses})`);
          return false;
        }
      }
      
      console.log('Licentie succesvol gevalideerd met Gumroad');
      return true;
    } else {
      console.log('Licentievalidatie mislukt met Gumroad:', data.message || 'Onbekende fout');
      return false;
    }
  } catch (error) {
    console.error('Gumroad API fout:', error);
    
    // Bij een API-fout, controleren we of de sleutel een geldig formaat heeft
    // Dit is een fallback voor als de Gumroad API niet beschikbaar is
    if (licenseKey && licenseKey.includes('-') && licenseKey.length > 20) {
      console.log('Gumroad API niet beschikbaar, accepteer sleutel met geldig formaat');
      return true;
    }
    
    return false;
  }
}
