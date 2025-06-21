// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchReddit } from '@/lib/reddit';
import { searchWeb } from '@/lib/web-search';

// Add detailed logging
const log = (level: 'info' | 'error' | 'warn', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Initialize OpenAI with better error handling
let openai: OpenAI;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // 30 second timeout
    maxRetries: 2,
  });
  
  log('info', 'OpenAI client initialized successfully');
} catch (error) {
  log('error', 'Failed to initialize OpenAI client', error);
  throw error;
}

// Environment variable validation
const validateEnvironment = (): { valid: boolean; missing: string[] } => {
  const required = ['OPENAI_API_KEY'];
  const optional = ['BRAVE_SEARCH_API_KEY', 'REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'];
  
  const missing = required.filter(key => !process.env[key]);
  const hasOptional = optional.some(key => process.env[key]);
  
  log('info', 'Environment check', {
    required: required.map(key => ({ [key]: process.env[key] ? 'SET' : 'MISSING' })),
    optional: optional.map(key => ({ [key]: process.env[key] ? 'SET' : 'MISSING' })),
    hasOptional
  });
  
  return { valid: missing.length === 0, missing };
};

// Enhanced tools definition
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_reddit',
      description: 'Search Reddit for authentic restaurant reviews and community discussions. Best for real user experiences and local insights.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for Reddit (e.g., "best Indian restaurant Denton Texas", "Maharaja Restaurant review")'
          },
          subreddits: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific subreddits to search (optional). Defaults to food-related subreddits.',
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
      description: 'Search the web for restaurant information, professional reviews, and recommendations. Best for official information and expert reviews.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Web search query (e.g., "best Indian restaurants Denton Texas 2024", "Maharaja Restaurant menu hours")'
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

interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

// Enhanced system prompt
const getSystemPrompt = (): string => {
  const envCheck = validateEnvironment();
  const availableTools = [];
  
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
    availableTools.push('Reddit search for community insights');
  }
  if (process.env.BRAVE_SEARCH_API_KEY) {
    availableTools.push('Web search for professional reviews');
  }

  return `You are a knowledgeable restaurant recommendation assistant. You help users find great restaurants based on their preferences, location, and budget.

Available tools: ${availableTools.length > 0 ? availableTools.join(', ') : 'Limited - working with general knowledge'}

Guidelines:
- For specific locations, always search for restaurants in that area
- Combine information from multiple sources when available
- Consider user preferences: cuisine type, budget, atmosphere, dietary restrictions
- Provide practical information: location, hours, price range, parking, reservations
- Mention standout dishes and what makes each restaurant special
- Be honest about limitations if search tools aren't available
- If searches fail, provide helpful general advice based on the query

For Indian food in Denton, Texas specifically:
- Focus on authentic flavors, spice levels, and traditional dishes
- Consider both casual and fine dining options
- Mention vegetarian/vegan options as Indian cuisine excels in this area
- Include information about lunch buffets if available

Always cite sources when using search results and be transparent about information limitations.`;
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    log('info', 'Received chat request');
    
    // Environment validation
    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      const error: ErrorResponse = {
        error: 'Server configuration error',
        details: `Missing required environment variables: ${envCheck.missing.join(', ')}`,
        timestamp: new Date().toISOString()
      };
      log('error', 'Environment validation failed', error);
      return NextResponse.json(error, { status: 500 });
    }

    // Parse and validate request
    let body: ChatRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      const error: ErrorResponse = {
        error: 'Invalid request format',
        details: 'Request body must be valid JSON',
        timestamp: new Date().toISOString()
      };
      log('error', 'JSON parse error', parseError);
      return NextResponse.json(error, { status: 400 });
    }

    // Validate messages
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      const error: ErrorResponse = {
        error: 'Invalid request',
        details: 'Messages array is required and cannot be empty',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate message structure
    for (let i = 0; i < body.messages.length; i++) {
      const message = body.messages[i];
      if (!message.role || !message.content || typeof message.content !== 'string') {
        const error: ErrorResponse = {
          error: 'Invalid message format',
          details: `Message at index ${i} must have valid role and content`,
          timestamp: new Date().toISOString()
        };
        return NextResponse.json(error, { status: 400 });
      }
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        const error: ErrorResponse = {
          error: 'Invalid message role',
          details: `Message at index ${i} has invalid role: ${message.role}`,
          timestamp: new Date().toISOString()
        };
        return NextResponse.json(error, { status: 400 });
      }
    }

    log('info', 'Request validation passed', {
      messageCount: body.messages.length,
      lastMessage: body.messages[body.messages.length - 1].content.substring(0, 100)
    });

    // Prepare messages
    const systemMessage: ChatMessage = {
      role: 'system',
      content: getSystemPrompt()
    };

    const messages: ChatMessage[] = [systemMessage, ...body.messages];

    // Initial OpenAI call with retry logic
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      log('info', 'Calling OpenAI API', { messageCount: messages.length });
      
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using more reliable model
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        tools: process.env.BRAVE_SEARCH_API_KEY || process.env.REDDIT_CLIENT_ID ? tools : undefined,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1500,
      });
      
      log('info', 'OpenAI API call successful');
    } catch (openaiError) {
      log('error', 'OpenAI API call failed', openaiError);
      
      // Handle specific OpenAI errors
      if (openaiError instanceof Error) {
        if (openaiError.message.includes('rate limit')) {
          const error: ErrorResponse = {
            error: 'Too many requests',
            details: 'Please wait a moment before trying again',
            timestamp: new Date().toISOString()
          };
          return NextResponse.json(error, { status: 429 });
        }
        if (openaiError.message.includes('insufficient_quota')) {
          const error: ErrorResponse = {
            error: 'Service temporarily unavailable',
            details: 'Please try again later',
            timestamp: new Date().toISOString()
          };
          return NextResponse.json(error, { status: 503 });
        }
        if (openaiError.message.includes('invalid_api_key')) {
          const error: ErrorResponse = {
            error: 'Authentication failed',
            details: 'Please contact support',
            timestamp: new Date().toISOString()
          };
          return NextResponse.json(error, { status: 401 });
        }
      }
      
      throw openaiError;
    }

    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      throw new Error('Empty response from OpenAI');
    }

    let finalResponse = responseMessage.content || '';
    let sources: string[] = [];

    // Handle tool calls with better error handling
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      log('info', 'Processing tool calls', { count: responseMessage.tool_calls.length });
      
      const toolMessages: any[] = [
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        responseMessage
      ];

      // Execute each tool call with individual error handling
      for (let i = 0; i < responseMessage.tool_calls.length; i++) {
        const toolCall = responseMessage.tool_calls[i];
        const { function: func } = toolCall;
        
        let toolResult: any;
        let toolSources: string[] = [];

        try {
          log('info', `Executing tool ${i + 1}/${responseMessage.tool_calls.length}`, {
            name: func.name,
            args: func.arguments
          });
          
          const args = JSON.parse(func.arguments);

          switch (func.name) {
            case 'search_reddit':
              if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
                toolResult = { 
                  error: 'Reddit search not configured',
                  fallback: 'Using general knowledge for recommendations'
                };
              } else {
                const redditResult = await Promise.race([
                  searchReddit(args.query, args.subreddits),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Reddit search timeout')), 15000)
                  )
                ]);
                toolResult = redditResult;
                toolSources = (redditResult as any).sources || [];
              }
              break;

            case 'search_web':
              if (!process.env.BRAVE_SEARCH_API_KEY) {
                toolResult = { 
                  error: 'Web search not configured',
                  fallback: 'Using general knowledge for recommendations'
                };
              } else {
                const webResult = await Promise.race([
                  searchWeb(args.query, args.focus),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Web search timeout')), 15000)
                  )
                ]);
                toolResult = webResult;
                toolSources = (webResult as any).sources || [];
              }
              break;

            default:
              toolResult = { error: `Unknown tool: ${func.name}` };
          }

          sources.push(...toolSources);
          log('info', `Tool ${func.name} executed successfully`, { sourcesFound: toolSources.length });

        } catch (toolError) {
          log('error', `Tool ${func.name} failed`, toolError);
          toolResult = { 
            error: `${func.name} failed: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
            fallback: 'Providing general recommendations based on available knowledge'
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
      try {
        log('info', 'Getting final response with tool results');
        
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: toolMessages,
          temperature: 0.7,
          max_tokens: 1500,
        });

        finalResponse = finalCompletion.choices[0]?.message?.content || 
          'I apologize, but I encountered an issue processing your request. However, I can still help with general restaurant recommendations.';
        
        log('info', 'Final response generated successfully');
      } catch (finalError) {
        log('error', 'Failed to get final response', finalError);
        finalResponse = 'I found some information but had trouble processing it. Let me provide what I can based on your request.';
      }
    }

    // Clean up sources
    sources = Array.from(new Set(sources.filter(source => source && source.length > 0)));

    const responseTime = Date.now() - startTime;
    log('info', 'Request completed successfully', {
      responseTime: `${responseTime}ms`,
      sourcesCount: sources.length,
      responseLength: finalResponse.length
    });

    return NextResponse.json({
      message: finalResponse,
      sources: sources.length > 0 ? sources : undefined,
      meta: {
        responseTime,
        toolsUsed: responseMessage.tool_calls?.map(tc => tc.function.name) || [],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    log('error', 'Request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      details: 'Please try again. If the problem persists, contact support.',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed',
    details: 'Use POST to send chat messages',
    timestamp: new Date().toISOString()
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'Method not allowed',
    details: 'Use POST to send chat messages',
    timestamp: new Date().toISOString()
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'Method not allowed',
    details: 'Use POST to send chat messages',
    timestamp: new Date().toISOString()
  }, { status: 405 });
}