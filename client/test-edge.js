import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.functions.invoke('analyze-evaluation', {
    body: { student_id: 's1', instructor_answers: {} }
  });
  console.log("Data:", data);
  console.log("Error:", error);
}

run();
