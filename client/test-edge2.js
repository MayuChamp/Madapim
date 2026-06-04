import 'dotenv/config';

async function run() {
  const url = process.env.VITE_SUPABASE_URL + '/functions/v1/analyze-evaluation';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ student_id: 's1', instructor_answers: {} })
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text);
}
run();
