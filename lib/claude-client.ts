import Anthropic from '@anthropic-ai/sdk';
import { InsightsPayload, InsightsResponse } from '@/types';
import { 
  createSecureSystemPrompt, 
  validateClaudeResponse
} from './security';

/**
 * Generate AI insights using Claude API.
 * 
 * **API Integration Strategy:**
 * - Server-side only (API key never exposed to client)
 * - 30 second timeout to prevent hanging requests
 * - 1 retry with exponential backoff for transient failures
 * - Structured JSON output for consistent parsing
 * 
 * **Error Handling:**
 * - Rate limits: No retry, return clear error
 * - Authentication: No retry, return clear error
 * - Timeouts: Retry once with backoff
 * - Network errors: Retry once with backoff
 * 
 * **SECURITY NOTES:**
 * - API key is read from environment variable (never logged or exposed)
 * - All calls are server-side only via Next.js API routes
 * - Response is validated and parsed as JSON only (never executed or rendered as HTML)
 * - Prompt uses structured format to reduce prompt injection risk
 * 
 * **SECURITY GAPS (TODO for production):**
 * - No explicit secret sanitization in error logs
 * - No rate limiting at this layer (should be added at API route level)
 * - Prompt injection defense relies on structured output format only
 * 
 * @param payload - Compact insights payload with statistical summary
 * @returns Structured insights response
 * @throws Error if API call fails after retries
 */
export async function generateInsights(
  payload: InsightsPayload
): Promise<InsightsResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  const client = new Anthropic({
    apiKey,
  });
  
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  
  // Build the prompt
  const prompt = buildPrompt(payload);
  
  // Attempt with retry logic
  let lastError: Error | null = null;
  const maxRetries = 1;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Set timeout using AbortController
      // This prevents requests from hanging indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
      
      const response = await client.messages.create(
        {
          model,
          max_tokens: 2048,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      // Parse the response
      const content = response.content[0];
      
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }
      
      const insights = parseInsightsResponse(content.text);
      return insights;
      
    } catch (error) {
      lastError = error as Error;
      
      // Handle abort/timeout errors
      if (lastError.name === 'AbortError') {
        lastError = new Error('Request aborted: The AI service request timed out after 30 seconds');
      }
      
      // Handle rate limiting
      if (lastError.message.includes('429') || lastError.message.includes('rate_limit')) {
        // Don't retry on rate limits
        throw new Error('AI service rate limit exceeded. Please try again later.');
      }
      
      // Handle authentication errors
      if (lastError.message.includes('401') || lastError.message.includes('authentication')) {
        // Don't retry on auth errors
        throw new Error('AI service authentication failed. Please check API key configuration.');
      }
      
      // If this is not the last attempt, wait before retrying (exponential backoff)
      // Exponential backoff: 1s, 2s, 4s... reduces load on API during issues
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        console.log(`Retry attempt ${attempt + 1} after ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  // All retries failed
  throw new Error(
    `Failed to generate insights after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Build the prompt for Claude API.
 * 
 * **Prompt Design:**
 * - Uses secure system prompt to resist injection attacks
 * - Provides clear role context (data analyst)
 * - Includes structured data summary
 * - Specifies exact JSON output format
 * - Gives guidelines for each section
 * - Requests JSON only (no markdown wrapper)
 * 
 * The prompt is designed to produce consistent, structured output that
 * can be reliably parsed and displayed in the UI.
 * 
 * **SECURITY:**
 * - Uses strong system prompt that explicitly ignores embedded instructions
 * - Data payload contains only aggregated statistics (no raw keywords/URLs)
 * - Strict JSON schema reduces prompt injection risk
 * - Response is validated before being returned to client
 * 
 * For production use, consider:
 * - Using Claude's system prompt feature for stronger separation
 * - Adding explicit content filtering
 * - Validating output against a strict JSON schema library
 */
function buildPrompt(payload: InsightsPayload): string {
  const systemPrompt = createSecureSystemPrompt();
  
  return `${systemPrompt}

Data Summary:
${JSON.stringify(payload, null, 2)}

Provide your analysis in the following JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "anomalies": [
    {
      "date": "YYYY-MM-DD",
      "metric": "clicks|impressions|ctr|position",
      "change": "description of change",
      "explanation": "why this is notable"
    }
  ],
  "opportunities": ["opportunity 1", "opportunity 2", ...],
  "questions": ["question 1", "question 2", ...]
}

Guidelines:
- insights: 3-5 high-level observations about trends and patterns
- anomalies: Days with unusual activity (use zScore > 2 as guide)
- opportunities: 2-4 actionable recommendations
- questions: 2-3 questions to investigate further

Respond with ONLY valid JSON, no markdown or explanation.`;
}

/**
 * Parse and validate the insights response from Claude.
 * 
 * **Defensive Parsing:**
 * Claude sometimes wraps JSON in markdown code blocks (```json...```).
 * This function strips those wrappers before parsing.
 * 
 * It also validates the structure to ensure all required fields are present
 * and have the correct types, preventing runtime errors in the UI.
 * 
 * **SECURITY:**
 * - Response is parsed as JSON only (never executed as code)
 * - Strict validation against expected schema
 * - Length limits on all string fields (prevent XSS and excessive output)
 * - Array length limits (prevent DoS via large responses)
 * - All strings should be escaped by React before rendering
 * 
 * For production use, consider:
 * - Using a JSON schema validator library (e.g., Zod, Ajv)
 * - Explicit HTML sanitization before rendering
 * - Content Security Policy headers
 */
function parseInsightsResponse(text: string): InsightsResponse {
  try {
    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate structure using security utility
    const validationError = validateClaudeResponse(parsed);
    if (validationError) {
      throw new Error(`Invalid response structure: ${validationError}`);
    }
    
    return parsed as InsightsResponse;
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse Claude response as JSON: ${error.message}`);
    }
    throw error;
  }
}
