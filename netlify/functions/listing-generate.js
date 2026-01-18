// Listing Generator Netlify Function
// Endpoint: /.netlify/functions/listing-generate

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

  const {
    propertyType,
    beds,
    baths,
    sqft,
    yearBuilt,
    city = 'Your City',
    state = '',
    features = [],
    recentUpgrades,
    neighborhood,
    uniqueSellingPoints,
    tone = 'professional',
    price,
    address,
    zipcode = ''
  } = body;

  if (!propertyType || beds === undefined || baths === undefined || sqft === undefined) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'Missing required fields: propertyType, beds, baths, sqft' })
    };
  }

  // Try Claude API
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let aiResponse = null;

  if (anthropicKey) {
    try {
      const prompt = buildPrompt(body);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.content?.[0]?.text || null;
      }
    } catch (error) {
      console.error('Claude API error:', error);
    }
  }

  if (!aiResponse && openaiKey) {
    try {
      const prompt = buildPrompt(body);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || null;
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
    }
  }

  // Parse AI response or use template
  let listing;
  if (aiResponse) {
    listing = parseAIResponse(aiResponse, body);
  } else {
    listing = generateFromTemplate(body);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      listing,
      source: aiResponse ? 'ai' : 'template'
    })
  };
};

function buildPrompt(input) {
  const { propertyType, beds, baths, sqft, yearBuilt, city, state, features, recentUpgrades, neighborhood, uniqueSellingPoints, tone, price, address, zipcode, targetAudience, platform } = input;

  return `You are an expert real estate copywriter. Generate compelling property listing content based on the following details:

PROPERTY DETAILS:
- Type: ${propertyType}
- Bedrooms: ${beds}
- Bathrooms: ${baths}
- Square Footage: ${sqft?.toLocaleString?.() || sqft}
${yearBuilt ? `- Year Built: ${yearBuilt}` : ''}
${price ? `- Price: $${price?.toLocaleString?.() || price}` : ''}
${address ? `- Address: ${address}, ${city}, ${state} ${zipcode}` : city ? `- Location: ${city}, ${state}` : ''}

${features?.length ? `FEATURES:\n${features.map(f => `- ${f}`).join('\n')}` : ''}

${recentUpgrades ? `RECENT UPGRADES:\n${recentUpgrades}` : ''}

${neighborhood ? `NEIGHBORHOOD:\n${neighborhood}` : ''}

${uniqueSellingPoints ? `UNIQUE SELLING POINTS:\n${uniqueSellingPoints}` : ''}

REQUIREMENTS:
- Tone: ${tone || 'professional'}
- Target Audience: ${targetAudience || 'general'}
- Platform: ${platform || 'all'}

Generate the following in JSON format:
{
  "headline": "Attention-grabbing headline (max 80 chars)",
  "shortDescription": "50-100 word teaser description",
  "fullDescription": "300-500 word detailed property description with paragraphs",
  "socialMediaPost": "Platform-optimized post with emojis and hashtags",
  "emailTemplate": "Professional email template with subject line",
  "seoKeywords": ["keyword1", "keyword2", ...],
  "alternativeHeadlines": ["headline1", "headline2", "headline3"]
}`;
}

function parseAIResponse(response, input) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        headline: parsed.headline || '',
        shortDescription: parsed.shortDescription || parsed.short_description || '',
        fullDescription: parsed.fullDescription || parsed.full_description || '',
        socialMediaPost: parsed.socialMediaPost || parsed.social_media_post || '',
        emailTemplate: parsed.emailTemplate || parsed.email_template || '',
        seoKeywords: parsed.seoKeywords || parsed.seo_keywords || [],
        alternativeHeadlines: parsed.alternativeHeadlines || parsed.alternative_headlines || []
      };
    }
  } catch {
    // Fall through to template
  }
  return generateFromTemplate(input);
}

function generateFromTemplate(input) {
  const {
    propertyType,
    beds,
    baths,
    sqft,
    yearBuilt,
    city = 'Your City',
    state = '',
    features = [],
    recentUpgrades,
    neighborhood,
    uniqueSellingPoints,
    tone = 'professional',
    price,
    zipcode = ''
  } = input;

  const priceStr = price ? `$${price?.toLocaleString?.() || price}` : 'Contact for pricing';
  const yearStr = yearBuilt ? `, built in ${yearBuilt}` : '';
  const featuresStr = features?.length ? features.join(', ') : 'modern amenities';

  const toneAdjectives = {
    'professional': ['well-maintained', 'desirable', 'excellent'],
    'luxury': ['exquisite', 'stunning', 'prestigious'],
    'casual': ['cozy', 'comfortable', 'inviting'],
    'family-friendly': ['spacious', 'welcoming', 'perfect for families'],
    'investor-focused': ['high-yield', 'turnkey', 'income-producing']
  };

  const adj = toneAdjectives[tone] || toneAdjectives['professional'];

  const headline = `${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${beds}BR/${baths}BA ${propertyType} in ${city}`;

  const shortDescription = `${adj[1].charAt(0).toUpperCase() + adj[1].slice(1)} ${beds} bedroom, ${baths} bathroom ${propertyType.toLowerCase()} featuring ${sqft?.toLocaleString?.() || sqft} sq ft of living space${yearStr}. ${featuresStr.charAt(0).toUpperCase() + featuresStr.slice(1)}. ${priceStr}.`;

  const fullDescription = `Welcome to this ${adj[0]} ${propertyType.toLowerCase()} located in the heart of ${city}, ${state}. This ${adj[1]} home offers ${beds} bedrooms and ${baths} bathrooms with ${sqft?.toLocaleString?.() || sqft} square feet of thoughtfully designed living space${yearStr}.

${features?.length ? `Property highlights include: ${featuresStr}.` : ''}

${recentUpgrades ? `Recent updates: ${recentUpgrades}.` : ''}

${neighborhood ? `The neighborhood: ${neighborhood}` : `Conveniently located in ${city} with easy access to local amenities, schools, and transportation.`}

${uniqueSellingPoints ? `What makes this home special: ${uniqueSellingPoints}` : ''}

Don't miss this ${adj[2]} opportunity! Schedule your showing today.

Offered at ${priceStr}.`;

  const socialMediaPost = `🏠 NEW LISTING! ${beds}BR/${baths}BA in ${city}, ${state}
📐 ${sqft?.toLocaleString?.() || sqft} sq ft | ${priceStr}
✨ ${features?.slice(0, 3).join(' • ') || 'Move-in ready!'}
📩 DM for details or to schedule a tour!
#RealEstate #${city.replace(/\s+/g, '')} #HomeForSale #${propertyType.replace(/\s+/g, '')}`;

  const emailTemplate = `Subject: ${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${beds}BR Home in ${city} - Just Listed!

Hi [Name],

I wanted to share an exciting new listing that might be perfect for you:

📍 ${input.address || city}, ${state}
🛏️ ${beds} Bedrooms | 🛁 ${baths} Bathrooms
📐 ${sqft?.toLocaleString?.() || sqft} sq ft
💰 ${priceStr}

${shortDescription}

Would you like to schedule a private showing? Reply to this email or call me directly.

Best regards,
[Your Name]
[Your Contact Info]`;

  const seoKeywords = [
    `${beds} bedroom home ${city}`,
    `${propertyType.toLowerCase()} for sale ${city} ${state}`,
    `${city} real estate`,
    `homes for sale ${zipcode || city}`,
    `${baths} bathroom house ${city}`,
    `${sqft} sq ft home`,
    yearBuilt ? `${yearBuilt}s home ${city}` : `home ${city}`,
    ...(features?.slice(0, 3) || [])
  ].filter(Boolean);

  const alternativeHeadlines = [
    `${beds}BR/${baths}BA ${propertyType} - ${priceStr}`,
    `${adj[1].charAt(0).toUpperCase() + adj[1].slice(1)} Home in ${city} - ${sqft?.toLocaleString?.() || sqft} sq ft`,
    `Move-In Ready ${propertyType} in ${city}`,
    `${city} ${propertyType} - ${beds} Beds, ${baths} Baths`,
    `Don't Miss This ${adj[0].charAt(0).toUpperCase() + adj[0].slice(1)} ${city} Home!`
  ];

  return {
    headline,
    shortDescription,
    fullDescription,
    socialMediaPost,
    emailTemplate,
    seoKeywords,
    alternativeHeadlines
  };
}
