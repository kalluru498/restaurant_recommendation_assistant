// lib/ai-providers.ts
import OpenAI from 'openai';
import { GeminiService } from './gemini';

export interface AIProvider {
  name: string;
  enabled: boolean;
  priority: number;
}

export const AI_PROVIDERS: AIProvider[] = [
  { name: 'gemini', enabled: true, priority: 1 },  // Gemini as default
  { name: 'openai', enabled: true, priority: 2 }   // OpenAI as fallback
];

// Initialize OpenAI
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Initialize Gemini
let gemini: GeminiService | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    gemini = new GeminiService();
  } catch (error) {
    console.error('Failed to initialize Gemini service:', error);
  }
}

export function getAvailableProviders(): AIProvider[] {
  return AI_PROVIDERS.filter(provider => {
    if (provider.name === 'openai') return !!process.env.OPENAI_API_KEY && !!openai;
    if (provider.name === 'gemini') return !!process.env.GEMINI_API_KEY && !!gemini;
    return false;
  }).sort((a, b) => a.priority - b.priority);
}

export function getOpenAI(): OpenAI | null {
  return openai;
}

export function getGemini(): GeminiService | null {
  return gemini;
}