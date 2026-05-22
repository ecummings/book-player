import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const events = await req.json();
  // In production, persist to DB. For MVP, acknowledge receipt.
  console.log('[analytics]', JSON.stringify(events).slice(0, 200));
  return NextResponse.json({ ok: true, received: Array.isArray(events) ? events.length : 1 });
}
