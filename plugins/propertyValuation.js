export async function getPropertyValuation({ address, city, state, zipcode, propertyType }) {
  const params = new URLSearchParams({ address, city, state, zipcode, propertyType });
  const url = `https://api.externalpropertyvaluation.com/estimate?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch property valuation');
  }
  return response.json();
}
