import { z } from 'zod';

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const supabaseEnv = supabaseEnvSchema.parse(process.env);

export const SUPABASE_URL = supabaseEnv.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
