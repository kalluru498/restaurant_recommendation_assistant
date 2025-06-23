import { NextRequest, NextResponse } from 'next/server';
import { searchReddit } from '@/lib/reddit';
import { searchWeb } from '@/lib/web-search';
import { getAvailableProviders, getOpenAI, getGemini } from '@/lib/ai-providers';

// Define available tools for OpenAI
const tools: any[] = [
  {
    type: 'function',
    function: {
      name: 'search_reddit',
      description: 'Search Reddit for restaurant reviews and discussions. Great for authentic user opinions and experiences.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for Reddit (e.g., "best pizza Brooklyn reddit", "Four Charles restaurant review")'
          },
          subreddits: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific subreddits to search (optional)',
            default: ['food', 'AskNYC', 'nyc', 'FoodNYC', 'restaurant']
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for restaurant information, reviews, and recommendations from professional sources.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Web search query (e.g., "Four Charles restaurant NYC review", "best Mediterranean Flatiron")'
          },
          focus: {
            type: 'string',
            enum: ['reviews', 'menu', 'location', 'general'],
            description: 'What aspect to focus the search on',
            default: 'general'
          }
        },
        required: ['query']
      }
    }
  }
];

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  preferredProvider?: string;
}

// Enhanced error handling and tool execution
async function executeToolCall(toolName: string, args: any): Promise<{ result: any; sources: string[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    let result: any;
    let sources: string[] = [];

    switch (toolName) {
      case 'search_reddit':
        const redditResult = await searchReddit(args.query, args.subreddits);
        result = redditResult;
        sources = redditResult.sources || [];
        break;

      case 'search_web':
        const webResult = await searchWeb(args.query, args.focus);
        result = webResult;
        sources = webResult.sources || [];
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    clearTimeout(timeoutId);
    return { result, sources };

  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Tool ${toolName} error:`, error);
    
    return {
      result: { 
        error: `Search temporarily unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fallback: `I'm having trouble accessing ${toolName} right now. Please try asking your question in a different way.`
      },
      sources: []
    };
  }
}

// Main API handler
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    let body: ChatRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request format. Please send valid JSON.' },
        { status: 400 }
      );
    }

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty.' },
        { status: 400 }
      );
    }

    // Check available providers
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      return NextResponse.json(
        { error: 'No AI providers are configured. Please check your API keys.' },
        { status: 500 }
      );
    }

    // Select provider
    let selectedProvider = availableProviders[0];
    if (body.preferredProvider) {
      const preferred = availableProviders.find(p => p.name === body.preferredProvider);
      if (preferred) selectedProvider = preferred;
    }

    console.log(`Using AI provider: ${selectedProvider.name}`);

    // System message
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a helpful restaurant recommendation assistant. You have access to two powerful tools:

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

      Focus on providing helpful, accurate restaurant recommendations based on real user experiences and professional reviews.`
    };

    const messages: ChatMessage[] = [systemMessage, ...body.messages];
    let finalResponse = '';
    let sources: string[] = [];
    let usedProvider = selectedProvider.name;

    // Try each provider in order
    for (let i = 0; i < availableProviders.length; i++) {
      const currentProvider = i === 0 ? selectedProvider : availableProviders[i];
      
      try {
        console.log(`Attempting with provider: ${currentProvider.name}`);

        if (currentProvider.name === 'gemini') {
          const gemini = getGemini();
          if (!gemini) throw new Error('Gemini service not available');

          // Use Gemini service
          const geminiResponse = await gemini.generateResponse(messages);
          
          if (geminiResponse.needsTools && geminiResponse.toolQueries.length > 0) {
            const toolResults = [];
            
            for (const toolQuery of geminiResponse.toolQueries) {
              const args = toolQuery.type === 'search_reddit' 
                ? { query: toolQuery.query }
                : { query: toolQuery.query, focus: 'general' };
              
              const { result, sources: toolSources } = await executeToolCall(toolQuery.type, args);
              toolResults.push(result);
              sources.push(...toolSources);
            }

            finalResponse = await gemini.generateWithToolResults(messages, toolResults);
          } else {
            finalResponse = geminiResponse.message;
          }

          usedProvider = 'gemini';
          break;

        } else if (currentProvider.name === 'openai') {
          const openai = getOpenAI();
          if (!openai) throw new Error('OpenAI service not available');

          // Use OpenAI with function calling
          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 1000,
          });

          const responseMessage = completion.choices[0]?.message;
          if (!responseMessage) throw new Error('No response from OpenAI');

          finalResponse = responseMessage.content || '';

          // Handle tool calls
          if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolMessages: any[] = [
              ...messages.map(msg => ({ role: msg.role, content: msg.content })),
              responseMessage
            ];

            for (const toolCall of responseMessage.tool_calls) {
              const { function: func } = toolCall;
              const args = JSON.parse(func.arguments);
              
              const { result, sources: toolSources } = await executeToolCall(func.name, args);
              sources.push(...toolSources);

              toolMessages.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify(result)
              });
            }

            const finalCompletion = await openai.chat.completions.create({
              model: 'gpt-4-turbo-preview',
              messages: toolMessages,
              temperature: 0.7,
              max_tokens: 1000,
            });

            finalResponse = finalCompletion.choices[0]?.message?.content || 'I apologize, but I encountered an issue processing your request.';
          }

          usedProvider = 'openai';
          break;
        }

      } catch (error) {
        console.error(`Provider ${currentProvider.name} failed:`, error);
        
        if (i === availableProviders.length - 1) {
          throw error;
        }
        
        console.log(`Switching to next provider...`);
      }
    }

    // Remove duplicate sources
    sources = sources.filter((source, index, array) => array.indexOf(source) === index);

    console.log(`Response generated using ${usedProvider} with ${sources.length} sources`);

    return NextResponse.json({
      message: finalResponse,
      sources: sources.length > 0 ? sources : undefined,
      provider: usedProvider
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
      if (error.message.includes('insufficient_quota') || error.message.includes('402')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please check your billing settings.' },
          { status: 402 }
        );
      }
      if (error.message.includes('invalid_api_key') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your configuration.' },
          { status: 401 }
        );
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'An internal server error occurred. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send chat messages.' },
    { status: 405 }
  );
}