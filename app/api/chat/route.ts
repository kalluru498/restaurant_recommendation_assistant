import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchReddit } from '@/lib/reddit';
import { searchWeb } from '@/lib/web-search';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('BRAVE_SEARCH_API_KEY:', process.env.BRAVE_SEARCH_API_KEY ? 'SET' : 'NOT SET');
console.log('API Key length:', process.env.BRAVE_SEARCH_API_KEY?.length || 0);
// Define available tools
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
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
}

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Parse request body
    let body: ChatRequest;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return NextResponse.json(
        { error: 'Invalid request format. Please send valid JSON.' },
        { status: 400 }
      );
    }

    // Validate messages
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty.' },
        { status: 400 }
      );
    }

    // Validate message format
    for (const message of body.messages) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: 'Each message must have a role and content.' },
          { status: 400 }
        );
      }
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return NextResponse.json(
          { error: 'Message role must be user, assistant, or system.' },
          { status: 400 }
        );
      }
    }

    // System prompt for restaurant recommendations
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a helpful restaurant recommendation assistant. You have access to two powerful tools:

1. search_reddit: Use this to find authentic user reviews and discussions about restaurants from Reddit communities
2. search_web: Use this to search for professional reviews, restaurant information, menus, and general recommendations

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

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [systemMessage, ...body.messages];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    // Call OpenAI with function calling
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
    
    if (!responseMessage) {
      throw new Error('No response from OpenAI');
    }

    let finalResponse = responseMessage.content || '';
    let sources: string[] = [];

    // Handle tool calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      console.log('Processing', responseMessage.tool_calls.length, 'tool calls');
      
      const toolMessages: any[] = [
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        responseMessage
      ];

      // Execute tool calls
      for (const toolCall of responseMessage.tool_calls) {
        const { function: func } = toolCall;
        let toolResult: any;
        let toolSources: string[] = [];

        try {
          console.log(`Executing tool: ${func.name} with args:`, func.arguments);
          
          const args = JSON.parse(func.arguments);

          switch (func.name) {
            case 'search_reddit':
              const redditResult = await searchReddit(args.query, args.subreddits);
              toolResult = redditResult;
              toolSources = redditResult.sources || [];
              break;

            case 'search_web':
              const webResult = await searchWeb(args.query, args.focus);
              toolResult = webResult;
              toolSources = webResult.sources || [];
              break;

            default:
              toolResult = { error: `Unknown tool: ${func.name}` };
          }

          sources.push(...toolSources);

        } catch (error) {
          console.error(`Tool ${func.name} error:`, error);
          toolResult = { 
            error: `Failed to execute ${func.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }

        // Add tool result to conversation
        toolMessages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(toolResult)
        });
      }

      // Get final response with tool results
      console.log('Getting final response from OpenAI with tool results');
      
      const finalCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: toolMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      finalResponse = finalCompletion.choices[0]?.message?.content || 'I apologize, but I encountered an issue processing your request.';
    }

    // Remove duplicate sources
    sources = [...new Set(sources)];

    console.log('Sending response with', sources.length, 'sources');

    return NextResponse.json({
      message: finalResponse,
      sources: sources.length > 0 ? sources : undefined
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please check your OpenAI billing.' },
          { status: 402 }
        );
      }
      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your OpenAI configuration.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An internal server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send chat messages.' },
    { status: 405 }
  );
}