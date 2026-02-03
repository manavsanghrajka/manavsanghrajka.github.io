import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { generatePodcastScript, VibePesona } from '@/lib/gemini';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Voice IDs for dual-host podcast
const VOICES = {
  hostA: 'EXAVITQu4vr4xnSDxMaL', // "Sarah" - The Tutor (clear, authoritative)
  hostB: 'pNInz6obpgDQGcFmaJgB', // "Adam" - The Student (curious, casual)
};

// Generate MD5 hash for cache key
function generateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Helper to get user's vibe preference
async function getUserVibe(supabase: any, userId: string): Promise<VibePesona> {
  const { data } = await supabase
    .from('User')
    .select('vibe_persona')
    .eq('id', userId)
    .single();
  
  return (data?.vibe_persona as VibePesona) || 'professional';
}

// Generate audio from text using ElevenLabs
async function generateAudio(text: string, voiceId: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY!
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs error:', errorText);
    throw new Error('Failed to generate audio');
  }

  return response.arrayBuffer();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topicId, topicName, contextText, dualHost = false, durationMinutes = 5 } = body;

    if (!topicName) {
      return NextResponse.json({ error: 'topicName is required' }, { status: 400 });
    }

    // Generate content hash for caching
    const contentToHash = `${topicName}:${contextText || ''}:${dualHost}`;
    const sourceHash = generateHash(contentToHash);

    // 1. Check cache first
    const { data: cached } = await supabase
      .from('audio_cache')
      .select('*')
      .eq('topic_id', topicId || topicName)
      .eq('source_hash', sourceHash)
      .single();

    if (cached) {
      return NextResponse.json({
        success: true,
        audioUrl: cached.storage_url,
        cached: true,
        dualHost: cached.voice_config?.dualHost || false
      });
    }

    // Get user's vibe preference
    const userVibe = await getUserVibe(supabase, user.id);

    let audioData: Uint8Array;
    let voiceConfig = { dualHost: false, hostA: '', hostB: '' };

    if (dualHost && ELEVENLABS_API_KEY) {
      // 2. DUAL-HOST MODE: Generate podcast script with two hosts
      const podcastScript = await generatePodcastScript(
        topicName,
        contextText || 'General study topic',
        userVibe,
        durationMinutes
      );

      // 3. Generate audio for each segment and combine
      const audioSegments: ArrayBuffer[] = [];
      
      for (const exchange of podcastScript) {
        if (exchange.hostA && exchange.hostA.trim()) {
          const audioA = await generateAudio(exchange.hostA, VOICES.hostA);
          audioSegments.push(audioA);
        }
        if (exchange.hostB && exchange.hostB.trim()) {
          const audioB = await generateAudio(exchange.hostB, VOICES.hostB);
          audioSegments.push(audioB);
        }
      }

      // Combine all segments into one buffer
      const totalLength = audioSegments.reduce((acc, buf) => acc + buf.byteLength, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const segment of audioSegments) {
        combined.set(new Uint8Array(segment), offset);
        offset += segment.byteLength;
      }

      audioData = combined;
      voiceConfig = { dualHost: true, hostA: VOICES.hostA, hostB: VOICES.hostB };

    } else {
      // SINGLE-HOST MODE: Original behavior
      const scriptPrompt = `You are an energetic, engaging professor recording an audio lesson. 
Create a 3-5 minute spoken-word summary about "${topicName}".

${contextText ? `Context/Notes:\n${contextText}\n\n` : ''}

Guidelines:
- Use an energetic, conversational tone
- Include analogies and examples to explain concepts
- Use rhetorical questions to keep listeners engaged
- Add clear transitions between topics
- Do NOT use bullet points or numbered lists
- Write as if you're speaking directly to a student
- Start with a hook to grab attention
- End with a memorable takeaway

Write the complete script now:`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: scriptPrompt }] }]
          })
        }
      );

      if (!geminiResponse.ok) {
        throw new Error('Failed to generate script');
      }

      const geminiData = await geminiResponse.json();
      const script = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!script) {
        throw new Error('No script generated');
      }

      const audioBuffer = await generateAudio(script, VOICES.hostA);
      audioData = new Uint8Array(audioBuffer);
      voiceConfig = { dualHost: false, hostA: VOICES.hostA, hostB: '' };
    }

    // 4. Upload to Supabase Storage
    const fileName = `${topicId || topicName.replace(/\s+/g, '-')}-${Date.now()}.mp3`;
    const filePath = `audio/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('study-audio')
      .upload(filePath, audioData, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload audio');
    }

    // 5. Get public URL
    const { data: urlData } = supabase.storage
      .from('study-audio')
      .getPublicUrl(filePath);

    const audioUrl = urlData.publicUrl;

    // 6. Cache the result
    await supabase.from('audio_cache').insert({
      topic_id: topicId || topicName,
      topic_name: topicName,
      source_hash: sourceHash,
      storage_url: audioUrl,
      voice_config: voiceConfig
    });

    return NextResponse.json({
      success: true,
      audioUrl,
      cached: false,
      dualHost: voiceConfig.dualHost,
      vibe: userVibe
    });

  } catch (error: any) {
    console.error('Audio generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
