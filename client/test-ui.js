import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'demo@madapim.co.il',
    password: 'demo' // I don't know the password...
  });
  console.log("Auth:", !!session, authError?.message);
}
run();
