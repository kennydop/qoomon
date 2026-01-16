import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { handleAuthError } from '@/lib/utils/errors';

export async function POST() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: handleAuthError(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: handleAuthError(error) }, { status: 500 });
  }
}
