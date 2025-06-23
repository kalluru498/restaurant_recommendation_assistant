// app/lib/openai.ts
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const createChatCompletion = async (messages: any[]) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    return response;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

// app/lib/reddit.ts
interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
}

interface RedditComment {
  body: string;
  score: number;
  created_utc: number;
}

export class RedditClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private clientId: string,
    private clientSecret: string
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RestaurantBot/1.0',
        },
        body: 'grant_type=client_credentials',
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
        
        if (!this.accessToken) {
          throw new Error('Access token is null or undefined');
        }
        return this.accessToken;
      }
      throw new Error('Failed to get access token');
    } catch (error) {
      console.error('Reddit auth error:', error);
      throw error;
    }
  }

  async searchPosts(query: string, subreddit: string = 'all', limit: number = 10): Promise<RedditPost[]> {
    try {
      const token = await this.getAccessToken();
      const searchQuery = encodeURIComponent(query);
      const url = `https://oauth.reddit.com/r/${subreddit}/search?q=${searchQuery}&limit=${limit}&sort=relevance&type=link`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'RestaurantBot/1.0',
        },
      });

      const data = await response.json();
      
      if (data.data && data.data.children) {
        return data.data.children.map((child: any) => ({
          title: child.data.title,
          selftext: child.data.selftext,
          score: child.data.score,
          num_comments: child.data.num_comments,
          url: `https://reddit.com${child.data.permalink}`,
          created_utc: child.data.created_utc,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Reddit search error:', error);
      return [];
    }
  }

  async getComments(postId: string, limit: number = 5): Promise<RedditComment[]> {
    try {
      const token = await this.getAccessToken();
      const url = `https://oauth.reddit.com/comments/${postId}?limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'RestaurantBot/1.0',
        },
      });

      const data = await response.json();
      
      if (data[1] && data[1].data && data[1].data.children) {
        return data[1].data.children
          .filter((child: any) => child.data.body && child.data.body !== '[deleted]')
          .map((child: any) => ({
            body: child.data.body,
            score: child.data.score,
            created_utc: child.data.created_utc,
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Reddit comments error:', error);
      return [];
    }
  }
}

export const redditClient = new RedditClient(
  process.env.REDDIT_CLIENT_ID || '',
  process.env.REDDIT_CLIENT_SECRET || ''
);

// app/lib/search.ts
interface SearchResult {
  title: string;
  url: string;
  description: string;
  published: string;
}

export class WebSearchClient {
  constructor(private apiKey: string) {}

  async search(query: string, count: number = 10): Promise<SearchResult[]> {
    if (!this.apiKey) {
      console.warn('No Brave Search API key provided, skipping web search');
      return [];
    }

    try {
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`, {
        headers: {
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.web && data.web.results) {
        return data.web.results.map((result: any) => ({
          title: result.title,
          url: result.url,
          description: result.description,
          published: result.published || new Date().toISOString(),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  async searchRestaurants(location: string, cuisine?: string, budget?: string): Promise<SearchResult[]> {
    let query = `best restaurants ${location}`;
    
    if (cuisine) {
      query += ` ${cuisine}`;
    }
    
    if (budget) {
      query += ` ${budget}`;
    }
    
    query += ' reviews 2024';
    
    return this.search(query, 8);
  }
}

export const webSearchClient = new WebSearchClient(
  process.env.BRAVE_SEARCH_API_KEY || ''
);

// app/lib/utils.ts
export const extractLocationFromMessage = (message: string): string | null => {
  // Simple regex patterns to extract location
  const locationPatterns = [
    /in\s+([A-Za-z\s]+),?\s*([A-Za-z]{2})?/i,
    /at\s+([A-Za-z\s]+),?\s*([A-Za-z]{2})?/i,
    /near\s+([A-Za-z\s]+),?\s*([A-Za-z]{2})?/i,
    /around\s+([A-Za-z\s]+),?\s*([A-Za-z]{2})?/i,
  ];

  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
};

export const extractCuisineFromMessage = (message: string): string | null => {
  const cuisines = [
    'italian', 'chinese', 'japanese', 'mexican', 'indian', 'thai', 'french',
    'mediterranean', 'american', 'korean', 'vietnamese', 'greek', 'spanish',
    'turkish', 'lebanese', 'moroccan', 'ethiopian', 'brazilian', 'peruvian',
    'sushi', 'pizza', 'burgers', 'steakhouse', 'seafood', 'bbq', 'vegan',
    'vegetarian', 'gluten-free'
  ];

  const lowerMessage = message.toLowerCase();
  
  for (const cuisine of cuisines) {
    if (lowerMessage.includes(cuisine)) {
      return cuisine;
    }
  }

  return null;
};

export const extractBudgetFromMessage = (message: string): string | null => {
  const budgetPatterns = [
    /under\s+\$?(\d+)/i,
    /less\s+than\s+\$?(\d+)/i,
    /below\s+\$?(\d+)/i,
    /\$?(\d+)\s+or\s+less/i,
    /(cheap|budget|affordable)/i,
    /(expensive|upscale|fine\s+dining)/i,
    /(mid-range|moderate)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = message.match(pattern);
    if (match) {
      if (match[1]) {
        return `under $${match[1]}`;
      } else {
        return match[1];
      }
    }
  }

  return null;
};

export const formatRedditData = (posts: any[]): string => {
  if (!posts.length) return '';

  const formatted = posts.slice(0, 5).map(post => {
    return `**${post.title}** (${post.score} upvotes, ${post.num_comments} comments)\n${post.selftext ? post.selftext.substring(0, 200) + '...' : 'No description'}`;
  }).join('\n\n');

  return `\n\n**Reddit Community Insights:**\n${formatted}`;
};

export const formatSearchResults = (results: any[]): string => {
  if (!results.length) return '';

  const formatted = results.slice(0, 5).map(result => {
    return `**${result.title}**\n${result.description.substring(0, 150)}...\n${result.url}`;
  }).join('\n\n');

  return `\n\n**Recent Reviews & Articles:**\n${formatted}`;
};