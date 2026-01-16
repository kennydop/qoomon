import { NextResponse } from 'next/server';

import {
  createClient,
  createServiceRoleClient,
} from '@/lib/supabase/server';
import { handleAuthError } from '@/lib/utils/errors';
import { formatPhoneNumber, validateGhanaPhone } from '@/lib/utils/phone';
import { recordLedgerEntry } from '@/lib/services/ledger';

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
    const serviceSupabase = createServiceRoleClient();

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

    const { data: existingProfile, error: lookupError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: handleAuthError(lookupError) }, { status: 500 });
    }

    if (existingProfile) {
      const updatePayload: {
        phone: string;
        full_name?: string | null;
      } = {
        phone: formattedPhone,
      };

      if (fullName) {
        updatePayload.full_name = fullName;
      }

      const { error: updateError } = await serviceSupabase
        .from('users')
        .update(updatePayload)
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json({ error: handleAuthError(updateError) }, { status: 500 });
      }
    } else {
      const { error: insertError } = await serviceSupabase.from('users').insert({
        id: user.id,
        phone: formattedPhone,
        full_name: fullName,
      paper_balance: '0.00',
        live_balance: '0.00',
      });

      if (insertError) {
        return NextResponse.json({ error: handleAuthError(insertError) }, { status: 500 });
      }

      await recordLedgerEntry(
        user.id,
        'paper',
        1000,
        'signup_bonus',
        { metadata: { reason: 'signup_bonus' } },
        { client: serviceSupabase }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: handleAuthError(error) }, { status: 500 });
  }
}
