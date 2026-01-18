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

// Zillow API via RapidAPI (private-zillow) - using /byaddress endpoint
async function fetchFromZillow(params: PropertyLookupRequest): Promise<PropertyDetails | null> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.log('DEBUG: No RAPIDAPI_KEY found')
    return null
  }

  try {
    // Use the /byaddress endpoint for direct property lookup
    const fullAddress = encodeURIComponent(`${params.address}, ${params.city}, ${params.state} ${params.zipcode}`)
    const url = `https://private-zillow.p.rapidapi.com/byaddress?propertyaddress=${fullAddress}`
    console.log('DEBUG: Calling Zillow API:', url)

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'private-zillow.p.rapidapi.com'
      }
    })

    console.log('DEBUG: Zillow API status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Zillow API error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    console.log('DEBUG: Zillow API response keys:', Object.keys(data || {}))

    if (!data || data.error || !data.zpid) {
      console.log('DEBUG: No valid Zillow data - error:', data?.error, 'zpid:', data?.zpid)
      return null
    }

    // Helper function to parse price strings like "$189,200" to number
    const parsePrice = (priceStr: string | number | null | undefined): number | null => {
      if (!priceStr) return null
      if (typeof priceStr === 'number') return priceStr
      const cleaned = priceStr.replace(/[$,]/g, '')
      const num = parseFloat(cleaned)
      return isNaN(num) ? null : num
    }

    // Helper function to parse year from range like "1960-1969" or single year
    const parseYear = (yearStr: string | number | null | undefined): number => {
      if (!yearStr) return 0
      if (typeof yearStr === 'number') return yearStr
      const match = yearStr.match(/(\d{4})/)
      return match ? parseInt(match[1]) : 0
    }

    return {
      address: data.streetAddress || data.address || params.address,
      city: data.city || params.city,
      state: data.state || params.state,
      zipcode: data.zipcode || params.zipcode,
      propertyType: data.homeType?.replace(/_/g, ' ') || 'Single Family',
      beds: parseInt(data.bd) || parseInt(data.bedrooms) || 0,
      baths: parseFloat(data.ba) || parseFloat(data.bathrooms) || 0,
      sqft: parseInt(data.sqft) || parseInt(data.livingArea) || 0,
      lotSize: parseInt(data.lot) || parseInt(data.lotSize) || 0,
      yearBuilt: parseYear(data.yrbit) || parseYear(data.yearBuilt) || 0,
      lastSalePrice: parsePrice(data.lastSoldPrice) || parsePrice(data.price) || null,
      lastSaleDate: data.dateSold || data.lastSoldDate || null,
      estimatedValue: parsePrice(data.zestimate) || parsePrice(data.price) || null,
      taxAssessedValue: parsePrice(data.taxAssessedValue) || null,
      monthlyRent: parsePrice(data.rentZestimate) || null,
      features: data.resoFacts?.atAGlanceFacts?.map((f: { factValue: string }) => f.factValue) || [],
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

  // Try real APIs first, fall back to mock data (Zillow first for better accuracy)
  let propertyData = await fetchFromZillow(body)

  if (!propertyData) {
    propertyData = await fetchFromRealtyMole(body)
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

  let propertyData = await fetchFromZillow(params)

  if (!propertyData) {
    propertyData = await fetchFromRealtyMole(params)
  }

  if (!propertyData) {
    propertyData = generateMockData(params)
  }

  return NextResponse.json({
    ok: true,
    property: propertyData
  })
}
