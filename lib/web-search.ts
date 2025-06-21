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
  }

  async search(query: string, count: number = 10): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('BRAVE_SEARCH_API_KEY not found in environment variables');
    }

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': this.apiKey
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brave Search API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: BraveSearchResponse = await response.json();

      if (!data.web?.results || data.web.results.length === 0) {
        return [];
      }

      return data.web.results.map(result => ({
        title: result.title,
        url: result.url,
        description: result.description,
        published: result.published,
        favicon: result.profile?.img
      }));

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Search request failed: ${error.message}`);
      }
      throw new Error('Search request failed with unknown error');
    }
  }
}

// Export a singleton instance
export const webSearchClient = new WebSearchClient();

// Export the search function for the chat route
export async function searchWeb(query: string, focus?: string): Promise<{
  results: SearchResult[];
  sources: string[];
}> {
  const results = await webSearchClient.search(query);
  const sources = results.map(result => result.url);
  
  return {
    results,
    sources
  };
}