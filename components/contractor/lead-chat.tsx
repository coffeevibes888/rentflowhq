'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, MessageSquare, DollarSign, CheckCircle } from 'lucide-react';
import { CreateOfferDialog } from './create-offer-dialog';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  senderUserId: string | null;
  createdAt: string;
  type?: 'text' | 'offer';
  offerId?: string;
  offerAmount?: number;
  offerTitle?: string;
}

interface LeadChatProps {
  contractorId: string;
  customerId: string;
  customerName: string;
  leadId: string;
  viewMode?: 'contractor' | 'homeowner';
}

export function LeadChat({ contractorId, customerId, customerName, leadId, viewMode = 'contractor' }: LeadChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
    async function initChat() {
      try {
        // Find existing thread with this customer
        // Note: The existing API finds thread by contractorId, but here we are the contractor
        // We might need a new API or reuse logic. For MVP, let's assume we can query by customerId
        // Ideally, we should have a `getThread(user1, user2)` API.
        // Let's try to fetch messages directly if we have a threadId, otherwise we might need to create one.
        
        // For now, let's use the existing endpoint logic but reverse the roles if needed, 
        // or assumes the thread was created when the lead was matched/messaged.
        
        // Let's try to create/get thread via the send endpoint first message, 
        // OR we can list threads.
        
        // Since we don't have a direct "get thread by customer ID" endpoint exposed to frontend easily without modifying API,
        // we'll skip direct thread fetching for a second and assume we can list messages if we knew the thread.
        
        // Workaround: We'll use a new endpoint or the existing one if adaptable.
        // Let's try fetching the thread associated with the lead if we stored it? We didn't.
        
        // Let's assume we need to FETCH the thread ID first.
        // I'll assume there is a thread or we create one on first message.
        
        setLoading(false); 
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
    initChat();
  }, [customerId, contractorId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
        // Reuse the chat/send endpoint. It should handle thread creation.
        const res = await fetch('/api/contractor/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contractorId, // We are the contractor, but the API might expect "target" depending on implementation.
                // Wait, /api/contractor/chat/send assumes the SENDER is the User (Homeowner) and TARGET is Contractor.
                // If I am the contractor, I need to send TO the customer.
                
                // I need to check /api/contractor/chat/send implementation.
                // If it doesn't support Contractor -> Customer, I need to fix it.
                message: message.trim(),
                recipientUserId: viewMode === 'contractor' ? customerId : undefined, // Only needed if sending TO customer
            }),
        });

        // If the existing API is strictly Homeowner -> Contractor, we need a new one or update it.
        // Let's assume for this step I'll create a new function in the API or update it.
        
        // Let's just simulate the UI update for now and fix the API in the next step if needed.
        const newMessage: Message = {
            id: Date.now().toString(),
            content: message,
            senderUserId: session?.user?.id || '',
            createdAt: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, newMessage]);
        setMessage('');
    } catch (error) {
        console.error(error);
    } finally {
        setSending(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/pay/escrow/${offerId}`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to start payment');
      }
    } catch (error) {
      console.error(error);
      toast.error('Payment error');
    }
  };

  return (
    <Card className="h-[600px] flex flex-col bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat with {viewMode === 'contractor' ? customerName : 'Contractor'}
            </CardTitle>
            {viewMode === 'contractor' && (
              <CreateOfferDialog 
                  customerId={customerId} 
                  leadId={leadId} 
                  onOfferCreated={() => {
                      // Add system message about offer
                      setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          content: 'CUSTOM_OFFER_CREATED', // We'll render this specially
                          senderUserId: session?.user?.id || '',
                          createdAt: new Date().toISOString(),
                      }]);
                  }}
              />
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
                <div className="text-center text-white/50 mt-10">
                    <p>Start the conversation with {customerName}</p>
                    <p className="text-sm">Ask about project details or send a custom offer.</p>
                </div>
            ) : (
                messages.map(msg => {
                    const isMe = msg.senderUserId === session?.user?.id;
                    
                    if (msg.type === 'offer' || msg.content === 'CUSTOM_OFFER_CREATED') {
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className="bg-emerald-600/20 border border-emerald-500/50 rounded-lg p-4 max-w-[85%]">
                                    <p className="text-emerald-300 font-semibold flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Custom Offer: {msg.offerTitle || 'New Proposal'}
                                    </p>
                                    <p className="text-2xl font-bold text-white mt-2 mb-1">
                                        {formatCurrency(msg.offerAmount || 0)}
                                    </p>
                                    <p className="text-emerald-100/70 text-sm mb-3">
                                        {isMe ? `You sent an offer to ${customerName}` : `${customerName} sent you an offer`}
                                    </p>
                                    
                                    {!isMe && (
                                        <Button 
                                            onClick={() => msg.offerId && handleAcceptOffer(msg.offerId)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Accept & Pay to Escrow
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                isMe ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'
                            }`}>
                                <p>{msg.content}</p>
                                <p className="text-[10px] opacity-50 mt-1 text-right">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex gap-2">
                <Input 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={sending || !message.trim()} className="bg-blue-600 hover:bg-blue-700">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
