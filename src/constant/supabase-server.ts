import 'server-only';

import { z } from 'zod';

const supabaseServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const supabaseServerEnv = supabaseServerEnvSchema.parse(process.env);

export const SUPABASE_SERVICE_ROLE_KEY = supabaseServerEnv.SUPABASE_SERVICE_ROLE_KEY;
