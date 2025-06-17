import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const json = await req.json();
  const res = await fetch(
    // your Nest backend URL + `/s3/presigned`
    `${process.env.NEXT_PUBLIC_API_URL}/s3/presigned`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
    }
  );
  const payload = await res.json();
  return NextResponse.json(payload);
}
