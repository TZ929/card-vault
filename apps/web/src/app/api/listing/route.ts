import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userId}`, // Or a more secure internal token
      },
      body: JSON.stringify(body),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      return NextResponse.json(
        { error: `API error: ${errorText}` },
        { status: apiResponse.status }
      )
    }

    const data = await apiResponse.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 