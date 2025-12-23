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

  const { url } = (body as { url?: string }) ?? {}

  if (!url) {
    return NextResponse.json({ ok: false, error: 'Missing url' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid url' }, { status: 400 })
  }

  if (!parsedUrl.hostname.includes('zillow.com')) {
    return NextResponse.json(
      { ok: false, error: 'URL must be from zillow.com' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    source: 'zillow',
    url: parsedUrl.toString(),
  })
}
