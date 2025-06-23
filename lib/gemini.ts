// lib/gemini.ts
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GeminiResponse {
  message: string;
  needsTools: boolean;
  toolQueries: Array<{
    type: 'search_reddit' | 'search_web';
    query: string;
    subreddit?: string; // Optional subreddit specification
  }>;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export class GeminiService {
  private apiKey: string;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  private getSystemPrompt(): string {
    return `  You are a helpful restaurant recommendation assistant. You have access to two powerful tools:

      1. search_reddit: Use this to find authentic user reviews and discussions about restaurants from Reddit communities
      2. search_web: Use this to search for professional reviews, restaurant information, menus, and general recommendations
      
      IMPORTANT: If a user asks about anything outside restaurants or food (e.g., car service, flights, plumbing), politely refuse and respond:
      "I am specialized in restaurant recommendations and food-related assistance. Please ask me about restaurants, cuisines, dishes, or dining options."
      
      Guidelines:
      - Always use at least one tool to provide informed recommendations
      - Combine information from multiple sources when possible
      - For specific restaurant questions, search for that restaurant name
      - For area-based questions (e.g., "best pizza in Brooklyn"), search for the cuisine + location
      - Include price information when available
      - Mention atmosphere, service quality, and must-try dishes
      - Be honest about limitations if information is incomplete
      - Always cite your sources clearly
      - If you can't find recent information, mention this limitation

      Focus on providing helpful, accurate restaurant recommendations based on real user experiences and professional reviews
      If you need to search for information, respond with: "SEARCH_NEEDED" followed by your search queries in this format:
      SEARCH_NEEDED
      REDDIT:[restaurant name location]:[subreddit] (optional subreddit)
      WEB:[restaurant name location reviews]

      Examples:
      SEARCH_NEEDED
      REDDIT:Four Charles Prime Rib Philadelphia:philadelphia
      WEB:Four Charles Prime Rib Philadelphia reviews menu prices 2024
      SEARCH_NEEDED
      REDDIT:Four Charles:FoodNYC
      REDDIT:4 Charles:FoodNYC
      REDDIT:Four Charles Prime Rib:nyc
      WEB:Four Charles Prime Rib NYC reviews menu 2024

      Otherwise, provide a direct response.`;
   }

  private async makeGeminiRequest(prompt: string): Promise<string> {
    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateResponse(messages: ChatMessage[]): Promise<GeminiResponse> {
    const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const fullPrompt = `${this.getSystemPrompt()}\n\nConversation:\n${conversationText}\n\nAssistant:`;

    const responseText = await this.makeGeminiRequest(fullPrompt);

    // Check if search is needed
    if (responseText.includes('SEARCH_NEEDED')) {
      const lines = responseText.split('\n');
      const toolQueries = [];
      
      for (const line of lines) {
        if (line.startsWith('REDDIT:')) {
          const content = line.replace('REDDIT:', '').trim();
          const [query, subreddit] = content.split(':');
          toolQueries.push({
            type: 'search_reddit' as const,
            query: query.trim(),
            subreddit: subreddit?.trim()
          });
        } else if (line.startsWith('WEB:')) {
          toolQueries.push({
            type: 'search_web' as const,
            query: line.replace('WEB:', '').trim()
          });
        }
      }

      return {
        message: responseText,
        needsTools: true,
        toolQueries
      };
    }

    return {
      message: responseText,
      needsTools: false,
      toolQueries: []
    };
  }

  async generateWithToolResults(messages: ChatMessage[], toolResults: any[]): Promise<string> {
    const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    // Format tool results more cleanly
    const formatToolResults = (results: any[]) => {
      return results.map(result => {
        if (result.type === 'reddit') {
          return `Reddit Posts:\n${result.data.map((post: any) => 
            `- ${post.title} (${post.score} upvotes, ${post.num_comments} comments)\n  ${post.selftext ? post.selftext.substring(0, 200) + '...' : 'No description'}`
          ).join('\n')}`;
        } else if (result.type === 'web') {
          return `Web Results:\n${result.data.map((item: any) => 
            `- ${item.title}\n  ${item.description.substring(0, 150)}...\n  ${item.url}`
          ).join('\n')}`;
        }
        return JSON.stringify(result);
      }).join('\n\n');
    };

    const toolResultsText = formatToolResults(toolResults);

    const fullPrompt = `Based on the conversation and search results below, provide a helpful restaurant recommendation response.

Conversation:
${conversationText}

Search Results:
${toolResultsText}

Instructions:
- Provide specific recommendations based on the search results
- Include prices when available in the results
- Mention atmosphere, service quality, and must-try dishes if found
- Cite your sources (mention if from Reddit or web reviews)
- If no good results found, acknowledge this and provide general advice
- Keep response comprehensive but concise

Response:`;

    return await this.makeGeminiRequest(fullPrompt);
  }

  // Helper method to validate if a query is restaurant-related
  private isRestaurantQuery(query: string): boolean {
    const restaurantKeywords = [
      'restaurant', 'food', 'eat', 'dining', 'menu', 'cuisine', 'dish', 'meal',
      'breakfast', 'lunch', 'dinner', 'cafe', 'bar', 'pizza', 'sushi', 'burger',
      'order', 'delivery', 'takeout', 'reservation', 'chef', 'cooking', 'all'
    ];
    
    const lowerQuery = query.toLowerCase();
    return restaurantKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  // Method to handle non-restaurant queries
  async handleNonRestaurantQuery(): Promise<string> {
    return "I am specialized in restaurant recommendations and food-related assistance. Please ask me about restaurants, cuisines, dishes, or dining options.";
  }
}