'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader, X } from 'lucide-react';
import { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatBoxProps {
  onClose?: () => void;
}

export function ChatBox({ onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      senderName: 'You',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
        senderName: 'AI Assistant',
      };

      setMessages((prev) => [...prev, aiMessage]);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const agentMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.agentResponse || 'A live agent will connect with you shortly.',
        sender: 'agent',
        timestamp: new Date(),
        senderName: 'Live Agent',
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        senderName: 'AI Assistant',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 text-white p-4 sticky top-0 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Support Chat</h2>
          <p className="text-sm text-blue-100">AI Assistant & Live Agent Support</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500 dark:text-slate-400">
              <p className="mb-2">👋 Welcome to Support Chat</p>
              <p className="text-sm">Start a conversation with our AI assistant</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex flex-col max-w-xs md:max-w-md lg:max-w-lg ${
                  message.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {message.senderName} • {formatTime(message.timestamp)}
                </div>
                {message.isTyping ? (
                  <div
                    className={`p-3 rounded-lg flex items-center gap-1 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.sender === 'ai'
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : 'bg-green-300 dark:bg-green-800 text-slate-900 dark:text-white'
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-lg break-words ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : message.sender === 'ai'
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                          : 'bg-green-300 dark:bg-green-800 text-slate-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type your message... (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white dark:border-slate-700"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          💡 Tip: Press Enter to send your message
        </p>
      </div>
    </div>
  );
}
