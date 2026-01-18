// Property Lookup Netlify Function
// Endpoint: /.netlify/functions/property-lookup

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' })
    };
  }

  const { address, city, state, zipcode } = body;

  if (!address || !city || !state || !zipcode) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'Missing required fields: address, city, state, zipcode' })
    };
  }

  // Try RapidAPI if key is set
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (rapidApiKey) {
    try {
      const encodedAddress = encodeURIComponent(`${address}, ${city}, ${state} ${zipcode}`);
      const response = await fetch(
        `https://realty-mole-property-api.p.rapidapi.com/properties?address=${encodedAddress}`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const property = data[0];
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ok: true,
              property: {
                address: property.addressLine1 || address,
                city: property.city || city,
                state: property.state || state,
                zipcode: property.zipCode || zipcode,
                propertyType: property.propertyType || 'Single Family',
                beds: property.bedrooms || 0,
                baths: property.bathrooms || 0,
                sqft: property.squareFootage || 0,
                lotSize: property.lotSize || 0,
                yearBuilt: property.yearBuilt || 0,
                lastSalePrice: property.lastSalePrice || null,
                lastSaleDate: property.lastSaleDate || null,
                estimatedValue: property.price || null,
                taxAssessedValue: property.taxAssessedValue || null,
                monthlyRent: property.rentEstimate || null,
                features: property.features || [],
                description: property.propertyDescription || '',
                neighborhood: property.neighborhood || '',
                source: 'realty-mole'
              }
            })
          };
        }
      }
    } catch (error) {
      console.error('RapidAPI error:', error);
    }
  }

  // Fallback to mock data
  const zipNum = parseInt(zipcode) || 90210;
  const basePrice = 200000 + (zipNum % 500) * 1000;
  const sqft = 1200 + (zipNum % 20) * 100;
  const beds = 2 + (zipNum % 4);
  const baths = 1 + (zipNum % 3);
  const yearBuilt = 1960 + (zipNum % 60);

  const features = [
    'Central Air',
    'Hardwood Floors',
    'Updated Kitchen',
    'Attached Garage',
    'Fenced Yard'
  ].slice(0, 2 + (zipNum % 4));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      property: {
        address,
        city,
        state,
        zipcode,
        propertyType: 'Single Family',
        beds,
        baths,
        sqft,
        lotSize: sqft * 3,
        yearBuilt,
        lastSalePrice: Math.round(basePrice * 0.85),
        lastSaleDate: '2021-06-15',
        estimatedValue: basePrice,
        taxAssessedValue: Math.round(basePrice * 0.8),
        monthlyRent: Math.round(basePrice * 0.006),
        features,
        description: `Charming ${beds} bedroom, ${baths} bathroom home in ${city}. Features ${sqft} sq ft of living space with ${features.slice(0, 2).join(' and ').toLowerCase()}.`,
        neighborhood: `${city} is a desirable area with good schools and convenient access to shopping and dining.`,
        source: 'mock'
      }
    })
  };
};
