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
  tone: 'professional' | 'luxury' | 'casual' | 'family-friendly' | 'investor-focused' | 'fsbo'
  targetAudience: 'general' | 'first-time-buyers' | 'investors' | 'families' | 'luxury-buyers'
  platform: 'mls' | 'zillow' | 'realtor' | 'facebook' | 'craigslist' | 'all'

  // Investor-focused fields
  currentRent?: number
  marketRent?: number
  capRate?: number

  // Spanish translation
  spanishEnabled?: boolean
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
    zipcode = '',
    currentRent,
    marketRent,
    capRate
  } = input

  const priceStr = price ? `$${price.toLocaleString()}` : 'Contact for pricing'
  const yearStr = yearBuilt ? `, built in ${yearBuilt}` : ''
  const featuresStr = features?.length ? features.join(', ') : 'modern amenities'

  const toneAdjectives: Record<string, string[]> = {
    'professional': ['well-maintained', 'desirable', 'excellent'],
    'luxury': ['exquisite', 'stunning', 'prestigious'],
    'casual': ['cozy', 'comfortable', 'inviting'],
    'family-friendly': ['spacious', 'welcoming', 'perfect for families'],
    'investor-focused': ['high-yield', 'turnkey', 'income-producing'],
    'fsbo': ['charming', 'well-loved', 'move-in ready']
  }

  const adj = toneAdjectives[tone] || toneAdjectives['professional']

  // FSBO-specific headline and content
  if (tone === 'fsbo') {
    const headline = `FOR SALE BY OWNER: ${beds}BR/${baths}BA ${propertyType} in ${city}`

    const shortDescription = `Selling my ${adj[0]} ${beds} bedroom, ${baths} bathroom ${propertyType.toLowerCase()} with ${sqft.toLocaleString()} sq ft${yearStr}. ${featuresStr.charAt(0).toUpperCase() + featuresStr.slice(1)}. ${priceStr}. Contact owner directly - no agents please.`

    const fullDescription = `FOR SALE BY OWNER

I'm selling my ${adj[0]} ${propertyType.toLowerCase()} located in ${city}, ${state}. This ${adj[1]} home has been well cared for and offers ${beds} bedrooms and ${baths} bathrooms with ${sqft.toLocaleString()} square feet of comfortable living space${yearStr}.

${features?.length ? `What I love about this home: ${featuresStr}.` : ''}

${recentUpgrades ? `Updates I've made: ${recentUpgrades}.` : ''}

${neighborhood ? `About the neighborhood: ${neighborhood}` : `Great location in ${city} with easy access to everything you need.`}

${uniqueSellingPoints ? `Why you'll love it: ${uniqueSellingPoints}` : ''}

I'm asking ${priceStr}. Serious buyers only - please contact me directly to schedule a showing. No agents, please.

Owner financing may be available for qualified buyers.`

    const socialMediaPost = `🏡 FOR SALE BY OWNER! ${beds}BR/${baths}BA in ${city}
📐 ${sqft.toLocaleString()} sq ft | ${priceStr}
✨ ${features?.slice(0, 3).join(' • ') || 'Move-in ready!'}
💬 Message me directly - no agents!
#FSBO #ForSaleByOwner #${city.replace(/\s+/g, '')} #HomeForSale`

    const emailTemplate = `Subject: FOR SALE BY OWNER: ${beds}BR Home in ${city}

Hi,

I'm reaching out because I'm selling my home and thought you might be interested or know someone who is.

📍 ${input.address || city}, ${state}
🛏️ ${beds} Bedrooms | 🛁 ${baths} Bathrooms
📐 ${sqft.toLocaleString()} sq ft
💰 ${priceStr}

${shortDescription}

Since I'm selling directly, we can save on commission and work together on a fair deal. Let me know if you'd like to see it!

Best,
[Your Name]
[Your Phone]`

    return {
      headline,
      shortDescription,
      fullDescription,
      socialMediaPost,
      emailTemplate,
      seoKeywords: [
        `fsbo ${city}`,
        `for sale by owner ${city} ${state}`,
        `${beds} bedroom home ${city}`,
        `no agent home sale ${city}`,
        `owner selling ${propertyType.toLowerCase()}`,
        ...(features?.slice(0, 3) || [])
      ].filter(Boolean) as string[],
      alternativeHeadlines: [
        `OWNER SELLING: ${beds}BR Home in ${city} - ${priceStr}`,
        `No Agents! ${propertyType} for Sale by Owner`,
        `Direct from Owner: ${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${city} Home`,
        `FSBO: ${sqft.toLocaleString()} sq ft ${propertyType} - Save on Commission!`,
        `Motivated Owner: ${beds}BR/${baths}BA in ${city}`
      ]
    }
  }

  // Investor-focused with metrics
  if (tone === 'investor-focused') {
    const investorMetrics: string[] = []
    if (currentRent) investorMetrics.push(`Current Rent: $${currentRent.toLocaleString()}/mo`)
    if (marketRent) investorMetrics.push(`Market Rent: $${marketRent.toLocaleString()}/mo`)
    if (capRate) investorMetrics.push(`Cap Rate: ${capRate}%`)

    const metricsStr = investorMetrics.length > 0 ? investorMetrics.join(' | ') : ''
    const annualRent = currentRent ? currentRent * 12 : (marketRent ? marketRent * 12 : 0)

    const headline = `📈 Investment Opportunity: ${beds}BR/${baths}BA ${propertyType} - ${capRate ? `${capRate}% Cap Rate` : priceStr}`

    const shortDescription = `${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${beds} bedroom, ${baths} bathroom investment property with ${sqft.toLocaleString()} sq ft${yearStr}. ${metricsStr ? metricsStr + '. ' : ''}${priceStr}. Numbers available to qualified investors.`

    const fullDescription = `INVESTMENT OPPORTUNITY

${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${propertyType.toLowerCase()} in ${city}, ${state} - ideal for investors seeking ${adj[2]} properties.

PROPERTY SPECS:
• ${beds} Bedrooms | ${baths} Bathrooms
• ${sqft.toLocaleString()} Square Feet
${yearBuilt ? `• Built: ${yearBuilt}` : ''}
${input.lotSize ? `• Lot Size: ${input.lotSize.toLocaleString()} sq ft` : ''}

${metricsStr ? `INVESTMENT METRICS:\n${investorMetrics.map(m => `• ${m}`).join('\n')}\n${annualRent ? `• Annual Gross: $${annualRent.toLocaleString()}` : ''}` : ''}

${features?.length ? `PROPERTY FEATURES:\n${features.map(f => `• ${f}`).join('\n')}` : ''}

${recentUpgrades ? `RECENT IMPROVEMENTS:\n${recentUpgrades}` : ''}

${neighborhood ? `LOCATION HIGHLIGHTS:\n${neighborhood}` : `Prime ${city} location with strong rental demand.`}

${uniqueSellingPoints ? `VALUE-ADD POTENTIAL:\n${uniqueSellingPoints}` : ''}

Asking Price: ${priceStr}
${capRate && price ? `Price per Sq Ft: $${Math.round(price / sqft)}` : ''}

Full financials and rent roll available to qualified investors. Schedule your showing today.`

    const socialMediaPost = `📈 INVESTOR ALERT! ${beds}BR/${baths}BA in ${city}
💰 ${priceStr}${capRate ? ` | ${capRate}% Cap Rate` : ''}
${currentRent ? `📊 Current Rent: $${currentRent.toLocaleString()}/mo` : ''}
🏠 ${sqft.toLocaleString()} sq ft ${propertyType}
📩 Numbers available to qualified investors
#RealEstateInvesting #${city.replace(/\s+/g, '')} #InvestmentProperty #CashFlow`

    const emailTemplate = `Subject: Investment Property: ${beds}BR in ${city}${capRate ? ` - ${capRate}% Cap` : ''}

Hi [Name],

I have an investment opportunity that matches your criteria:

📍 ${input.address || city}, ${state}
🛏️ ${beds} Bedrooms | 🛁 ${baths} Bathrooms
📐 ${sqft.toLocaleString()} sq ft
💰 ${priceStr}

${metricsStr ? `KEY METRICS:\n${investorMetrics.map(m => `• ${m}`).join('\n')}` : ''}

${shortDescription}

Rent roll and full financials available upon request. Would you like to review the numbers?

Best regards,
[Your Name]
[Your Contact Info]`

    return {
      headline,
      shortDescription,
      fullDescription,
      socialMediaPost,
      emailTemplate,
      seoKeywords: [
        `investment property ${city}`,
        `rental property ${city} ${state}`,
        `${beds} bedroom investment ${city}`,
        `cash flow property ${city}`,
        `cap rate ${city} real estate`,
        `income property for sale`,
        ...(features?.slice(0, 2) || [])
      ].filter(Boolean) as string[],
      alternativeHeadlines: [
        `${capRate ? `${capRate}% Cap Rate` : 'Cash Flow'} Investment in ${city}`,
        `${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} Rental Property - ${priceStr}`,
        `Investor Special: ${beds}BR ${propertyType} with ${currentRent ? `$${currentRent.toLocaleString()}/mo Income` : 'Strong Returns'}`,
        `${city} Investment: ${sqft.toLocaleString()} sq ft Income Property`,
        `Numbers Don't Lie: ${propertyType} Investment Opportunity`
      ]
    }
  }

  // Standard tones (professional, luxury, casual, family-friendly)
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

  // Build special instructions based on tone
  let toneInstructions = ''
  if (tone === 'fsbo') {
    toneInstructions = `
SPECIAL FSBO INSTRUCTIONS:
- Write in first person as the homeowner selling directly
- Use casual, personal language (e.g., "I'm selling my home", "What I love about this place")
- Mention "For Sale By Owner" or "FSBO" prominently
- Include phrases like "No agents please", "Contact owner directly"
- Emphasize potential savings on commission
- Keep the tone friendly and approachable, not salesy`
  } else if (tone === 'investor-focused') {
    toneInstructions = `
SPECIAL INVESTOR INSTRUCTIONS:
${body.currentRent ? `- Current Rent: $${body.currentRent.toLocaleString()}/month` : ''}
${body.marketRent ? `- Market Rent: $${body.marketRent.toLocaleString()}/month` : ''}
${body.capRate ? `- Cap Rate: ${body.capRate}%` : ''}
- Focus on investment metrics, ROI potential, and cash flow
- Include the phrase "Numbers available to qualified investors"
- Use investment terminology (cap rate, cash-on-cash, NOI, etc.)
- Highlight income potential and value-add opportunities
- Target sophisticated real estate investors`
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
${toneInstructions}

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
