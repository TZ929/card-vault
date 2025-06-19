import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  try {
    const res = await fetch(
      `https://api.sportscard.io/v1/cards/search?query=${encodeURIComponent(q)}`,
      { headers: { 'x-api-key': process.env.SPORTSCARD_API_KEY! } },
    )
    if (!res.ok) return NextResponse.json([])

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[scard] autocomplete failed', err)
    return NextResponse.json([])        // just return empty suggestions
  }
}
