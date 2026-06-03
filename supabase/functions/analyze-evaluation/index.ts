import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { student_id, instructor_answers } = await req.json()
    
    // Create supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // In a real app we'd fetch the student's uploaded files and parse them.
    // For now, we will just use a predefined prompt and structure using the Gemini API.
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      // Return a simulated AI draft if no API key is present (useful for demo/testing)
      console.log('No GEMINI_API_KEY found, using mock data.');
      const draft = {
        summary: "סטודנט המגלה עניין ומוטיבציה רבה להשתלב בשדה. זיהינו כינון קשרים טובים עם הצוות, אך נדרשת עבודה נוספת על בניית מערכי שיעור מובנים יותר.",
        score: 85,
        categories: [
          {
            id: 'c1', name: 'הסתגלות לשדה', weight: 25,
            overallLevel: 'גבוהה', balance: 'השתלבות מצוינת מול הצוות, אך נדרשת יותר פרואקטיביות מול התלמידים בכיתה.',
            observationLevel: 'גבוהה', observationNote: 'נצפתה מעורבות פעילה בישיבות צוות.',
            lessonPlanLevel: null, lessonPlanNote: null,
            hasGap: false
          },
          {
            id: 'c2', name: 'אינטראקציה עם תלמידים', weight: 25,
            overallLevel: 'בינונית', balance: 'בשיחות פרטניות התקשורת טובה, בפורום כיתתי עדיין נדרש שיפור.',
            observationLevel: 'בינונית', observationNote: 'מומלץ לעבוד על פיזור מבטים ושילוב שאלות מכוונות.',
            lessonPlanLevel: 'בינונית-גבוהה', lessonPlanNote: 'התכנון כולל התייחסות למעורבות לומדים, אך קשה לביצוע.',
            hasGap: true, gapSummary: 'יש פער בין התכנון השאפתני לביצוע בשטח.',
            decisionKey: null, resolution: null
          }
        ]
      };
      
      // Save draft to DB
      const evalId = 'ev_' + Date.now();
      const { error: upsertError } = await supabaseClient.from('evaluations').upsert({
        id: evalId,
        student_id: student_id,
        draft_json: draft,
        status: 'draft',
        created_at: new Date().toISOString()
      });

      if (upsertError) {
        throw new Error(`Database error saving evaluation: ${upsertError.message}`);
      }

      return new Response(JSON.stringify({ evaluation_id: evalId, draft, smart_questions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Gemini API
    const prompt = `
      You are an expert pedagogical evaluator. Given the student's materials, provide an evaluation draft.
      Student ID: ${student_id}
      Instructor Answers: ${JSON.stringify(instructor_answers)}
      
      Output MUST be valid JSON with this structure:
      {
        "summary": "overall summary text",
        "score": 85,
        "categories": [
          {
            "id": "c1", "name": "Category Name", "weight": 25,
            "overallLevel": "גבוהה/בינונית/נמוכה", "balance": "text comparing theory vs practice",
            "observationLevel": "...", "observationNote": "...",
            "lessonPlanLevel": "...", "lessonPlanNote": "...",
            "hasGap": boolean, "gapSummary": "..."
          }
        ]
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${await response.text()}`);
    }

    const data = await response.json();
    const draftText = data.candidates[0].content.parts[0].text;
    const draft = JSON.parse(draftText);

    // Save draft to DB
    const evalId = 'ev_' + Date.now();
    const { error: upsertError } = await supabaseClient.from('evaluations').upsert({
      id: evalId,
      student_id: student_id,
      draft_json: draft,
      status: 'draft',
      created_at: new Date().toISOString()
    });

    if (upsertError) {
      throw new Error(`Database error saving evaluation: ${upsertError.message}`);
    }

    return new Response(JSON.stringify({ evaluation_id: evalId, draft, smart_questions: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error occurred' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
