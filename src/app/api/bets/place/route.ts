import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Bet placement is not available in this UI-only update.' },
    { status: 501 }
  );
}
