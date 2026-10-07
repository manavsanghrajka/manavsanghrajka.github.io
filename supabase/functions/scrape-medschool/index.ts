/**
 * scrape-medschool — Supabase Edge Function
 * 
 * Fetches university admissions pages via fetch(), parses HTML with
 * regex/string matching, and updates the medical_schools table.
 * 
 * Usage:
 *   POST /scrape-medschool
 *   Body: { school_id: "aberdeen-a100", url: "https://..." }
 *   
 *   Or batch: POST /scrape-medschool { batch: true }
 *   
 * Note: This uses Deno's native fetch() — no Playwright.
 * For JS-rendered pages, integrate a headless browser service.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { school_id, url, batch } = body;

    if (batch) {
      // Batch scrape: get all schools with official URLs
      const { data: schools, error } = await supabase
        .from('medical_schools')
        .select('id, official_url')
        .not('official_url', 'is', null);

      if (error) throw error;

      const results = [];
      for (const school of schools || []) {
        const result = await scrapeSchool(supabase, school.id, school.official_url);
        results.push(result);
        // Rate limiting: 1 second between requests
        await new Promise(r => setTimeout(r, 1000));
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!school_id || !url) {
      return new Response(
        JSON.stringify({ error: 'Missing school_id or url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await scrapeSchool(supabase, school_id, url);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Scrape a single school's admissions page and update the database.
 */
async function scrapeSchool(supabase, schoolId, url) {
  const fieldsUpdated = [];
  let status = 'success';
  let errorMessage = null;
  let htmlExcerpt = null;

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MedSchool-Dashboard-Scraper/1.0 (Educational)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    const html = await response.text();
    htmlExcerpt = html.substring(0, 500);

    // Extract data using pattern matching
    const extracted = extractFromHtml(html);

    // Build update object (only non-null extracted fields)
    const updates = {};

    if (extracted.ucatCutoff !== null) {
      updates.ucat_cutoff = extracted.ucatCutoff;
      fieldsUpdated.push('ucat_cutoff');
    }

    if (extracted.gradeReqALevel) {
      updates.grade_req_alevel = extracted.gradeReqALevel;
      fieldsUpdated.push('grade_req_alevel');
    }

    if (extracted.interviewStyle) {
      updates.interview_style = extracted.interviewStyle;
      fieldsUpdated.push('interview_style');
    }

    if (extracted.annualTuitionIntl) {
      updates.annual_tuition_intl = extracted.annualTuitionIntl;
      fieldsUpdated.push('annual_tuition_intl');
    }

    // Update database if we found anything
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      updates.source_status = 'official';

      const { error } = await supabase
        .from('medical_schools')
        .update(updates)
        .eq('id', schoolId);

      if (error) throw error;
    }
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
  }

  // Log the scrape attempt
  await supabase.from('scraper_logs').insert({
    school_id: schoolId,
    source_url: url,
    fields_updated: fieldsUpdated,
    status,
    error_message: errorMessage,
    raw_html_excerpt: htmlExcerpt,
  });

  return {
    school_id: schoolId,
    status,
    fields_updated: fieldsUpdated,
    error: errorMessage,
  };
}

/**
 * Extract admissions data from raw HTML using regex patterns.
 * This is a rule-based V1 extractor — an LLM could replace this.
 */
function extractFromHtml(html) {
  const result = {
    ucatCutoff: null,
    gradeReqALevel: null,
    interviewStyle: null,
    annualTuitionIntl: null,
  };

  // Try to find UCAT score patterns
  const ucatPatterns = [
    /minimum\s*(?:UCAT|ucat)\s*(?:score|cut[- ]?off)[\s:]*(\d{3,4})/i,
    /UCAT\s*(?:threshold|minimum)[\s:]*(\d{3,4})/i,
    /cut[- ]?off[\s:]*(\d{3,4})\s*(?:out of|\/)\s*(?:2700|3600)/i,
  ];

  for (const pattern of ucatPatterns) {
    const match = html.match(pattern);
    if (match) {
      const score = parseInt(match[1]);
      if (score >= 900 && score <= 3600) {
        result.ucatCutoff = score;
        break;
      }
    }
  }

  // A-Level requirements
  const aLevelPattern = /(?:entry|grade|academic)\s*(?:requirements?|criteria)[\s\S]*?(A\*?A\*?[A-B])/i;
  const aLevelMatch = html.match(aLevelPattern);
  if (aLevelMatch) {
    result.gradeReqALevel = aLevelMatch[1];
  }

  // Interview style
  if (/\bMMI\b/i.test(html) || /multiple\s*mini/i.test(html)) {
    result.interviewStyle = 'MMI';
  } else if (/\bpanel\s*interview/i.test(html)) {
    result.interviewStyle = 'Panel';
  }

  // International tuition
  const tuitionPattern = /(?:international|overseas)\s*(?:tuition|fee)[\s\S]*?£\s*([\d,]+)/i;
  const tuitionMatch = html.match(tuitionPattern);
  if (tuitionMatch) {
    const fee = parseInt(tuitionMatch[1].replace(/,/g, ''));
    if (fee >= 10000 && fee <= 100000) {
      result.annualTuitionIntl = fee;
    }
  }

  return result;
}
