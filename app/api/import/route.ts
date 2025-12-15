import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let body: unknown

  try {
    body = await req.json()
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { url } = (body ?? {}) as { url?: unknown }

  if (typeof url !== 'string' || !url.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Missing or invalid "url"' },
      { status: 400 }
    )
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Invalid URL' },
      { status: 400 }
    )
  }

  const hostname = parsed.hostname.toLowerCase()
  if (!hostname.includes('zillow.com')) {
    return NextResponse.json(
      { ok: false, error: 'URL must be from zillow.com' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    source: 'zillow',
    url: parsed.toString(),
  })
}
