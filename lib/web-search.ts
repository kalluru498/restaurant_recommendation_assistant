// app/lib/web-search.ts
interface SearchResult {
  title: string;
  url: string;
  description: string;
  published?: string;
  favicon?: string;
}

interface BraveSearchResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      published?: string;
      profile?: {
        img?: string;
      };
    }>;
  };
}

export class WebSearchClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY || '';
    
    // Enhanced debugging
    console.log('🔍 WebSearchClient initialized');
    console.log('🔑 API key status:', this.apiKey ? 'SET' : 'NOT SET');
    console.log('🔑 API key length:', this.apiKey.length);
    console.log('🔑 API key preview:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NONE');
    console.log('🌍 Environment:', process.env.NODE_ENV);
  }

  async search(query: string, count: number = 10): Promise<SearchResult[]> {
    console.log(`🔍 Search called with query: "${query}", count: ${count}`);
    
    if (!this.apiKey) {
      console.error('❌ BRAVE_SEARCH_API_KEY not found in environment variables');
      console.log('📝 Available env vars:', Object.keys(process.env).filter(key => key.includes('BRAVE')));
      return this.getSimulatedResults(query);
    }

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    console.log('🌐 Request URL:', url);

    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': this.apiKey
    };
    console.log('📤 Request headers:', { ...headers, 'X-Subscription-Token': `${this.apiKey.substring(0, 8)}...` });

    try {
      console.log('⏳ Making API request...');
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
        
        // Check for common error codes
        if (response.status === 401) {
          console.error('🔐 Authentication failed - check your API key');
        } else if (response.status === 429) {
          console.error('⏰ Rate limit exceeded');
        } else if (response.status === 403) {
          console.error('🚫 Access forbidden - check API key permissions');
        }
        
        return this.getSimulatedResults(query);
      }

      const data: BraveSearchResponse = await response.json();
      console.log('📊 API Response structure:', {
        hasWeb: !!data.web,
        resultsCount: data.web?.results?.length || 0,
        firstResultTitle: data.web?.results?.[0]?.title || 'N/A'
      });

      if (!data.web?.results || data.web.results.length === 0) {
        console.warn('⚠️ No results found in API response');
        return this.getSimulatedResults(query);
      }

      const results = data.web.results.map(result => ({
        title: result.title,
        url: result.url,
        description: result.description,
        published: result.published,
        favicon: result.profile?.img
      }));

      console.log('✅ Successfully processed', results.length, 'search results');
      return results;

    } catch (error) {
      console.error('💥 Search request failed:', error);
      console.error('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return this.getSimulatedResults(query);
    }
  }

  private getSimulatedResults(query: string): SearchResult[] {
    console.log('🎭 Returning simulated results for query:', query);
    
    const simulatedResults: SearchResult[] = [
      {
        title: `Search results for "${query}" - Restaurant recommendations`,
        url: 'https://example.com/restaurants',
        description: `Find the best restaurants for ${query}. This is a simulated result - your Brave Search API is not working.`,
        published: new Date().toISOString()
      },
      {
        title: `Top ${query} restaurants near you`,
        url: 'https://example.com/local-restaurants',
        description: `Discover highly rated restaurants serving ${query}. API debugging in progress.`,
        published: new Date().toISOString()
      }
    ];

    return simulatedResults;
  }
}

// Export a singleton instance
export const webSearchClient = new WebSearchClient();

// Export the search function that your chat route expects
export async function searchWeb(query: string, focus?: string): Promise<{
  results: SearchResult[];
  sources: string[];
}> {
  console.log(`🔍 searchWeb called with query: "${query}", focus: "${focus}"`);
  
  const results = await webSearchClient.search(query, 10);
  
  // Extract sources from results
  const sources = results.map(result => result.url);
  
  return {
    results,
    sources
  };
}