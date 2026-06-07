// Supabase Edge Function: submit-score
// Validates game stats before inserting score into leaderboard
// Deploy with: supabase functions deploy submit-score

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { player_name, score, fruits_spawned, fruits_sliced, elapsed_time } = await req.json()

    // --- Validation ---

    // Basic field checks
    if (!player_name || typeof player_name !== 'string' || player_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid player name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (player_name.trim().length > 20) {
      return new Response(
        JSON.stringify({ error: 'Player name too long (max 20 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
      return new Response(
        JSON.stringify({ error: 'Invalid score' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Sanity Checks (Anti-Cheat) ---

    // Score can't exceed fruits sliced (base points) + reasonable combo bonuses
    // Max theoretical: every fruit is in a combo of 5 = fruits_sliced * 2 roughly
    const maxReasonableScore = (fruits_sliced || 0) * 3
    if (score > maxReasonableScore && score > 10) {
      return new Response(
        JSON.stringify({ error: 'Score exceeds reasonable maximum for fruits sliced' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Can't slice more fruits than spawned
    if (fruits_sliced > fruits_spawned) {
      return new Response(
        JSON.stringify({ error: 'Sliced more fruits than spawned' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Game should last at least a few seconds
    if (elapsed_time < 2) {
      return new Response(
        JSON.stringify({ error: 'Game too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Game can't last more than 50 seconds (45s + buffer)
    if (elapsed_time > 50) {
      return new Response(
        JSON.stringify({ error: 'Game duration exceeds maximum' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Score rate check: max ~3 fruits/second is reasonable
    const scoreRate = score / Math.max(1, elapsed_time)
    if (scoreRate > 5) {
      return new Response(
        JSON.stringify({ error: 'Score rate too high' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Insert Score ---

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .insert({
        player_name: player_name.trim().substring(0, 20),
        score: score,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
