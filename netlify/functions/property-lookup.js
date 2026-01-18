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
    // Try Zillow API first (private-zillow /byaddress endpoint)
    try {
      const fullAddress = encodeURIComponent(`${address}, ${city}, ${state} ${zipcode}`);
      const zillowResponse = await fetch(
        `https://private-zillow.p.rapidapi.com/byaddress?propertyaddress=${fullAddress}`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'private-zillow.p.rapidapi.com'
          }
        }
      );

      if (zillowResponse.ok) {
        const data = await zillowResponse.json();

        if (data && data.zpid) {
          // Helper function to parse price strings like "$189,200" to number
          const parsePrice = (priceStr) => {
            if (!priceStr) return null;
            if (typeof priceStr === 'number') return priceStr;
            const cleaned = String(priceStr).replace(/[$,]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          };

          // Helper function to parse year from range like "1960-1969"
          const parseYear = (yearStr) => {
            if (!yearStr) return 0;
            if (typeof yearStr === 'number') return yearStr;
            const match = String(yearStr).match(/(\d{4})/);
            return match ? parseInt(match[1]) : 0;
          };

          // Data might be at top level OR nested in adTargets
          const ad = data.adTargets || {};

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ok: true,
              property: {
                address: data.streetAddress || ad.streetAddress || address,
                city: data.city || ad.city || city,
                state: data.state || ad.state || state,
                zipcode: data.zipcode || ad.zipcode || ad.zip || zipcode,
                propertyType: (data.homeType || ad.homeType || 'Single Family').replace(/_/g, ' '),
                beds: parseInt(data.bd || ad.bd || data.bedrooms || ad.bedrooms) || 0,
                baths: parseFloat(data.ba || ad.ba || data.bathrooms || ad.bathrooms) || 0,
                sqft: parseInt(data.sqft || ad.sqft || data.livingArea || ad.livingArea) || 0,
                lotSize: parseInt(data.lot || ad.lot || data.lotSize || ad.lotSize) || 0,
                yearBuilt: parseYear(data.yrbit || ad.yrbit || data.yearBuilt || ad.yearBuilt) || 0,
                lastSalePrice: parsePrice(data.lastSoldPrice || ad.lastSoldPrice || data.price || ad.price) || null,
                lastSaleDate: data.dateSold || ad.dateSold || null,
                estimatedValue: parsePrice(data.zestimate || ad.zestimate || data.price || ad.price) || null,
                taxAssessedValue: parsePrice(data.taxAssessedValue || ad.taxAssessedValue) || null,
                monthlyRent: parsePrice(data.rentZestimate || ad.rentZestimate) || null,
                features: data.resoFacts?.atAGlanceFacts?.map(f => f.factValue) || [],
                description: data.description || '',
                neighborhood: data.neighborhoodOverview || '',
                source: 'zillow'
              }
            })
          };
        }
      }
    } catch (error) {
      console.error('Zillow API error:', error);
    }

    // Fallback to Realty Mole API
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
      console.error('Realty Mole API error:', error);
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
