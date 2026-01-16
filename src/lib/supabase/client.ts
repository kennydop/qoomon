import { createBrowserClient } from '@supabase/ssr';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constant/supabase';
import type { Database } from './types';

const browserClient = createBrowserClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export default browserClient;
