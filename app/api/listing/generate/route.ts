import { NextRequest, NextResponse } from 'next/server'

type ListingGenerateRequest = {
  // Property details
  address?: string
  city?: string
  state?: string
  zipcode?: string
  propertyType: string
  beds: number
  baths: number
  sqft: number
  yearBuilt?: number
  lotSize?: number
  price?: number

  // Features & description
  features?: string[]
  recentUpgrades?: string
  neighborhood?: string
  uniqueSellingPoints?: string

  // Generation options
  tone: 'professional' | 'luxury' | 'casual' | 'family-friendly' | 'investor-focused'
  targetAudience: 'general' | 'first-time-buyers' | 'investors' | 'families' | 'luxury-buyers'
  platform: 'mls' | 'zillow' | 'realtor' | 'facebook' | 'craigslist' | 'all'
}

type GeneratedListing = {
  headline: string
  shortDescription: string
  fullDescription: string
  socialMediaPost: string
  emailTemplate: string
  seoKeywords: string[]
  alternativeHeadlines: string[]
}

// Call Anthropic Claude API
async function generateWithClaude(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set')
    return null
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      return null
    }

    const data = await response.json()
    return data.content?.[0]?.text || null
  } catch (error) {
    console.error('Claude API error:', error)
    return null
  }
}

// Call OpenAI API as fallback
async function generateWithOpenAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set')
    return null
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.error('OpenAI API error:', error)
    return null
  }
}

// Template-based fallback when no AI is available
function generateFromTemplate(input: ListingGenerateRequest): GeneratedListing {
  const {
    propertyType,
    beds,
    baths,
    sqft,
    yearBuilt,
    city = 'Your City',
    state = '',
    features,
    recentUpgrades,
    neighborhood,
    uniqueSellingPoints,
    tone,
    price,
    zipcode = ''
  } = input

  const priceStr = price ? `$${price.toLocaleString()}` : 'Contact for pricing'
  const yearStr = yearBuilt ? `, built in ${yearBuilt}` : ''
  const featuresStr = features?.length ? features.join(', ') : 'modern amenities'

  const toneAdjectives: Record<string, string[]> = {
    'professional': ['well-maintained', 'desirable', 'excellent'],
    'luxury': ['exquisite', 'stunning', 'prestigious'],
    'casual': ['cozy', 'comfortable', 'inviting'],
    'family-friendly': ['spacious', 'welcoming', 'perfect for families'],
    'investor-focused': ['high-yield', 'turnkey', 'income-producing']
  }

  const adj = toneAdjectives[tone] || toneAdjectives['professional']

  const headline = `${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${beds}BR/${baths}BA ${propertyType} in ${city}`

  const shortDescription = `${adj[1].charAt(0).toUpperCase() + adj[1].slice(1)} ${beds} bedroom, ${baths} bathroom ${propertyType.toLowerCase()} featuring ${sqft.toLocaleString()} sq ft of living space${yearStr}. ${featuresStr.charAt(0).toUpperCase() + featuresStr.slice(1)}. ${priceStr}.`

  const fullDescription = `Welcome to this ${adj[0]} ${propertyType.toLowerCase()} located in the heart of ${city}, ${state}. This ${adj[1]} home offers ${beds} bedrooms and ${baths} bathrooms with ${sqft.toLocaleString()} square feet of thoughtfully designed living space${yearStr}.

${features?.length ? `Property highlights include: ${featuresStr}.` : ''}

${recentUpgrades ? `Recent updates: ${recentUpgrades}.` : ''}

${neighborhood ? `The neighborhood: ${neighborhood}` : `Conveniently located in ${city} with easy access to local amenities, schools, and transportation.`}

${uniqueSellingPoints ? `What makes this home special: ${uniqueSellingPoints}` : ''}

Don't miss this ${adj[2]} opportunity! Schedule your showing today.

Offered at ${priceStr}.`

  const socialMediaPost = `🏠 NEW LISTING! ${beds}BR/${baths}BA in ${city}, ${state}
📐 ${sqft.toLocaleString()} sq ft | ${priceStr}
✨ ${features?.slice(0, 3).join(' • ') || 'Move-in ready!'}
📩 DM for details or to schedule a tour!
#RealEstate #${city.replace(/\s+/g, '')} #HomeForSale #${propertyType.replace(/\s+/g, '')}`

  const emailTemplate = `Subject: ${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${beds}BR Home in ${city} - Just Listed!

Hi [Name],

I wanted to share an exciting new listing that might be perfect for you:

📍 ${input.address || city}, ${state}
🛏️ ${beds} Bedrooms | 🛁 ${baths} Bathrooms
📐 ${sqft.toLocaleString()} sq ft
💰 ${priceStr}

${shortDescription}

Would you like to schedule a private showing? Reply to this email or call me directly.

Best regards,
[Your Name]
[Your Contact Info]`

  const seoKeywords = [
    `${beds} bedroom home ${city}`,
    `${propertyType.toLowerCase()} for sale ${city} ${state}`,
    `${city} real estate`,
    `homes for sale ${zipcode || city}`,
    `${baths} bathroom house ${city}`,
    `${sqft} sq ft home`,
    yearBuilt ? `${yearBuilt}s home ${city}` : `home ${city}`,
    ...(features?.slice(0, 3) || [])
  ].filter(Boolean) as string[]

  const alternativeHeadlines = [
    `${beds}BR/${baths}BA ${propertyType} - ${priceStr}`,
    `${adj[1].charAt(0).toUpperCase() + adj[1].slice(1)} Home in ${city} - ${sqft.toLocaleString()} sq ft`,
    `Move-In Ready ${propertyType} in ${city}`,
    `${city} ${propertyType} - ${beds} Beds, ${baths} Baths`,
    `Don't Miss This ${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${city} Home!`
  ]

  return {
    headline,
    shortDescription,
    fullDescription,
    socialMediaPost,
    emailTemplate,
    seoKeywords,
    alternativeHeadlines
  }
}

// Parse AI response into structured format
function parseAIResponse(response: string, input: ListingGenerateRequest): GeneratedListing {
  // Try to parse as JSON first
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        headline: parsed.headline || '',
        shortDescription: parsed.shortDescription || parsed.short_description || '',
        fullDescription: parsed.fullDescription || parsed.full_description || '',
        socialMediaPost: parsed.socialMediaPost || parsed.social_media_post || '',
        emailTemplate: parsed.emailTemplate || parsed.email_template || '',
        seoKeywords: parsed.seoKeywords || parsed.seo_keywords || [],
        alternativeHeadlines: parsed.alternativeHeadlines || parsed.alternative_headlines || []
      }
    }
  } catch {
    // Not JSON, parse sections
  }

  // Parse sections from text
  const sections: Record<string, string> = {}
  const sectionPatterns = [
    { key: 'headline', pattern: /(?:headline|title)[:\s]*([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i },
    { key: 'shortDescription', pattern: /(?:short\s*description|summary|teaser)[:\s]*([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i },
    { key: 'fullDescription', pattern: /(?:full\s*description|description|listing)[:\s]*([\s\S]+?)(?=\n\n(?:social|email|seo|alternative)|$)/i },
    { key: 'socialMediaPost', pattern: /(?:social\s*media|facebook|instagram)[:\s]*([\s\S]+?)(?=\n\n|\n[A-Z]|$)/i },
    { key: 'emailTemplate', pattern: /(?:email|outreach)[:\s]*([\s\S]+?)(?=\n\n(?:seo|alternative)|$)/i },
  ]

  for (const { key, pattern } of sectionPatterns) {
    const match = response.match(pattern)
    if (match) {
      sections[key] = match[1].trim()
    }
  }

  // Fall back to template for missing sections
  const template = generateFromTemplate(input)

  return {
    headline: sections.headline || template.headline,
    shortDescription: sections.shortDescription || template.shortDescription,
    fullDescription: sections.fullDescription || template.fullDescription,
    socialMediaPost: sections.socialMediaPost || template.socialMediaPost,
    emailTemplate: sections.emailTemplate || template.emailTemplate,
    seoKeywords: template.seoKeywords,
    alternativeHeadlines: template.alternativeHeadlines
  }
}

export async function POST(req: NextRequest) {
  let body: ListingGenerateRequest

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { propertyType, beds, baths, sqft, tone = 'professional', targetAudience = 'general' } = body

  if (!propertyType || beds === undefined || baths === undefined || sqft === undefined) {
    return NextResponse.json(
      { ok: false, error: 'Missing required fields: propertyType, beds, baths, sqft' },
      { status: 400 }
    )
  }

  // Build the AI prompt
  const prompt = `You are an expert real estate copywriter. Generate compelling property listing content based on the following details:

PROPERTY DETAILS:
- Type: ${propertyType}
- Bedrooms: ${beds}
- Bathrooms: ${baths}
- Square Footage: ${sqft.toLocaleString()}
${body.yearBuilt ? `- Year Built: ${body.yearBuilt}` : ''}
${body.lotSize ? `- Lot Size: ${body.lotSize.toLocaleString()} sq ft` : ''}
${body.price ? `- Price: $${body.price.toLocaleString()}` : ''}
${body.address ? `- Address: ${body.address}, ${body.city}, ${body.state} ${body.zipcode}` : body.city ? `- Location: ${body.city}, ${body.state}` : ''}

${body.features?.length ? `FEATURES:\n${body.features.map(f => `- ${f}`).join('\n')}` : ''}

${body.recentUpgrades ? `RECENT UPGRADES:\n${body.recentUpgrades}` : ''}

${body.neighborhood ? `NEIGHBORHOOD:\n${body.neighborhood}` : ''}

${body.uniqueSellingPoints ? `UNIQUE SELLING POINTS:\n${body.uniqueSellingPoints}` : ''}

REQUIREMENTS:
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Platform: ${body.platform || 'all'}

Generate the following in JSON format:
{
  "headline": "Attention-grabbing headline (max 80 chars)",
  "shortDescription": "50-100 word teaser description",
  "fullDescription": "300-500 word detailed property description with paragraphs",
  "socialMediaPost": "Platform-optimized post with emojis and hashtags",
  "emailTemplate": "Professional email template with subject line",
  "seoKeywords": ["keyword1", "keyword2", ...],
  "alternativeHeadlines": ["headline1", "headline2", "headline3"]
}

Ensure content is engaging, accurate, and tailored to the specified tone and audience.`

  // Try AI generation
  let aiResponse = await generateWithClaude(prompt)

  if (!aiResponse) {
    aiResponse = await generateWithOpenAI(prompt)
  }

  let listing: GeneratedListing

  if (aiResponse) {
    listing = parseAIResponse(aiResponse, body)
  } else {
    // Fall back to template-based generation
    listing = generateFromTemplate(body)
  }

  return NextResponse.json({
    ok: true,
    listing,
    source: aiResponse ? 'ai' : 'template'
  })
}
