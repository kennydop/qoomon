import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { handleAuthError } from '@/lib/utils/errors';
import { formatPhoneNumber, validateGhanaPhone } from '@/lib/utils/phone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body?.phone === 'string' ? body.phone : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const fullName = typeof body?.fullName === 'string' ? body.fullName : undefined;

    if (!validateGhanaPhone(phone)) {
      return NextResponse.json(
        { error: 'Enter a valid Ghana phone number.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      phone: formattedPhone,
      password,
      options: {
        channel: 'sms',
        data: {
          full_name: fullName ?? null,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: handleAuthError(error) }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      phone: formattedPhone,
      needsVerification: true,
    });
  } catch (error) {
    return NextResponse.json({ error: handleAuthError(error) }, { status: 500 });
  }
}
