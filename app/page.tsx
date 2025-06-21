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

export default function RestaurantChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Mobile keyboard detection and handling
  useEffect(() => {
    const handleResize = () => {
      // Use visual viewport if available (modern browsers)
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const keyboardHeight = window.innerHeight - currentHeight;
        setKeyboardHeight(keyboardHeight > 0 ? keyboardHeight : 0);
        setViewportHeight(currentHeight);
      } else {
        // Fallback for older browsers
        const currentHeight = window.innerHeight;
        const keyboardHeight = window.screen.height - currentHeight;
        setKeyboardHeight(keyboardHeight > 150 ? keyboardHeight : 0);
        setViewportHeight(currentHeight);
      }
    };

    // Initial setup
    handleResize();

    // Add event listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

<<<<<<< HEAD
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
=======
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
>>>>>>> parent of 1502a40 (UI/UX fix to the mobile version and the updated the reddit code irrespective or subreddit)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          history: messages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I apologize, but I couldn\'t generate a response. Please try again.',
        sources: data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to get response. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSendClick = () => {
    handleSubmit();
  };

  // Calculate dynamic heights for mobile
  const dynamicStyle = {
    height: keyboardHeight > 0 ? `${viewportHeight}px` : '100vh',
    maxHeight: keyboardHeight > 0 ? `${viewportHeight}px` : '100vh'
  };

  const inputContainerStyle = {
    paddingBottom: keyboardHeight > 0 ? '8px' : 'max(8px, env(safe-area-inset-bottom))'
  };

  return (
<<<<<<< HEAD
    <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex flex-col overflow-hidden" style={dynamicStyle}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50 px-4 py-3 shadow-sm" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Restaurant Assistant</h1>
            <p className="text-sm text-gray-600">Find your perfect meal</p>
=======
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-orange-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Restaurant Assistant</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Powered by AI • Reddit & Web Search</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Clear chat"
            >
              Clear Chat
            </button>
>>>>>>> parent of 1502a40 (UI/UX fix to the mobile version and the updated the reddit code irrespective or subreddit)
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded-r-lg animate-slide-up">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
=======
      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-32">
        <div className="py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-500'
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 max-w-xs sm:max-w-2xl ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {message.content}
                  </div>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-1 mb-2">
                        <Search className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Sources
                        </span>
                      </div>
                      <div className="space-y-1">
                        {message.sources.map((source, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Timestamp */}
                <div
                  className={`mt-1 text-xs text-gray-500 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span className="text-sm text-gray-600">Searching for recommendations...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-20 left-4 right-4 z-20 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
>>>>>>> parent of 1502a40 (UI/UX fix to the mobile version and the updated the reddit code irrespective or subreddit)
            >
              ×
            </button>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ 
          paddingBottom: keyboardHeight > 0 ? '80px' : '100px',
          maxHeight: keyboardHeight > 0 ? `${viewportHeight - 140}px` : 'calc(100vh - 140px)'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-6 mb-6 animate-bounce-subtle">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Restaurant Assistant!</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              I'm here to help you discover amazing restaurants, find the perfect meal, and answer any food-related questions you might have.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                "What's the best Italian restaurant nearby?",
                "I'm looking for vegan options",
                "Recommend a romantic dinner spot",
                "Find me the best pizza in town"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="p-3 bg-white/60 hover:bg-white/80 border border-orange-200/50 rounded-lg text-left text-sm text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md"
                >
                  {suggestion}
                </button>
              ))}
            </div>
=======
      {/* Input Form - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about restaurants... (e.g., 'Best pizza in Brooklyn')"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
                disabled={isLoading}
                maxLength={500}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center min-w-[48px]"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          
          {/* Character count */}
          <div className="mt-2 text-xs text-gray-500 text-right">
            {input.length}/500
>>>>>>> parent of 1502a40 (UI/UX fix to the mobile version and the updated the reddit code irrespective or subreddit)
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'bg-white/80 text-gray-800 border border-gray-200/50'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200/50">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Search className="w-3 h-3" />
                          <span>Sources: {message.sources.length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-slide-up">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/80 rounded-2xl px-4 py-3 border border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Container - Fixed positioning with keyboard awareness */}
      <div 
        className="bg-white/90 backdrop-blur-sm border-t border-orange-200/50 px-4 py-3"
        style={inputContainerStyle}
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about restaurants, cuisine, or food recommendations..."
              maxLength={500}
              className="w-full px-4 py-3 bg-white border border-orange-200/50 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm placeholder-gray-500 pr-12"
              disabled={isLoading}
            />
            {input.length > 400 && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <span className={`text-xs ${input.length > 480 ? 'text-red-500' : 'text-orange-500'}`}>
                  {input.length}/500
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}