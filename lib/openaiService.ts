// lib/openaiService.ts - Crash-Resistant Version
import Constants from 'expo-constants';

export interface GenerateWordsRequest {
  topic: string;
  count: number;
}

export interface GenerateWordsResponse {
  words: string[];
  topic: string;
  success: boolean;
  error?: string;
}

// Fallback word lists for when AI fails
const FALLBACK_WORDS: Record<string, string[]> = {
  default: ['apple', 'house', 'car', 'tree', 'book', 'phone', 'chair', 'water'],
  animals: ['dog', 'cat', 'bird', 'fish', 'lion', 'tiger', 'bear', 'wolf'],
  food: ['pizza', 'burger', 'pasta', 'salad', 'cake', 'bread', 'soup', 'rice'],
  sports: ['soccer', 'tennis', 'golf', 'swim', 'run', 'jump', 'climb', 'bike'],
  colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black']
};

// Get fallback words based on topic
const getFallbackWords = (topic: string, count: number): string[] => {
  const topicLower = topic.toLowerCase();
  let words: string[] = [];
  
  // Try to match topic to a category
  if (topicLower.includes('animal') || topicLower.includes('pet')) {
    words = FALLBACK_WORDS.animals;
  } else if (topicLower.includes('food') || topicLower.includes('eat') || topicLower.includes('drink')) {
    words = FALLBACK_WORDS.food;
  } else if (topicLower.includes('sport') || topicLower.includes('game') || topicLower.includes('play')) {
    words = FALLBACK_WORDS.sports;
  } else if (topicLower.includes('color') || topicLower.includes('colour')) {
    words = FALLBACK_WORDS.colors;
  } else {
    words = FALLBACK_WORDS.default;
  }
  
  // Shuffle and return requested count
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Validate and sanitize environment variables
const getOpenAIKey = (): string | null => {
  try {
    // Try multiple ways to get the API key
    const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
                Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY ||
                Constants.manifest?.extra?.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!key || typeof key !== 'string') {
      console.warn('OpenAI API key not found in environment variables');
      return null;
    }
    
    // Basic validation
    if (key.length < 10 || !key.startsWith('sk-')) {
      console.warn('OpenAI API key appears to be invalid format');
      return null;
    }
    
    return key.trim();
  } catch (error) {
    console.error('Error accessing OpenAI API key:', error);
    return null;
  }
};

// Network timeout wrapper
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

// Validate request parameters
const validateRequest = (request: GenerateWordsRequest): void => {
  if (!request || typeof request !== 'object') {
    throw new Error('Invalid request object');
  }
  
  if (!request.topic || typeof request.topic !== 'string') {
    throw new Error('Topic must be a non-empty string');
  }
  
  if (request.topic.trim().length === 0) {
    throw new Error('Topic cannot be empty');
  }
  
  if (request.topic.length > 100) {
    throw new Error('Topic is too long (max 100 characters)');
  }
  
  if (!Number.isInteger(request.count) || request.count < 1 || request.count > 20) {
    throw new Error('Count must be an integer between 1 and 20');
  }
};

// Parse and validate OpenAI response
const parseOpenAIResponse = (content: string, expectedCount: number): string[] => {
  if (!content || typeof content !== 'string') {
    throw new Error('Empty response from OpenAI');
  }
  
  let words: any;
  try {
    words = JSON.parse(content.trim());
  } catch (parseError) {
    // Try to extract JSON from text that might have extra content
    const jsonMatch = content.match(/\[.*\]/);
    if (jsonMatch) {
      try {
        words = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Could not parse JSON from response');
      }
    } else {
      throw new Error('Response is not valid JSON');
    }
  }
  
  // Validate response structure
  if (!Array.isArray(words)) {
    throw new Error('Response is not an array');
  }
  
  if (words.length === 0) {
    throw new Error('Response array is empty');
  }
  
  // Validate and clean each word
  const validWords: string[] = [];
  for (const word of words) {
    if (typeof word === 'string' && word.trim().length > 0) {
      const cleanWord = word.trim();
      if (cleanWord.length <= 50) { // Reasonable word length limit
        validWords.push(cleanWord);
      }
    }
  }
  
  if (validWords.length === 0) {
    throw new Error('No valid words found in response');
  }
  
  // Ensure we have at least the minimum needed
  if (validWords.length < Math.min(expectedCount, 3)) {
    throw new Error('Not enough valid words generated');
  }
  
  return validWords.slice(0, expectedCount);
};

export const generateWordsWithAI = async (request: GenerateWordsRequest): Promise<GenerateWordsResponse> => {
  const startTime = Date.now();
  
  try {
    // Validate input
    validateRequest(request);
    
    const { topic, count } = request;
    const trimmedTopic = topic.trim();
    
    // Check if OpenAI is available
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      console.warn('OpenAI API not available, using fallback words');
      return {
        words: getFallbackWords(trimmedTopic, count),
        topic: trimmedTopic,
        success: true,
        error: 'Used offline mode - OpenAI API not configured'
      };
    }
    
    // Construct the prompt
    const prompt = `Generate exactly ${count} words/terms related to "${trimmedTopic}" that would work well in a party game where players need to guess a secret word.

Rules:
- Words should be specific nouns, names, or short phrases (2-3 words max)
- Words should be well-known and recognizable
- Avoid overly obscure or technical terms
- Make words distinct from each other but have the same relationship to the topic
- Return ONLY a JSON array of strings, no other text

Example format: ["word1", "word2", "word3"]

Topic: ${trimmedTopic}
Count: ${count}`;

    // Prepare request payload
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates words for party games. Always respond with valid JSON arrays only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(500, count * 20), // Reasonable token limit
      temperature: 0.7,
    };
    
    // Make API request with timeout
    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    }, 15000); // 15 second timeout
    
    // Check response status
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else if (response.status >= 500) {
        throw new Error('OpenAI API server error');
      } else {
        throw new Error(`OpenAI API error: ${response.status} ${statusText}`);
      }
    }
    
    // Parse response
    let data: any;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Invalid JSON response from OpenAI API');
    }
    
    // Validate response structure
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('Invalid response structure from OpenAI API');
    }
    
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }
    
    // Parse and validate the words
    const words = parseOpenAIResponse(content, count);
    
    const endTime = Date.now();
    console.log(`OpenAI request completed in ${endTime - startTime}ms`);
    
    return {
      words,
      topic: trimmedTopic,
      success: true,
    };
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`OpenAI request failed after ${endTime - startTime}ms:`, error);
    
    // Return fallback words instead of failing completely
    const fallbackWords = getFallbackWords(request.topic || 'general', request.count || 8);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      words: fallbackWords,
      topic: request.topic || 'general',
      success: false,
      error: `AI generation failed: ${errorMessage}. Using fallback words.`,
    };
  }
};