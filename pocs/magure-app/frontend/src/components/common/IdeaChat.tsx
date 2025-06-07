import React, { useState } from 'react';
import { refineIdea, scoreIdea, createIdea } from '@/services/ideasApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProgressBars } from '@/components/common/ProgressBars';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const IdeaChat: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Progress bar state: clarity, value, conciseness (0-100)
  const [progress, setProgress] = useState<{ clarity: number; value: number; conciseness: number }>({
    clarity: 0,
    value: 0,
    conciseness: 0,
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSend = async () => {
    if (!idea.trim()) return;
    setIsLoading(true);
    const newMessages = [...messages, { role: 'user' as const, content: idea }];
    setMessages(newMessages);

    // Call backend for refinement
    const refined = await refineIdea(idea, newMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })));
    setMessages([...newMessages, { role: 'assistant' as const, content: refined }]);
    setIdea('');
    setIsLoading(false);
  };

  const handleScore = async () => {
    if (!messages.length) return;
    setIsLoading(true);
    const lastUserIdea = messages.filter(m => m.role === 'user').slice(-1)[0]?.content;
    if (!lastUserIdea) return;
    const result = await scoreIdea(lastUserIdea);
    // Map backend scores (1-10) to 0-100% for progress bars
    setProgress({
      clarity: Math.round(((result.clarity || 0) / 10) * 100),
      value: Math.round(((result.creativity || 0) / 10) * 100),
      conciseness: Math.round(((result.feasibility || result.relevance || 0) / 10) * 100),
    });
    setIsLoading(false);
  };

  // Submit idea to backend
  const handleSubmitIdea = async () => {
    setSubmitting(true);
    try {
      await createIdea({
        title: messages.filter(m => m.role === 'user')[0]?.content || 'Untitled Idea',
        description: messages.map(m => m.content).join('\n'),
        status: 'open',
      });
      setSubmitSuccess(true);
      setMessages([]);
      setIdea('');
      setProgress({ clarity: 0, value: 0, conciseness: 0 });
    } catch (err) {
      alert('Failed to submit idea');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-0 m-0">
      <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-screen">
        {/* Centered ChatGPT-style prompt */}
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8 mt-24 text-center">What can I help with?</h2>
          {/* Progress Bars */}
          <ProgressBars
            clarity={progress.clarity}
            value={progress.value}
            conciseness={progress.conciseness}
          />
          {/* Chat area */}
          <div className="w-full max-w-2xl flex-1 flex flex-col justify-end">
            <div className="flex-1 flex flex-col justify-end">
              <div className="w-full flex flex-col gap-2">
                {messages.length === 0 && (
                  <div className="text-gray-400 text-center py-12 text-lg">Ask anything</div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-700'}`}>
                      <span>{msg.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Input bar */}
            <div className="w-full flex items-center gap-2 mt-8">
              <Textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Ask anything"
                rows={1}
                className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-2xl px-4 py-3"
                disabled={isLoading || submitting}
                style={{ minHeight: 48, maxHeight: 120 }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !idea.trim() || submitting}
                className="rounded-full bg-gray-200 text-gray-900 px-4 py-3"
                style={{ minWidth: 48, minHeight: 48 }}
              >
                {isLoading ? '...' : (
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>
        {/* Large Submit Button */}
        <div className="w-full flex justify-center mt-8 mb-8">
          <Button
            onClick={handleSubmitIdea}
            disabled={submitting || messages.length === 0}
            className="w-full max-w-md py-4 text-lg font-semibold rounded-2xl bg-gradient-to-r from-blue-600 to-green-500 text-white shadow-lg"
            style={{ minHeight: 56 }}
          >
            {submitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit Idea'}
          </Button>
        </div>
      </div>
    </div>
  );
};
