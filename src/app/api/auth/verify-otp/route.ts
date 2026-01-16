import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { handleAuthError } from '@/lib/utils/errors';
import { formatPhoneNumber, validateGhanaPhone } from '@/lib/utils/phone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body?.phone === 'string' ? body.phone : '';
    const token = typeof body?.token === 'string' ? body.token : '';

    if (!validateGhanaPhone(phone)) {
      return NextResponse.json(
        { error: 'Enter a valid Ghana phone number.' },
        { status: 400 }
      );
    }

    if (!token || token.length !== 6) {
      return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });

    if (error) {
      return NextResponse.json({ error: handleAuthError(error) }, { status: 400 });
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json({ error: 'Unable to load user.' }, { status: 500 });
    }

    const fullName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : null;

    const userPayload = {
      id: user.id,
      phone: formattedPhone,
      full_name: fullName,
      paper_balance: '1000.00',
      live_balance: '0.00',
    };

    const { error: profileError } = await supabase
      .from('users')
      .upsert(userPayload, { onConflict: 'id' });

    if (profileError) {
      return NextResponse.json({ error: handleAuthError(profileError) }, { status: 500 });
    }

    const { data: existingBonus, error: ledgerCheckError } = await supabase
      .from('ledger_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'signup_bonus')
      .maybeSingle();

    if (ledgerCheckError) {
      return NextResponse.json(
        { error: handleAuthError(ledgerCheckError) },
        { status: 500 }
      );
    }

    if (!existingBonus) {
      const { error: ledgerError } = await supabase.from('ledger_entries').insert({
        user_id: user.id,
        mode: 'paper',
        transaction_type: 'signup_bonus',
        amount: '1000.00',
        balance_after: '1000.00',
        metadata: { reason: 'signup_bonus' },
      });

      if (ledgerError) {
        return NextResponse.json({ error: handleAuthError(ledgerError) }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: handleAuthError(error) }, { status: 500 });
  }
}
