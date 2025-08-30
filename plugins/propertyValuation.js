export async function getPropertyValuation({ address, city, state, zipcode, propertyType }) {
  const params = new URLSearchParams({ address, city, state, zipcode, propertyType });
  const url = `https://api.externalpropertyvaluation.com/estimate?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch property valuation: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Property valuation request timed out');
    }
    throw new Error(`Failed to fetch property valuation: ${err.message}`);
  }
}

export async function getPropertyDetails({ address, city, state, zipcode }) {
  const params = new URLSearchParams({ address, city, state, zipcode });
  const url = `https://api.externalpropertyvaluation.com/details?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Failed to fetch property details: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Property details request timed out');
    }
    throw new Error(`Failed to fetch property details: ${err.message}`);
  }
}
