import React, { useState } from 'react';
import { refineIdea, scoreIdea } from '@/services/ideasApi';
import { IdeaStatus, IdeaStatusLabels } from '@/enums/ideaStatus';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const IdeaChat: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<null | {
    clarity: number;
    creativity: number;
    feasibility: number;
    relevance: number;
  }>(null);

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
    setScores(result);
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-2">Refine Your Idea (AI Chat)</h2>
      <div className="border rounded p-4 bg-white min-h-[200px] space-y-2">
        {messages.length === 0 && (
          <div className="text-gray-500">Start by describing your idea below.</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded px-3 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'}`}>
              <span className="block text-xs text-gray-500 mb-1">{msg.role === 'user' ? 'You' : 'AI'}</span>
              <span>{msg.content}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="Describe your idea or respond to the AI..."
          rows={2}
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !idea.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
      <div>
        <Button variant="outline" onClick={handleScore} disabled={isLoading || !messages.length}>
          Score My Idea
        </Button>
        {scores && (
          <div className="mt-4 space-y-1">
            <div><b>Clarity:</b> {scores.clarity}/10</div>
            <div><b>Creativity:</b> {scores.creativity}/10</div>
            <div><b>Feasibility:</b> {scores.feasibility}/10</div>
            <div><b>Relevance:</b> {scores.relevance}/10</div>
          </div>
        )}
      </div>
    </div>
  );
};
