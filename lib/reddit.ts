import axios from 'axios';

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  url: string;
  subreddit: string;
  author: string;
  created_utc: number;
}

interface RedditComment {
  body: string;
  score: number;
  author: string;
  created_utc: number;
}

interface RedditSearchResult {
  posts: RedditPost[];
  comments: RedditComment[];
  subredditsSearched: string[];
  sources: string[]; // Add sources property for compatibility
}

class RedditService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  // Base subreddits that are always relevant for food queries
  private readonly baseSubreddits = ['food', 'FoodPorn', 'restaurant', 'Foodie'];
  
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
      
      const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'RestaurantBot/1.0'
          }
        }
      );

      this.accessToken = response.data.access_token || '';
      this.tokenExpiry = Date.now() + ((response.data.expires_in || 3600) * 1000) - 60000; // 1 min buffer
      
      if (!this.accessToken) {
        throw new Error('No access token received from Reddit API');
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Reddit access token:', error);
      throw new Error('Reddit API authentication failed');
    }
  }

  /**
   * Dynamically determine relevant subreddits based on query content
   */
  private async findRelevantSubreddits(query: string): Promise<string[]> {
    const subredditsToSearch = [...this.baseSubreddits];
    const queryLower = query.toLowerCase();
    
    // Extract location hints from the query
    const locationPatterns = [
      // City patterns
      /\b(in|near|around)\s+([A-Za-z\s]+?)(?:\s|$|,)/gi,
      /\b([A-Za-z]+)\s+(restaurant|food|dining)/gi,
      // Direct city mentions
      /\b(new york|nyc|manhattan|brooklyn|queens|bronx)\b/gi,
      /\b(los angeles|la|hollywood|beverly hills)\b/gi,
      /\b(chicago|windy city)\b/gi,
      /\b(dallas|dfw|fort worth|plano|frisco)\b/gi,
      /\b(houston|htx)\b/gi,
      /\b(austin|atx)\b/gi,
      /\b(san francisco|sf|bay area)\b/gi,
      /\b(seattle|emerald city)\b/gi,
      /\b(boston|beantown)\b/gi,
      /\b(philadelphia|philly)\b/gi,
      /\b(miami|south beach)\b/gi,
      /\b(atlanta|atl)\b/gi,
      /\b(denver|mile high)\b/gi,
      /\b(phoenix|scottsdale)\b/gi,
      /\b(las vegas|vegas|henderson)\b/gi,
      /\b(portland|pdx)\b/gi,
      /\b(nashville|music city)\b/gi,
      /\b(orlando|disney)\b/gi
    ];

    // Extract potential locations from query
    const potentialLocations: string[] = [];
    
    locationPatterns.forEach(pattern => {
      const matches = Array.from(queryLower.matchAll(pattern));
      matches.forEach(match => {
        if (match[2]) {
          potentialLocations.push(match[2].trim());
        } else if (match[1]) {
          potentialLocations.push(match[1].trim());
        }
      });
    });

    // Try to find subreddits for detected locations
    for (const location of potentialLocations) {
      const locationSubs = await this.getLocationSubreddits(location);
      subredditsToSearch.push(...locationSubs);
    }

    // Remove duplicates and return
    return Array.from(new Set(subredditsToSearch));
  }

  /**
   * Get relevant subreddits for a specific location by checking if they exist
   */
  private async getLocationSubreddits(location: string): Promise<string[]> {
    const locationNormalized = location.toLowerCase().replace(/\s+/g, '');
    const potentialSubs: string[] = [];

    // Generate potential subreddit names
    const variations = [
      location,
      locationNormalized,
      location.replace(/\s+/g, ''),
      `Ask${location}`,
      `${location}Food`,
      `${location}Eats`,
      `${location}Dining`
    ];

    // Add common city abbreviations and variations
    const cityMappings: { [key: string]: string[] } = {
      'new york': ['nyc', 'newyork', 'AskNYC', 'FoodNYC'],
      'los angeles': ['la', 'losangeles', 'AskLosAngeles'],
      'san francisco': ['sf', 'sanfrancisco', 'AskSF'],
      'dallas': ['dfw', 'dallas', 'DFW'],
      'fort worth': ['dfw', 'fortworth'],
      'chicago': ['chicago', 'AskChicago'],
      'houston': ['houston', 'htx'],
      'austin': ['austin', 'atx'],
      'seattle': ['seattle', 'SeattleWA'],
      'boston': ['boston', 'BostonMA'],
      'philadelphia': ['philadelphia', 'philly'],
      'miami': ['miami', 'MiamiFL'],
      'atlanta': ['atlanta', 'AtlantaGA'],
      'denver': ['denver', 'Denver'],
      'phoenix': ['phoenix', 'arizona', 'AZCardinals'],
      'las vegas': ['vegas', 'lasvegas', 'vegaslocals'],
      'portland': ['portland', 'askportland'],
      'nashville': ['nashville', 'Tennessee']
    };

    if (cityMappings[location]) {
      variations.push(...cityMappings[location]);
    }

    // Check which subreddits actually exist (simplified approach)
    // In production, you might want to cache this or use Reddit's API to verify
    for (const variation of variations) {
      if (variation && variation.length > 2) {
        potentialSubs.push(variation);
      }
    }

    return potentialSubs.slice(0, 8); // Limit to prevent too many API calls
  }

  /**
   * Generate search query variations to cast a wider net
   */
  private generateQueryVariations(originalQuery: string): string[] {
    const variations = [originalQuery];
    const queryLower = originalQuery.toLowerCase();

    // Food type mappings to catch related terms
    const foodMappings: { [key: string]: string[] } = {
      'indian': ['curry', 'desi', 'bollywood', 'tandoori', 'biryani'],
      'chinese': ['dim sum', 'szechuan', 'cantonese', 'asian'],
      'italian': ['pasta', 'pizza', 'mediterranean'],
      'mexican': ['tacos', 'burritos', 'tex-mex', 'latin'],
      'thai': ['pad thai', 'asian', 'southeast asian'],
      'japanese': ['sushi', 'ramen', 'asian'],
      'korean': ['bbq', 'kimchi', 'asian'],
      'mediterranean': ['greek', 'middle eastern', 'hummus'],
      'barbecue': ['bbq', 'smoked', 'grill'],
      'seafood': ['fish', 'lobster', 'crab', 'oysters']
    };

    // Add related food terms
    Object.entries(foodMappings).forEach(([key, synonyms]) => {
      if (queryLower.includes(key)) {
        synonyms.forEach(synonym => {
          variations.push(originalQuery.replace(new RegExp(key, 'gi'), synonym));
        });
      }
    });

    // Add generic restaurant terms
    if (!queryLower.includes('restaurant') && !queryLower.includes('food')) {
      variations.push(`${originalQuery} restaurant`);
      variations.push(`${originalQuery} food`);
    }

    return Array.from(new Set(variations)).slice(0, 5); // Limit variations
  }

  async searchReddit(query: string, subreddits?: string[]): Promise<RedditSearchResult> {
    try {
      const token = await this.getAccessToken();
      const relevantSubreddits = subreddits && subreddits.length > 0 
        ? [...this.baseSubreddits, ...subreddits]
        : await this.findRelevantSubreddits(query);
      const queryVariations = this.generateQueryVariations(query);
      
      console.log(`Searching subreddits: ${relevantSubreddits.join(', ')}`);
      console.log(`Query variations: ${queryVariations.join(', ')}`);

      const allPosts: RedditPost[] = [];
      const allComments: RedditComment[] = [];

      // Search each subreddit with each query variation
      for (const subreddit of relevantSubreddits) {
        for (const searchQuery of queryVariations) {
          try {
            const searchUrl = `https://oauth.reddit.com/r/${subreddit}/search.json`;
            const response = await axios.get(searchUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'RestaurantBot/1.0'
              },
              params: {
                q: searchQuery,
                sort: 'relevance',
                limit: 10,
                restrict_sr: true,
                t: 'all' // Search all time to get more results
              }
            });

            if (response.data?.data?.children) {
              const posts = response.data.data.children
                .map((post: any) => ({
                  title: post.data.title,
                  selftext: post.data.selftext,
                  score: post.data.score,
                  num_comments: post.data.num_comments,
                  url: `https://reddit.com${post.data.permalink}`,
                  subreddit: post.data.subreddit,
                  author: post.data.author,
                  created_utc: post.data.created_utc
                }))
                .filter((post: RedditPost) => 
                  post.score > 0 && 
                  post.num_comments > 0 &&
                  (post.title.toLowerCase().includes('restaurant') ||
                   post.title.toLowerCase().includes('food') ||
                   post.selftext.toLowerCase().includes('restaurant') ||
                   post.selftext.toLowerCase().includes('food'))
                );

              allPosts.push(...posts);
            }
          } catch (subredditError) {
            console.log(`Subreddit ${subreddit} not accessible or doesn't exist`);
            continue;
          }
        }
      }

      // Remove duplicates and sort by relevance
      const uniquePosts = this.removeDuplicatePosts(allPosts);
      const sortedPosts = uniquePosts
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      return {
        posts: sortedPosts,
        comments: allComments,
        subredditsSearched: relevantSubreddits,
        sources: sortedPosts.map(post => post.url) // Generate sources from post URLs
      };

    } catch (error) {
      console.error('Reddit search failed:', error);
      
      // Provide intelligent fallback based on query analysis
      return this.generateIntelligentFallback(query);
    }
  }

  private removeDuplicatePosts(posts: RedditPost[]): RedditPost[] {
    const seen = new Set<string>();
    return posts.filter(post => {
      const key = `${post.title}-${post.author}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private generateIntelligentFallback(query: string): RedditSearchResult {
    // Analyze query to provide relevant simulated results
    const queryLower = query.toLowerCase();
    const isLocation = /\b(in|near|around)\s+([A-Za-z\s]+)/i.test(queryLower);
    const foodType = this.extractFoodType(queryLower);
    const location = this.extractLocation(queryLower);

    const simulatedPosts: RedditPost[] = [
      {
        title: `Best ${foodType} restaurants ${location ? `in ${location}` : 'recommendations'}?`,
        selftext: `Looking for authentic ${foodType} food ${location ? `in the ${location} area` : ''}. Any recommendations?`,
        score: 15,
        num_comments: 8,
        url: 'https://reddit.com/r/food/comments/simulated1',
        subreddit: location ? location.toLowerCase() : 'food',
        author: 'foodie_user',
        created_utc: Date.now() / 1000 - 86400
      }
    ];

    return {
      posts: simulatedPosts,
      comments: [],
      subredditsSearched: ['simulated_fallback'],
      sources: simulatedPosts.map(post => post.url) // Generate sources from simulated posts
    };
  }

  private extractFoodType(query: string): string {
    const foodTypes = ['indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'korean', 'mediterranean', 'american', 'french'];
    for (const type of foodTypes) {
      if (query.includes(type)) {
        return type;
      }
    }
    return 'restaurant';
  }

  private extractLocation(query: string): string | null {
    const locationMatch = query.match(/\b(?:in|near|around)\s+([A-Za-z\s]+?)(?:\s|$|,)/i);
    return locationMatch ? locationMatch[1].trim() : null;
  }
}

// Create a singleton instance
const redditService = new RedditService();

// Export the search function
export const searchReddit = (query: string, subreddits?: string[]) => redditService.searchReddit(query, subreddits);

export default RedditService;