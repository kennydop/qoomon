import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { handleAuthError } from '@/lib/utils/errors';
import { formatPhoneNumber, validateGhanaPhone } from '@/lib/utils/phone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body?.phone === 'string' ? body.phone : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!validateGhanaPhone(phone)) {
      return NextResponse.json(
        { error: 'Enter a valid Ghana phone number.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const formattedPhone = formatPhoneNumber(phone);
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: formattedPhone,
      password,
    });

    if (error) {
      return NextResponse.json({ error: handleAuthError(error) }, { status: 401 });
    }

    return NextResponse.json({ success: true, session: data.session });
  } catch (error) {
    return NextResponse.json({ error: handleAuthError(error) }, { status: 500 });
  }
}
