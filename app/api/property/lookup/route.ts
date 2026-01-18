import { NextRequest, NextResponse } from 'next/server'

type PropertyLookupRequest = {
  address: string
  city: string
  state: string
  zipcode: string
}

type PropertyDetails = {
  address: string
  city: string
  state: string
  zipcode: string
  propertyType: string
  beds: number
  baths: number
  sqft: number
  lotSize: number
  yearBuilt: number
  lastSalePrice: number | null
  lastSaleDate: string | null
  estimatedValue: number | null
  taxAssessedValue: number | null
  monthlyRent: number | null
  features: string[]
  description: string
  neighborhood: string
  source: string
}

// RapidAPI Realty Mole Property API
async function fetchFromRealtyMole(params: PropertyLookupRequest): Promise<PropertyDetails | null> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.warn('RAPIDAPI_KEY not set, using mock data')
    return null
  }

  try {
    const address = encodeURIComponent(`${params.address}, ${params.city}, ${params.state} ${params.zipcode}`)
    const response = await fetch(
      `https://realty-mole-property-api.p.rapidapi.com/properties?address=${address}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      console.error('Realty Mole API error:', response.status)
      return null
    }

    const data = await response.json()
    if (!data || data.length === 0) return null

    const property = data[0]
    return {
      address: property.addressLine1 || params.address,
      city: property.city || params.city,
      state: property.state || params.state,
      zipcode: property.zipCode || params.zipcode,
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
  } catch (error) {
    console.error('Realty Mole API error:', error)
    return null
  }
}

// Zillow API via RapidAPI (alternative)
async function fetchFromZillow(params: PropertyLookupRequest): Promise<PropertyDetails | null> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return null

  try {
    const address = encodeURIComponent(`${params.address} ${params.city} ${params.state} ${params.zipcode}`)
    const response = await fetch(
      `https://zillow-com1.p.rapidapi.com/property?address=${address}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    if (!data) return null

    return {
      address: data.streetAddress || params.address,
      city: data.city || params.city,
      state: data.state || params.state,
      zipcode: data.zipcode || params.zipcode,
      propertyType: data.homeType || 'Single Family',
      beds: data.bedrooms || 0,
      baths: data.bathrooms || 0,
      sqft: data.livingArea || 0,
      lotSize: data.lotSize || 0,
      yearBuilt: data.yearBuilt || 0,
      lastSalePrice: data.lastSoldPrice || null,
      lastSaleDate: data.lastSoldDate || null,
      estimatedValue: data.zestimate || null,
      taxAssessedValue: data.taxAssessedValue || null,
      monthlyRent: data.rentZestimate || null,
      features: data.resoFacts?.homeFeatures || [],
      description: data.description || '',
      neighborhood: data.neighborhoodOverview || '',
      source: 'zillow'
    }
  } catch (error) {
    console.error('Zillow API error:', error)
    return null
  }
}

// Generate realistic mock data based on location
function generateMockData(params: PropertyLookupRequest): PropertyDetails {
  // Use zipcode to generate somewhat realistic values
  const zipNum = parseInt(params.zipcode) || 90210
  const basePrice = 200000 + (zipNum % 500) * 1000
  const sqft = 1200 + (zipNum % 20) * 100
  const beds = 2 + (zipNum % 4)
  const baths = 1 + (zipNum % 3)
  const yearBuilt = 1960 + (zipNum % 60)

  const features = [
    'Central Air',
    'Hardwood Floors',
    'Updated Kitchen',
    'Attached Garage',
    'Fenced Yard'
  ].slice(0, 2 + (zipNum % 4))

  return {
    address: params.address,
    city: params.city,
    state: params.state,
    zipcode: params.zipcode,
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
    description: `Charming ${beds} bedroom, ${baths} bathroom home in ${params.city}. Features ${sqft} sq ft of living space with ${features.slice(0, 2).join(' and ').toLowerCase()}.`,
    neighborhood: `${params.city} is a desirable area with good schools and convenient access to shopping and dining.`,
    source: 'mock'
  }
}

export async function POST(req: NextRequest) {
  let body: PropertyLookupRequest

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { address, city, state, zipcode } = body

  if (!address || !city || !state || !zipcode) {
    return NextResponse.json(
      { ok: false, error: 'Missing required fields: address, city, state, zipcode' },
      { status: 400 }
    )
  }

  // Try real APIs first, fall back to mock data
  let propertyData = await fetchFromRealtyMole(body)

  if (!propertyData) {
    propertyData = await fetchFromZillow(body)
  }

  if (!propertyData) {
    propertyData = generateMockData(body)
  }

  return NextResponse.json({
    ok: true,
    property: propertyData
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const city = searchParams.get('city')
  const state = searchParams.get('state')
  const zipcode = searchParams.get('zipcode')

  if (!address || !city || !state || !zipcode) {
    return NextResponse.json(
      { ok: false, error: 'Missing required query params: address, city, state, zipcode' },
      { status: 400 }
    )
  }

  const params = { address, city, state, zipcode }

  let propertyData = await fetchFromRealtyMole(params)

  if (!propertyData) {
    propertyData = await fetchFromZillow(params)
  }

  if (!propertyData) {
    propertyData = generateMockData(params)
  }

  return NextResponse.json({
    ok: true,
    property: propertyData
  })
}
