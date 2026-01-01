'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

/**
 * Live Chat Widget Placeholder
 * 
 * This is a placeholder component. For production, integrate with:
 * - Intercom (recommended)
 * - Crisp
 * - Zendesk Chat
 * - Tawk.to (free)
 * 
 * To integrate Intercom, add to layout.tsx:
 * <Script src="https://widget.intercom.io/widget/YOUR_APP_ID" strategy="lazyOnload" />
 * 
 * And initialize with:
 * window.Intercom('boot', { app_id: 'YOUR_APP_ID' });
 */

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: 'Hi! 👋 How can we help you today?', isUser: false },
  ]);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setMessage('');
    setIsSending(true);

    // Simulate response (replace with actual chat integration)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          text: "Thanks for reaching out! Our team typically responds within a few hours. For immediate help, check out our FAQ section or email us at support@propertyflowhq.com",
          isUser: false,
        },
      ]);
      setIsSending(false);
    }, 1000);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='fixed bottom-6 right-6 z-50 rounded-full bg-violet-500 text-white p-4 shadow-lg hover:bg-violet-400 transition-all duration-300 hover:scale-110'
        aria-label='Open chat'
      >
        {isOpen ? (
          <X className='h-6 w-6' />
        ) : (
          <MessageCircle className='h-6 w-6' />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className='fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300'>
          {/* Header */}
          <div className='bg-violet-500 px-4 py-3'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center'>
                <MessageCircle className='h-5 w-5 text-white' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Property Flow HQ</h3>
                <p className='text-xs text-violet-100'>We typically reply in a few hours</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className='h-72 overflow-y-auto p-4 space-y-3'>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.isUser
                      ? 'bg-violet-500 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className='flex justify-start'>
                <div className='bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-2'>
                  <Loader2 className='h-4 w-4 animate-spin text-slate-400' />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className='border-t border-white/10 p-3'>
            <div className='flex gap-2'>
              <input
                type='text'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder='Type a message...'
                className='flex-1 bg-slate-800 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500'
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending}
                className='rounded-full bg-violet-500 p-2 text-white hover:bg-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Send className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
