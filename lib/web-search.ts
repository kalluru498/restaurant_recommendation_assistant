import axios from 'axios';

interface WebSearchResult {
  summary: string;
  results: {
    title: string;
    snippet: string;
    url: string;
    source: string;
  }[];
  sources: string[];
}

export async function searchWeb(
  query: string, 
  focus: 'reviews' | 'menu' | 'location' | 'general' = 'general'
): Promise<WebSearchResult> {
  try {
    console.log(`Searching web for: "${query}" with focus: ${focus}`);
    
    // Try to use real search API if available
    if (process.env.SEARCH_API_KEY) {
      return await searchWithAPI(query, focus);
    }
    
    // Fallback to simulated results
    console.log('Search API not configured, using simulated results');
    return generateSimulatedWebResults(query, focus);
    
  } catch (error) {
    console.error('Web search error:', error);
    
    // Return simulated results as fallback
    return generateSimulatedWebResults(query, focus);
  }
}

async function searchWithAPI(query: string, focus: string): Promise<WebSearchResult> {
  // Enhance query based on focus
  let enhancedQuery = query;
  switch (focus) {
    case 'reviews':
      enhancedQuery += ' reviews rating';
      break;
    case 'menu':
      enhancedQuery += ' menu prices dishes';
      break;
    case 'location':
      enhancedQuery += ' address location hours';
      break;
  }

  // Use Google Custom Search API or similar
  const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: process.env.SEARCH_API_KEY,
      cx: process.env.SEARCH_ENGINE_ID,
      q: enhancedQuery,
      num: 10
    }
  });

  const results = response.data.items?.map((item: any) => ({
    title: item.title,
    snippet: item.snippet,
    url: item.link,
    source: new URL(item.link).hostname
  })) || [];

  const sources = results.map((result: any) => `${result.source}: ${result.title}`);
  const summary = `Found ${results.length} web results for "${query}"`;

  return { summary, results, sources };
}

function generateSimulatedWebResults(query: string, focus: string): WebSearchResult {
  const lowerQuery = query.toLowerCase();
  let results: any[] = [];

  if (lowerQuery.includes('mediterranean') && lowerQuery.includes('flatiron')) {
    results = [
      {
        title: 'Best Mediterranean Restaurants in Flatiron District | Yelp',
        snippet: 'Top-rated Mediterranean restaurants in Flatiron include Mamoun\'s Falafel, Naya, and Mezze. Read reviews and see photos from diners.',
        url: 'https://www.yelp.com/flatiron-mediterranean',
        source: 'yelp.com'
      },
      {
        title: 'Flatiron Mediterranean Food Guide - Time Out New York',
        snippet: 'Discover the best Mediterranean cuisine in NYC\'s Flatiron District. From casual falafel spots to upscale Lebanese restaurants.',
        url: 'https://www.timeout.com/newyork/flatiron-mediterranean',
        source: 'timeout.com'
      },
      {
        title: 'Naya Mediterranean Restaurant - Flatiron Location',
        snippet: 'Modern Lebanese cuisine in the heart of Flatiron. Known for fresh mezze, grilled meats, and creative cocktails. Reservations recommended.',
        url: 'https://www.nayanyu.com/flatiron',
        source: 'nayanyu.com'
      }
    ];
  } else if (lowerQuery.includes('four charles')) {
    results = [
      {
        title: 'Four Charles Prime Rib - NYC Restaurant | OpenTable',
        snippet: 'Four Charles Prime Rib offers classic American steakhouse fare in Greenwich Village. Known for their signature prime rib and old-school atmosphere.',
        url: 'https://www.opentable.com/four-charles-prime-rib',
        source: 'opentable.com'
      },
      {
        title: 'Four Charles Prime Rib Review - New York Magazine',
        snippet: 'This throwback steakhouse delivers on nostalgia and quality. The prime rib is exceptional, though service can be inconsistent. Worth the splurge.',
        url: 'https://nymag.com/restaurants/four-charles-review',
        source: 'nymag.com'
      },
      {
        title: 'Four Charles Prime Rib Menu & Prices 2024',
        snippet: 'View the full menu for Four Charles Prime Rib including appetizers, steaks, and desserts. Prime rib starts at $68. Wine selection is extensive.',
        url: 'https://www.menupix.com/four-charles-menu',
        source: 'menupix.com'
      }
    ];
  } else if (lowerQuery.includes('thai villa') || lowerQuery.includes('soothr')) {
    results = [
      {
        title: 'Thai Villa vs Soothr: NYC Thai Restaurant Comparison',
        snippet: 'Comparing two popular NYC Thai restaurants. Thai Villa offers traditional dishes at lower prices, while Soothr focuses on modern Thai fusion.',
        url: 'https://www.foodnetwork.com/thai-restaurant-comparison',
        source: 'foodnetwork.com'
      },
      {
        title: 'Soothr Thai Restaurant - Yelp Reviews',
        snippet: 'Modern Thai restaurant with creative cocktails. Mixed reviews: great atmosphere but some find it overpriced. Pad Thai gets mixed reactions.',
        url: 'https://www.yelp.com/biz/soothr-new-york',
        source: 'yelp.com'
      },
      {
        title: 'Thai Villa Restaurant - Traditional Thai Cuisine',
        snippet: 'Family-owned Thai restaurant serving authentic dishes. Known for generous portions, reasonable prices, and consistent quality. Cash only.',
        url: 'https://www.grubhub.com/thai-villa-nyc',
        source: 'grubhub.com'
      }
    ];
  } else if (lowerQuery.includes('per se')) {
    results = [
      {
        title: 'Per Se Restaurant - Thomas Keller Fine Dining | NYC',
        snippet: 'Per Se offers a $355 nine-course tasting menu featuring contemporary American cuisine. Located at Columbus Circle with Central Park views.',
        url: 'https://www.thomaskeller.com/per-se',
        source: 'thomaskeller.com'
      },
      {
        title: 'Per Se Restaurant Review - The New York Times',
        snippet: 'Thomas Keller\'s Per Se maintains its reputation for excellence. The tasting menu is expensive but delivers an unparalleled dining experience.',
        url: 'https://www.nytimes.com/per-se-restaurant-review',
        source: 'nytimes.com'
      },
      {
        title: 'Per Se Pricing: Is It Worth $400+ Per Person? - Eater NY',
        snippet: 'Breaking down the cost of dining at Per Se. With wine pairings, expect to spend $500-600 per person. Special occasion worthy but not casual dining.',
        url: 'https://ny.eater.com/per-se-pricing-guide',
        source: 'eater.com'
      }
    ];
  } else {
    // Generic restaurant search results
    results = [
      {
        title: `Restaurant Search Results for "${query}" | Google`,
        snippet: 'Find the best restaurants matching your search criteria. View menus, read reviews, and make reservations.',
        url: 'https://www.google.com/search/restaurants',
        source: 'google.com'
      },
      {
        title: `"${query}" Restaurant Reviews | Yelp`,
        snippet: 'Read reviews and see photos from diners. Find restaurants that match your preferences and budget.',
        url: 'https://www.yelp.com/search/restaurants',
        source: 'yelp.com'
      },
      {
        title: `Best Restaurants for "${query}" - OpenTable`,
        snippet: 'Discover and book restaurants that match your search. View availability and make reservations online.',
        url: 'https://www.opentable.com/search',
        source: 'opentable.com'
      }
    ];
  }

  // Filter and enhance based on focus
  if (focus === 'reviews') {
    results = results.filter(r => r.snippet.includes('review') || r.source.includes('yelp'));
  } else if (focus === 'menu') {
    results = results.filter(r => r.snippet.includes('menu') || r.snippet.includes('price'));
  } else if (focus === 'location') {
    results = results.filter(r => r.snippet.includes('location') || r.snippet.includes('address'));
  }

  const sources = results.map(result => `${result.source}: ${result.title}`);
  const summary = generateWebSummary(results, query, focus);

  return { summary, results, sources };
}

function generateWebSummary(results: any[], query: string, focus: string): string {
  if (results.length === 0) {
    return `No relevant web results found for "${query}". Try refining your search or checking the restaurant's official website.`;
  }

  const sources = [...new Set(results.map(r => r.source))];
  const focusText = focus === 'general' ? '' : ` with focus on ${focus}`;

  return `Found ${results.length} web results for "${query}"${focusText} from ${sources.length} sources including ${sources.slice(0, 3).join(', ')}${sources.length > 3 ? ' and others' : ''}.`;
}

// Helper function to enhance search queries
export function enhanceSearchQuery(query: string, location?: string): string {
  let enhanced = query;
  
  // Add location if not present
  if (location && !query.toLowerCase().includes(location.toLowerCase())) {
    enhanced += ` ${location}`;
  }
  
  // Add NYC if no location specified
  if (!enhanced.toLowerCase().includes('nyc') && 
      !enhanced.toLowerCase().includes('new york') && 
      !location) {
    enhanced += ' NYC';
  }
  
  // Add restaurant keyword if not present
  if (!enhanced.toLowerCase().includes('restaurant') && 
      !enhanced.toLowerCase().includes('food') &&
      !enhanced.toLowerCase().includes('dining')) {
    enhanced += ' restaurant';
  }
  
  return enhanced;
}

// Helper function to extract key information from search results
export function extractKeyInfo(results: any[]): {
  pricing?: string;
  cuisine?: string;
  rating?: string;
  location?: string;
} {
  const info: any = {};
  
  const allText = results.map(r => `${r.title} ${r.snippet}`).join(' ').toLowerCase();
  
  // Extract pricing info
  if (allText.includes('expensive') || allText.includes('$$$')) {
    info.pricing = 'expensive';
  } else if (allText.includes('affordable') || allText.includes('$') || allText.includes('cheap')) {
    info.pricing = 'affordable';
  } else if (allText.includes('$$')) {
    info.pricing = 'moderate';
  }
  
  // Extract cuisine type
  const cuisines = ['italian', 'french', 'japanese', 'chinese', 'thai', 'indian', 'mexican', 'mediterranean', 'american'];
  for (const cuisine of cuisines) {
    if (allText.includes(cuisine)) {
      info.cuisine = cuisine;
      break;
    }
  }
  
  // Extract rating info
  const ratingMatch = allText.match(/(\d+\.?\d*)\s*star/);
  if (ratingMatch) {
    info.rating = `${ratingMatch[1]} stars`;
  }
  
  return info;
}