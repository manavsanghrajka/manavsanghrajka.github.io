import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Vibe persona types
export type VibePesona = 'roast' | 'eli5' | 'professional';

// Vibe-specific system prompts
const VIBE_PROMPTS: Record<VibePesona, string> = {
  roast: `You are "The Roast Master" - a brutally honest, sarcastic tutor who uses humor and mild roasting to keep students engaged. 
Your style:
- Call out mistakes with sarcastic wit ("You missed that? My grandma knows better.")
- Use playful mockery to make points memorable
- Be encouraging underneath the roasts
- Never be mean-spirited, just entertainingly critical
- Keep explanations sharp and punchy`,

  eli5: `You are "The Gen-Z Bestie" - a casual, relatable tutor who explains things like a cool friend would.
Your style:
- Use modern slang naturally ("No cap", "fr fr", "lowkey", "bussin")
- Make concepts relatable with pop culture references
- Keep it chill but accurate
- Use emoji occasionally for emphasis
- Explain like you're texting a friend who needs help`,

  professional: `You are "The Professor" - a clear, academic tutor who explains concepts with proper terminology.
Your style:
- Use precise academic language
- Provide thorough, structured explanations
- Include proper citations and context where relevant
- Be encouraging but formal
- Focus on clarity and accuracy`
};

// Get vibe-enhanced prompt
function getVibePrompt(vibe: VibePesona = 'professional'): string {
  return VIBE_PROMPTS[vibe] || VIBE_PROMPTS.professional;
}

// Get the Gemini model - using Flash for better free tier limits
// gemini-2.5-pro has 50 req/day, gemini-1.5-flash has 1500 req/day on free tier
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

// Generate flashcards for a topic with vibe personality
export async function generateFlashcards(
  topicName: string,
  courseName: string,
  count: number = 10,
  vibe: VibePesona = 'professional'
): Promise<{ front: string; back: string }[]> {
  const model = getGeminiModel();
  
  const vibeInstructions = getVibePrompt(vibe);
  
  const prompt = `${vibeInstructions}

Generate ${count} flashcards for studying "${topicName}" in the context of "${courseName}".

Each flashcard should have:
- A clear, focused question on the front
- A concise answer on the back that matches your personality/vibe

Return ONLY a valid JSON array with this exact structure:
[
  { "front": "Question 1?", "back": "Answer 1" },
  { "front": "Question 2?", "back": "Answer 2" }
]

Generate educational flashcards that test key concepts, definitions, and understanding.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse flashcards from response');
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
}

// Generate study content summary for a topic with vibe personality
export async function generateStudyContent(
  topicName: string,
  courseName: string,
  vibe: VibePesona = 'professional'
): Promise<{ summary: string; keyPoints: string[]; examples: string[] }> {
  const model = getGeminiModel();
  
  const vibeInstructions = getVibePrompt(vibe);
  
  const prompt = `${vibeInstructions}

Create a comprehensive study guide for "${topicName}" in the context of "${courseName}".

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "A 2-3 paragraph detailed summary of the topic in your personality style",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "examples": ["Practical example 1", "Practical example 2", "Practical example 3"]
}

Make the content educational, accurate, and match your personality vibe.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse study content from response');
  } catch (error) {
    console.error('Error generating study content:', error);
    throw error;
  }
}

// Generate practice questions for a topic with vibe personality
export async function generatePracticeQuestions(
  topicName: string,
  courseName: string,
  count: number = 5,
  vibe: VibePesona = 'professional'
): Promise<{ question: string; options: string[]; correctIndex: number; explanation: string }[]> {
  const model = getGeminiModel();
  
  const vibeInstructions = getVibePrompt(vibe);
  
  const prompt = `${vibeInstructions}

Generate ${count} multiple-choice practice questions for "${topicName}" in the context of "${courseName}".

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "The question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct (in your personality style)"
  }
]

Create challenging but fair questions. The explanations should match your personality vibe.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse practice questions from response');
  } catch (error) {
    console.error('Error generating practice questions:', error);
    throw error;
  }
}

// Generate "Why You Were Wrong" flashcards for remediation
export async function generateRemediationFlashcards(
  question: string,
  wrongAnswer: string,
  correctAnswer: string,
  topicName: string,
  vibe: VibePesona = 'professional'
): Promise<{ front: string; back: string }[]> {
  const model = getGeminiModel();
  
  const vibeInstructions = getVibePrompt(vibe);
  
  const prompt = `${vibeInstructions}

A student got this question wrong:
Question: "${question}"
They answered: "${wrongAnswer}"
Correct answer: "${correctAnswer}"
Topic: "${topicName}"

Generate 3 flashcards that help them understand why they were wrong and reinforce the correct concept.

Return ONLY a valid JSON array:
[
  { "front": "Why is X wrong?", "back": "Explanation in your personality style" },
  { "front": "Clarifying question", "back": "Answer" },
  { "front": "Related concept question", "back": "Answer" }
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse remediation flashcards from response');
  } catch (error) {
    console.error('Error generating remediation flashcards:', error);
    throw error;
  }
}

// Generate a personalized study schedule
export async function generateStudySchedule(
  courseName: string,
  topics: string[],
  daysUntilExam: number,
  minutesPerDay: number
): Promise<{ date: string; tasks: { topic: string; type: string; duration: number }[] }[]> {
  const model = getGeminiModel();
  
  const prompt = `Create a study schedule for "${courseName}" with these parameters:
- Topics to cover: ${topics.join(', ')}
- Days until exam: ${daysUntilExam}
- Minutes per day: ${minutesPerDay}

Return ONLY a valid JSON array of daily schedules:
[
  {
    "date": "Day 1",
    "tasks": [
      { "topic": "Topic Name", "type": "learn", "duration": 30 },
      { "topic": "Topic Name", "type": "practice", "duration": 30 }
    ]
  }
]

Task types: "learn" (new material), "review" (revisit), "practice" (exercises)
Distribute topics evenly and include spaced repetition for previously learned topics.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse study schedule from response');
  } catch (error) {
    console.error('Error generating study schedule:', error);
    throw error;
  }
}

// Generate dual-host podcast script for Hyper-Cast
export async function generatePodcastScript(
  topicName: string,
  courseName: string,
  vibe: VibePesona = 'professional',
  durationMinutes: number = 5
): Promise<{ hostA: string; hostB: string }[]> {
  const model = getGeminiModel();
  
  const vibeInstructions = getVibePrompt(vibe);
  
  const prompt = `${vibeInstructions}

Create a ${durationMinutes}-minute educational podcast script about "${topicName}" for "${courseName}".

The podcast has two hosts:
- HOST_A: The expert tutor (following your personality vibe)
- HOST_B: The curious student asking questions

Return ONLY a valid JSON array of dialogue exchanges:
[
  { "hostA": "Welcome back to Hyperlapse! Today we're tackling...", "hostB": "" },
  { "hostA": "", "hostB": "Oh I've been confused about this one. So like, how does..." },
  { "hostA": "Great question! The key thing to understand is...", "hostB": "" }
]

Make it engaging, educational, and match the personality vibe. Include 10-15 exchanges.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse podcast script from response');
  } catch (error) {
    throw error;
  }
}

// Topic with full study content
export interface TopicWithContent {
  name: string;
  summary: string;
  keyPoints: string[];
  examples: string[];
}

export interface UnitWithContent {
  name: string;
  weight: number;
  topics: TopicWithContent[];
}

export interface CourseFromDocument {
  title: string;
  description: string;
  units: UnitWithContent[];
}

// Generate a structured course from an uploaded document (PDF, Text, etc.)
// Now extracts FULL study content for each topic
export async function generateCourseFromDocument(
  fileBase64: string,
  mimeType: string
): Promise<CourseFromDocument> {
  // Use Gemini 2.0 Flash for multimodal processing
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze the attached document and extract a COMPREHENSIVE structured course for a study plan.

For each Topic, you MUST extract:
1. A clear descriptive name
2. A detailed 2-3 paragraph summary explaining the concept
3. 4-6 key points that a student should memorize
4. 2-3 practical examples or applications

Identify the main subject as the Course Title.
Group the content into logical Units (e.g., Chapters, Modules, Themes).
Assign a relative weight (0.0 to 1.0) to each unit based on its length/importance.

Return ONLY a valid JSON object with this EXACT structure:
{
  "title": "Course Name",
  "description": "Brief summary of the document content",
  "units": [
    {
      "name": "Unit 1 Name",
      "weight": 0.2,
      "topics": [
        {
          "name": "Topic Name",
          "summary": "A detailed 2-3 paragraph explanation of this topic covering all key concepts...",
          "keyPoints": [
            "Key point 1 - important fact or concept",
            "Key point 2 - another crucial detail",
            "Key point 3 - something to remember",
            "Key point 4 - additional important info"
          ],
          "examples": [
            "Example 1: Practical application or illustration",
            "Example 2: Another real-world example"
          ]
        }
      ]
    }
  ]
}

IMPORTANT: Extract as much detail as possible from the document for each topic. The summaries should be comprehensive enough for a student to learn from.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType
        }
      }
    ]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Could not parse course structure from document response');
  } catch (error) {
    console.error('Error generating course from document:', error);
    throw error;
  }
}
