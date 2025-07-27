// lib/openaiService.ts
export interface GenerateWordsRequest {
    topic: string;
    count: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }
  
  export interface GenerateWordsResponse {
    words: string[];
    topic: string;
    success: boolean;
    error?: string;
  }
  
  export const generateWordsWithAI = async (request: GenerateWordsRequest): Promise<GenerateWordsResponse> => {
    try {
      const { topic, count, difficulty = 'medium' } = request;
      
      // Construct the prompt for better game-suitable words
      const prompt = `Generate exactly ${count} words/terms related to "${topic}" that would work well in a party game where players need to guess a secret word. 
  
  Rules:
  - Words should be specific nouns, names, or short phrases (2-3 words max)
  - Words should be well-known and recognizable
  - Avoid overly obscure or technical terms
  - Make words distinct from each other but clearly related to the topic
  - Difficulty level: ${difficulty}
  - Return ONLY a JSON array of strings, no other text
  
  Example format: ["word1", "word2", "word3"]
  
  Topic: ${topic}
  Count: ${count}`;
  
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
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
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
  
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }
  
      // Parse the JSON response
      let words: string[];
      try {
        words = JSON.parse(content);
        
        // Validate that we got an array of strings
        if (!Array.isArray(words) || !words.every(word => typeof word === 'string')) {
          throw new Error('Invalid response format');
        }
        
        // Ensure we have the right number of words
        if (words.length !== count) {
          words = words.slice(0, count); // Take only what we need
          if (words.length < count) {
            throw new Error('Not enough words generated');
          }
        }
        
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Failed to parse AI response');
      }
  
      return {
        words,
        topic,
        success: true,
      };
  
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        words: [],
        topic: request.topic,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  };