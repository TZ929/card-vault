import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json([])

  const res = await fetch(`https://api.sportscard.io/v1/cards/search?query=${encodeURIComponent(q)}`, {
    headers: { 'x-api-key': process.env.SPORTSCARD_API_KEY! },
  })
  const data = await res.json()
  // return only needed fields
  const simplified = data.cards.slice(0, 8).map((c: any) => ({ id: c.id, name: c.title }))
  return NextResponse.json(simplified)
}
