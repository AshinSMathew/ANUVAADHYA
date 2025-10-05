import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface SubtitleItem {
  startTime: number;
  endTime: number;
  text: string;
  index: number;
}

interface SceneMatch {
  subtitleIndex: number;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  reason: string;
}

interface SearchRequest {
  query: string;
  subtitles: SubtitleItem[];
  video_duration: number;
  target_language: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    
    const { query, subtitles, video_duration, target_language } = body;

    // Validate required fields
    if (!query || !subtitles || !video_duration) {
      return NextResponse.json(
        { error: 'Missing required fields: query, subtitles, or video_duration' },
        { status: 400 }
      );
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    // Prepare comprehensive subtitle context (use more subtitles for better context)
    const subtitleContext = subtitles
      .slice(0, 200) // Increased to 200 for better context understanding
      .map(sub => `[${sub.index}] ${formatTime(sub.startTime)}-${formatTime(sub.endTime)}: ${sub.text}`)
      .join('\n');

    // Enhanced system prompt for semantic understanding
    const systemPrompt = `You are an intelligent video scene search assistant that understands scenarios, contexts, and semantic meaning. Your task is to find subtitle segments that match the user's query based on meaning, not just keywords.

CRITICAL INSTRUCTIONS:
1. UNDERSTAND THE SCENARIO: The user will describe scenarios, situations, emotions, or actions. You must understand the semantic meaning.
2. CONSIDER CONTEXT: Look for scenes that match the described scenario even if the exact words aren't present.
3. ANALYZE COMPREHENSIVELY: Consider:
   - Emotional tone (happy, sad, angry, romantic, tense, etc.)
   - Actions and events (fighting, confessing, celebrating, arguing, etc.)
   - Situations and contexts (rain, night, party, office, etc.)
   - Character interactions (dialogue patterns, relationships)
   - Semantic similarity and thematic relevance

4. RETURN STRUCTURED DATA: Provide exactly this JSON format:
{
  "matches": [
    {
      "subtitleIndex": number,
      "startTime": number,
      "endTime": number,
      "text": string,
      "confidence": number (0.0-1.0),
      "reason": string (detailed explanation of why this matches the scenario)
    }
  ]
}

5. CONFIDENCE SCORING:
   - 0.9-1.0: Perfect match - directly describes the scenario
   - 0.7-0.89: Strong match - clearly relates to the scenario
   - 0.5-0.69: Good match - relevant to the scenario
   - 0.3-0.49: Partial match - some relevance
   - <0.3: Weak match - minimal relevance

6. REASON FIELD: Be specific about what makes it match:
   - "Characters are arguing intensely about their relationship"
   - "Scene depicts a romantic confession in emotional dialogue"
   - "Action sequence with fast-paced movement and tension"
   - "Emotional scene with sad dialogue and melancholic tone"

7. RETURN 3-8 most relevant matches, prioritizing higher confidence ones.

Remember: You're searching through TRANSLATED subtitles. The user query is in English, and you're matching against translated content. Focus on meaning, not literal word matching.`;

    // Enhanced user prompt with better context
    const userPrompt = `
VIDEO ANALYSIS REQUEST

VIDEO METADATA:
- Duration: ${formatTime(video_duration)}
- Target Language: ${target_language}
- Total Subtitles: ${subtitles.length}

USER'S SCENARIO QUERY: "${query}"

TRANSLATED SUBTITLES TO ANALYZE:
${subtitleContext}

ANALYSIS TASK:
Find subtitle segments that semantically match the described scenario "${query}".

Focus on:
- Emotional and situational context
- Character interactions and dialogue patterns
- Thematic relevance and semantic meaning
- Actions, events, and emotional tones

Return the most relevant matches in the specified JSON format.`;

    // Call Groq API with better model for understanding
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content from Groq API');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', responseContent);
      // Try fallback semantic matching
      const fallbackMatches = await semanticFallbackMatching(query, subtitles, video_duration);
      return NextResponse.json(fallbackMatches);
    }

    // Extract matches array from response
    const matches = parsedResponse.matches || [];
    
    if (!Array.isArray(matches)) {
      throw new Error('Invalid response format: expected array of matches');
    }

    // Validate and process matches
    const validatedMatches: SceneMatch[] = [];
    
    for (const match of matches.slice(0, 8)) { // Increased to 8 matches
      if (isValidSceneMatch(match)) {
        // Find the original subtitle to ensure data consistency
        const originalSubtitle = subtitles.find(sub => sub.index === match.subtitleIndex);
        if (originalSubtitle) {
          validatedMatches.push({
            subtitleIndex: match.subtitleIndex,
            startTime: originalSubtitle.startTime,
            endTime: originalSubtitle.endTime,
            text: originalSubtitle.text,
            confidence: Math.min(Math.max(match.confidence, 0), 1), // Clamp between 0-1
            reason: match.reason || `Matches scenario: ${query}`
          });
        }
      }
    }

    // If no validated matches found, use enhanced fallback
    if (validatedMatches.length === 0) {
      const fallbackMatches = await semanticFallbackMatching(query, subtitles, video_duration);
      return NextResponse.json(fallbackMatches.slice(0, 5));
    }

    // Sort by confidence and return
    validatedMatches.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`Found ${validatedMatches.length} matches for query: "${query}"`);
    
    return NextResponse.json(validatedMatches);

  } catch (error) {
    console.error('Scene search error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Final fallback to keyword matching
    try {
      const body: SearchRequest = await request.json();
      const fallbackMatches = enhancedKeywordMatching(body.query, body.subtitles);
      return NextResponse.json(fallbackMatches.slice(0, 3));
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          error: 'Failed to search scenes',
          details: errorMessage 
        },
        { status: 500 }
      );
    }
  }
}

// Enhanced semantic fallback matching
async function semanticFallbackMatching(query: string, subtitles: SubtitleItem[], duration: number): Promise<SceneMatch[]> {
  try {
    // Use a simpler prompt for fallback
    const fallbackPrompt = `
Find subtitle segments that match this scenario: "${query}"

Available subtitles (first 100):
${subtitles.slice(0, 100).map(sub => `[${sub.index}] ${sub.text}`).join('\n')}

Return 3-5 matches with confidence scores. Focus on meaning and context.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Find subtitle segments that match scenarios. Return JSON with subtitleIndex, confidence (0-1), and brief reason.'
        },
        {
          role: 'user',
          content: fallbackPrompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      try {
        const parsed = JSON.parse(response);
        const matches = Array.isArray(parsed) ? parsed : parsed.matches || [];
        
        return matches
          .filter((match: any) => match.subtitleIndex && match.confidence)
          .map((match: any) => {
            const original = subtitles.find(sub => sub.index === match.subtitleIndex);
            return original ? {
              subtitleIndex: match.subtitleIndex,
              startTime: original.startTime,
              endTime: original.endTime,
              text: original.text,
              confidence: Math.min(match.confidence, 0.7), // Cap for fallback
              reason: match.reason || 'Semantic match'
            } : null;
          })
          .filter(Boolean)
          .slice(0, 5);
      } catch (e) {
        // Continue to keyword matching
      }
    }
  } catch (error) {
    console.error('Semantic fallback failed:', error);
  }
  
  return enhancedKeywordMatching(query, subtitles);
}

// Enhanced keyword matching with semantic understanding
function enhancedKeywordMatching(query: string, subtitles: SubtitleItem[]): SceneMatch[] {
  const queryLower = query.toLowerCase();
  
  // Expanded keyword categories for better scenario matching
  const scenarioKeywords = {
    // Emotional scenarios
    emotional: ['cry', 'tears', 'emotional', 'feelings', 'heart', 'love', 'hug', 'comfort', 'sorry', 'apologize', 'forgive'],
    romantic: ['love', 'romantic', 'kiss', 'marry', 'propose', 'relationship', 'together', 'forever', 'darling', 'sweetheart'],
    angry: ['angry', 'mad', 'furious', 'yell', 'shout', 'argument', 'fight', 'hate', 'stupid', 'idiot', 'bastard'],
    sad: ['sad', 'depressed', 'unhappy', 'misery', 'grief', 'loss', 'death', 'died', 'goodbye', 'leave'],
    happy: ['happy', 'joy', 'celebrate', 'party', 'congratulations', 'success', 'win', 'achievement', 'smile', 'laugh'],
    
    // Action scenarios
    action: ['fight', 'battle', 'attack', 'defend', 'escape', 'run', 'chase', 'shoot', 'kill', 'weapon', 'danger'],
    suspense: ['mystery', 'secret', 'hidden', 'discover', 'find', 'clue', 'investigate', 'suspect', 'truth'],
    
    // Situational contexts
    rain: ['rain', 'raining', 'storm', 'thunder', 'lightning', 'umbrella', 'wet', 'downpour'],
    night: ['night', 'dark', 'midnight', 'evening', 'moon', 'stars', 'sleep', 'bed'],
    party: ['party', 'celebrate', 'dance', 'music', 'drink', 'fun', 'enjoy', 'festival'],
    
    // Common scenarios
    confession: ['confess', 'admit', 'truth', 'secret', 'tell you', 'need to say', 'honest'],
    argument: ['argue', 'disagree', 'fight', 'conflict', 'problem', 'issue', 'wrong'],
    reunion: ['meet', 'see you', 'long time', 'missed', 'reunite', 'again', 'back'],
    goodbye: ['goodbye', 'farewell', 'leave', 'going', 'depart', 'see you', 'take care']
  };

  const matches: SceneMatch[] = [];
  
  // Score each subtitle based on semantic relevance
  for (const subtitle of subtitles.slice(0, 100)) { // Check first 100 for performance
    const subtitleLower = subtitle.text.toLowerCase();
    let matchScore = 0;
    let matchedCategories: string[] = [];
    
    // Check against all keyword categories
    Object.entries(scenarioKeywords).forEach(([category, keywords]) => {
      const categoryMatch = keywords.some(keyword => 
        subtitleLower.includes(keyword) || 
        queryLower.includes(category)
      );
      
      if (categoryMatch) {
        matchScore += 1;
        matchedCategories.push(category);
      }
    });
    
    // Additional scoring for direct keyword matches
    const directKeywords = queryLower.split(/\s+/).filter(word => word.length > 3);
    const directMatches = directKeywords.filter(keyword => 
      subtitleLower.includes(keyword)
    ).length;
    
    matchScore += directMatches * 0.5;
    
    // Calculate final confidence
    const confidence = Math.min(matchScore / 5, 0.8); // Cap at 0.8 for keyword matching
    
    if (confidence > 0.2 && (matchedCategories.length > 0 || directMatches > 0)) {
      matches.push({
        subtitleIndex: subtitle.index,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        text: subtitle.text,
        confidence: confidence,
        reason: matchedCategories.length > 0 
          ? `Matches categories: ${matchedCategories.join(', ')}`
          : `Contains relevant keywords`
      });
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

// Type guard for scene match validation
function isValidSceneMatch(match: any): match is SceneMatch {
  return (
    match &&
    typeof match.subtitleIndex === 'number' &&
    match.subtitleIndex > 0 &&
    typeof match.confidence === 'number' &&
    typeof match.reason === 'string' &&
    match.confidence >= 0 &&
    match.confidence <= 1
  );
}

// Helper function to format time for display
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Optional: GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Advanced Scene Search API is running',
    features: [
      'Semantic scenario understanding',
      'Emotional and contextual analysis',
      'Multi-level fallback matching',
      'Translated subtitle support'
    ],
    usage: 'POST /api/search-scenes with JSON body containing query, subtitles, video_duration, and target_language'
  });
}