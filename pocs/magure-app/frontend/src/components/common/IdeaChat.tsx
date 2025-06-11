import React, { useState, useRef, useEffect } from 'react';
import { refineIdea, submitIdea } from '@/services/ideasApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const IdeaChat: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [idea]);

  const handleSend = async () => {
    if (!idea.trim()) return;
    setIsLoading(true);
    setShowError(false);
    const newMessages = [...messages, { role: 'user' as const, content: idea }];
    setMessages(newMessages);
    setIdea('');

    try {
      // Call backend for refinement
      const refined = await refineIdea(idea, newMessages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })));
      setMessages([...newMessages, { role: 'assistant' as const, content: refined }]);
    } catch (error) {
      setShowError(true);
      setMessages([...newMessages, { 
        role: 'assistant' as const, 
        content: 'Sorry, there was an error refining your idea. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  // Submit idea to backend
  const handleSubmitIdea = async () => {
    setSubmitting(true);
    try {
      // Extract title from first user message or create a summary
      const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'Untitled Idea';
      const title = firstUserMessage.length > 50 
        ? firstUserMessage.substring(0, 50) + '...' 
        : firstUserMessage;
      
      // Get the last assistant message as the refined idea description
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      const description = lastAssistantMessage?.content || messages.map(m => m.content).join('\n\n');
      
      await submitIdea(title, description);
      setSubmitSuccess(true);
      setMessages([]);
      setIdea('');
      
      // Show success toast
      toast({
        title: "Success!",
        description: "Your idea has been submitted successfully.",
      });
      
      // Reset success state after a delay
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-3xl flex flex-col items-center justify-between h-full p-6">
        {/* Centered prompt */}
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          {messages.length === 0 && (
            <div className="text-center mb-8 animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>What can I help with?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Share your idea and I'll help refine it</p>
            </div>
          )}
          
          {/* Chat area */}
          <div className="w-full flex-1 flex flex-col justify-end min-h-0">
            <div className="flex-1 flex flex-col justify-end overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              <div className="w-full flex flex-col gap-4 py-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className={`rounded-2xl px-5 py-3 max-w-[85%] shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                    }`}>
                      <span style={{ fontFamily: 'Satoshi, sans-serif' }} className="leading-relaxed">
                        {msg.content}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {/* Error message */}
            {showError && (
              <div className="w-full animate-in slide-in-from-bottom duration-300">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Sorry, there was an error refining your idea. Please try again later.
                </div>
              </div>
            )}
            
            {/* Input bar */}
            <div className="w-full mt-6">
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 focus-within:shadow-xl focus-within:border-[#B96AF7]">
                <textarea
                  ref={textareaRef}
                  value={idea}
                  onChange={e => setIdea(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={messages.length === 0 ? "Share your idea..." : "Continue the conversation..."}
                  className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl px-5 py-4 pr-14 resize-none focus:outline-none"
                  disabled={isLoading || submitting}
                  style={{ 
                    minHeight: 56,
                    maxHeight: 120,
                    fontFamily: 'Satoshi, sans-serif'
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !idea.trim() || submitting}
                  className="absolute right-2 bottom-2 p-3 rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </div>
        </div>
        {/* Submit Button */}
        {messages.length > 0 && (
          <div className="w-full flex justify-center mt-8 animate-in slide-in-from-bottom duration-500">
            <button
              onClick={handleSubmitIdea}
              disabled={submitting || messages.length === 0}
              className="group relative px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
              style={{ 
                minHeight: 56,
                fontFamily: 'Satoshi, sans-serif',
                background: submitting || submitSuccess ? '#10b981' : 'linear-gradient(135deg, #FDA052 0%, #B96AF7 50%, #3077F3 100%)'
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : submitSuccess ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Idea Submitted!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Submit Idea
                  </>
                )}
              </span>
              {!submitting && !submitSuccess && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#41E6F8] via-[#3077F3] to-[#B96AF7] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
