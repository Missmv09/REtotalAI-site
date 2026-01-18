/**
 * Property Valuation Plugin
 * Provides property lookup and valuation functionality using the internal API
 */

const API_BASE = '/api/property';

/**
 * Get property details from address
 * @param {Object} params - Address parameters
 * @param {string} params.address - Street address
 * @param {string} params.city - City name
 * @param {string} params.state - State code
 * @param {string} params.zipcode - ZIP code
 * @returns {Promise<Object>} Property details
 */
export async function getPropertyDetails({ address, city, state, zipcode }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, city, state, zipcode }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch property details: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Failed to fetch property details');
    }

    return data.property;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Property details request timed out');
    }
    throw new Error(`Failed to fetch property details: ${err.message}`);
  }
}

/**
 * Get property valuation estimate
 * @param {Object} params - Property parameters
 * @param {string} params.address - Street address
 * @param {string} params.city - City name
 * @param {string} params.state - State code
 * @param {string} params.zipcode - ZIP code
 * @param {string} [params.propertyType] - Type of property
 * @returns {Promise<Object>} Valuation details including estimatedValue, monthlyRent, etc.
 */
export async function getPropertyValuation({ address, city, state, zipcode, propertyType }) {
  // Uses the same endpoint - valuation data is included in property details
  const details = await getPropertyDetails({ address, city, state, zipcode });

  return {
    estimatedValue: details.estimatedValue,
    monthlyRent: details.monthlyRent,
    taxAssessedValue: details.taxAssessedValue,
    lastSalePrice: details.lastSalePrice,
    lastSaleDate: details.lastSaleDate,
    pricePerSqft: details.sqft ? Math.round(details.estimatedValue / details.sqft) : null,
    source: details.source
  };
}

/**
 * Quick lookup that returns just the essential fields for form population
 * @param {Object} params - Address parameters
 * @returns {Promise<Object>} Essential property fields
 */
export async function quickLookup({ address, city, state, zipcode }) {
  const details = await getPropertyDetails({ address, city, state, zipcode });

  return {
    beds: details.beds,
    baths: details.baths,
    sqft: details.sqft,
    yearBuilt: details.yearBuilt,
    propertyType: details.propertyType,
    estimatedValue: details.estimatedValue,
    monthlyRent: details.monthlyRent
  };
}
