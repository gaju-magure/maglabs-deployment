
import React, { useState } from 'react';
import { Send, Lightbulb, Bot, User, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface IdeaScores {
  clarity: number;
  value: number;
  complexity: number;
  overall: number;
}

export const SubmitIdea = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm here to help you refine your idea. Tell me what problem you're trying to solve or what innovation you have in mind.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ideaScores, setIdeaScores] = useState<IdeaScores | null>(null);
  const [ideaTitle, setIdeaTitle] = useState('');

  const mockAIResponses = [
    "That's an interesting problem! Can you tell me more about who would benefit from this solution?",
    "Great! How do you envision this working technically? What resources would be needed?",
    "Excellent direction! What makes this approach better than existing solutions?",
    "I can see the potential impact. Let me analyze your idea and provide a comprehensive score.",
  ];

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const responseIndex = Math.min(messages.length - 1, mockAIResponses.length - 1);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: mockAIResponses[responseIndex],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);

      // Generate scores after 4th exchange
      if (messages.length >= 6) {
        setTimeout(() => {
          setIdeaScores({
            clarity: 85 + Math.floor(Math.random() * 10),
            value: 80 + Math.floor(Math.random() * 15),
            complexity: 70 + Math.floor(Math.random() * 20),
            overall: 82 + Math.floor(Math.random() * 12)
          });
          setIdeaTitle("AI-Enhanced Customer Support System");
        }, 2000);
      }
    }, 1000 + Math.random() * 2000);
  };

  const handleSubmitIdea = () => {
    // Here you would submit the idea to your backend
    console.log('Submitting idea:', { title: ideaTitle, messages, scores: ideaScores });
    alert('Idea submitted successfully!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Lightbulb className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit New Idea</h1>
          <p className="text-gray-600">Chat with our AI to refine and score your innovation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5" />
                AI Ideation Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'ai' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                        {message.type === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <p className="text-sm">AI is thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your idea or ask a question..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {ideaScores ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{ideaTitle}</h3>
                    <Badge variant="default" className="mb-4">
                      Overall Score: {ideaScores.overall}/100
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Clarity</span>
                        <span>{ideaScores.clarity}%</span>
                      </div>
                      <Progress value={ideaScores.clarity} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Business Value</span>
                        <span>{ideaScores.value}%</span>
                      </div>
                      <Progress value={ideaScores.value} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Complexity</span>
                        <span>{ideaScores.complexity}%</span>
                      </div>
                      <Progress value={ideaScores.complexity} className="h-2" />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmitIdea}
                    className="w-full mt-4"
                  >
                    Submit Idea
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Continue chatting to get your AI analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
