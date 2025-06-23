'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, Search, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface ChatResponse {
  message: string;
  sources?: string[];
  error?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your restaurant recommendation assistant. I can help you find great restaurants, read reviews from Reddit and the web, and answer questions about specific places. Try asking me something like:\n\n• \"Best Mediterranean food in Flatiron\"\n• \"What should I order at Four Charles?\"\n• \"Is Per Se expensive?\"",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        sources: data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again or rephrase your question.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Chat cleared! How can I help you find great restaurants today?",
      timestamp: new Date()
    }]);
    setError(null);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-x-hidden">
      {/* Header - Mobile-first responsive design */}
      <header className="sticky top-0 z-10 bg-white border-b border-orange-200 w-full">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-2">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex-shrink-0">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                  🍽️ Restaurant Assistant
                </h1>
                <p className="text-xs text-gray-600 truncate">
                  Powered by AI. Reddit and Web Search
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Clear chat"
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area - No horizontal scroll */}
      <main className="w-full px-3 sm:px-4 lg:px-6 pb-32 sm:pb-28">
        <div className="py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 sm:gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar - Responsive sizing */}
              <div
                className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-500'
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                ) : (
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                )}
              </div>

              {/* Message Content - Prevent horizontal overflow */}
              <div
                className={`flex-1 min-w-0 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl max-w-full overflow-hidden ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                  }`}
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {message.content}
                  </div>
                  
                  {/* Sources - Responsive layout */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-1 mb-1.5 sm:mb-2">
                        <Search className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Sources
                        </span>
                      </div>
                      <div className="space-y-1">
                        {message.sources.map((source, index) => (
                          <div 
                            key={index} 
                            className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                            style={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word'
                            }}
                          >
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Timestamp - Responsive positioning */}
                <div
                  className={`mt-1 text-xs text-gray-500 px-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator - Responsive design */}
          {isLoading && (
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    <span className="hidden sm:inline">Searching for recommendations...</span>
                    <span className="sm:hidden">Searching...</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Error Banner - No horizontal overflow */}
      {error && (
        <div className="fixed top-16 sm:top-20 left-2 right-2 z-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700" style={{ wordBreak: 'break-word' }}>
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-lg leading-none flex-shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input Form - Mobile-optimized design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-start gap-2 w-full">
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about restaurants..."
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none text-base bg-white disabled:bg-gray-50 disabled:text-gray-500"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  fontSize: '16px'
                }}
                disabled={isLoading}
                maxLength={500}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {/* Character count inside input area on mobile */}
              <div className="mt-1 text-xs text-gray-400 px-1 sm:hidden">
                <span className={input.length > 450 ? 'text-orange-600 font-medium' : ''}>
                  {input.length}/500
                </span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center touch-manipulation"
              style={{
                WebkitTapHighlightColor: 'transparent',
                alignSelf: 'flex-start'
              }}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Character count - Hidden on mobile, shown on desktop */}
          <div className="mt-2 text-xs text-gray-500 text-right hidden sm:block">
            <span className={input.length > 450 ? 'text-orange-600 font-medium' : ''}>
              {input.length}/500
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}