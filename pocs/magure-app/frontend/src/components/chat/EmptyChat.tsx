import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, Plus, Sparkles, Lightbulb, Settings, Briefcase, Users, TrendingUp, Zap, Globe, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createChatSession } from '@/services/chatApi';

interface EmptyChatProps {
  onNewChat: (sessionId: string) => void;
}

interface ChatTemplate {
  name: string;
  description: string;
  conversation_type: 'brainstorm' | 'refine' | 'general' | 'problem_solving' | 'feature_design';
  initial_prompt: string;
  icon: React.ReactNode;
  color: string;
}

const CHAT_TEMPLATES: ChatTemplate[] = [
  {
    name: 'New Product Feature',
    description: 'Brainstorm innovative features for existing products or services',
    conversation_type: 'brainstorm',
    initial_prompt: "I'd like to brainstorm new features for our product/service. Can you help me explore creative ideas that could improve user experience or add value?",
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'blue'
  },
  {
    name: 'Process Improvement',
    description: 'Generate ideas to streamline and improve existing workflows',
    conversation_type: 'problem_solving',
    initial_prompt: "I want to improve our current processes and workflows. Can you help me identify inefficiencies and brainstorm solutions?",
    icon: <Settings className="w-4 h-4" />,
    color: 'green'
  },
  {
    name: 'Customer Experience',
    description: 'Develop ideas to improve customer satisfaction and engagement',
    conversation_type: 'brainstorm',
    initial_prompt: "How can we enhance our customer experience? I'd like to explore ideas that make our customers happier and more engaged.",
    icon: <Users className="w-4 h-4" />,
    color: 'purple'
  },
  {
    name: 'Cost Reduction',
    description: 'Identify opportunities to reduce costs without compromising quality',
    conversation_type: 'problem_solving',
    initial_prompt: "I need to find ways to reduce costs in our operations. Can you help me identify areas where we might be overspending or inefficient?",
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'red'
  },
  {
    name: 'Technology Innovation',
    description: 'Explore how emerging technologies could benefit the organization',
    conversation_type: 'brainstorm',
    initial_prompt: "What emerging technologies could we leverage to stay competitive? I want to explore innovative tech solutions for our business.",
    icon: <Zap className="w-4 h-4" />,
    color: 'yellow'
  },
  {
    name: 'Marketing Campaign',
    description: 'Develop creative marketing strategies and campaign concepts',
    conversation_type: 'brainstorm',
    initial_prompt: "I need fresh marketing ideas for our upcoming campaign. Can you help me brainstorm creative approaches to reach our target audience?",
    icon: <Globe className="w-4 h-4" />,
    color: 'indigo'
  },
  {
    name: 'Employee Engagement',
    description: 'Create ideas to boost employee satisfaction and retention',
    conversation_type: 'brainstorm',
    initial_prompt: "What initiatives could we implement to improve employee engagement and satisfaction? I want to create a better workplace culture.",
    icon: <Users className="w-4 h-4" />,
    color: 'pink'
  },
  {
    name: 'Sustainability Initiative',
    description: 'Develop environmentally friendly business practices',
    conversation_type: 'brainstorm',
    initial_prompt: "How can we make our organization more sustainable and environmentally friendly? I'm looking for practical green initiatives we could implement.",
    icon: <Recycle className="w-4 h-4" />,
    color: 'emerald'
  },
  {
    name: 'Digital Transformation',
    description: 'Modernize business processes through digital solutions',
    conversation_type: 'feature_design',
    initial_prompt: "We need to digitally transform our business processes. Can you help me identify areas where digital solutions could make the biggest impact?",
    icon: <Briefcase className="w-4 h-4" />,
    color: 'cyan'
  },
  {
    name: 'Idea Refinement',
    description: 'Polish and develop an existing idea into a concrete proposal',
    conversation_type: 'refine',
    initial_prompt: "I have a rough idea that I'd like to develop further. Can you help me refine it and turn it into a more detailed, actionable proposal?",
    icon: <Sparkles className="w-4 h-4" />,
    color: 'violet'
  }
];

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: 'text-indigo-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', icon: 'text-pink-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-600' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', icon: 'text-cyan-600' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', icon: 'text-violet-600' },
  };
  return colorMap[color] || colorMap.blue;
};

export const EmptyChat: React.FC<EmptyChatProps> = ({ onNewChat }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ChatTemplate | null>(null);
  
  const createSessionMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (newSession) => {
      onNewChat(newSession.id);
    },
  });
  
  const handleCreateChat = (type: string, title: string, initialPrompt?: string) => {
    createSessionMutation.mutate({
      title,
      conversation_type: type as any,
      initial_message: initialPrompt,
    });
  };

  const handleTemplateSelect = (template: ChatTemplate) => {
    handleCreateChat(template.conversation_type, template.name, template.initial_prompt);
  };
  
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="max-w-6xl mx-auto text-center px-4 py-8">
        <div className="mb-8">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to AI Chat
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Start a conversation to brainstorm, refine, and develop your ideas with AI assistance.
          </p>
          <Badge variant="secondary" className="mb-6">
            Choose a template to get started or create a custom session
          </Badge>
        </div>
        
        {/* Quick Start Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-auto p-4 text-left"
            onClick={() => handleCreateChat('brainstorm', 'Brainstorming Session')}
            disabled={createSessionMutation.isPending}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Brainstorming</div>
                <div className="text-xs text-gray-500">Generate new ideas</div>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto p-4 text-left"
            onClick={() => handleCreateChat('refine', 'Idea Refinement')}
            disabled={createSessionMutation.isPending}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Refine Ideas</div>
                <div className="text-xs text-gray-500">Polish existing ideas</div>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto p-4 text-left"
            onClick={() => handleCreateChat('problem_solving', 'Problem Solving')}
            disabled={createSessionMutation.isPending}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Problem Solving</div>
                <div className="text-xs text-gray-500">Find solutions</div>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto p-4 text-left"
            onClick={() => handleCreateChat('general', 'General Chat')}
            disabled={createSessionMutation.isPending}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">General Chat</div>
                <div className="text-xs text-gray-500">Open conversation</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Template Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Template Library</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHAT_TEMPLATES.map((template, index) => {
              const colors = getColorClasses(template.color);
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left cursor-pointer group"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <span className={colors.icon}>{template.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {template.name}
                      </h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {template.conversation_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      disabled={createSessionMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start Session
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
          <p className="text-sm text-blue-800">
            Templates provide guided conversations with specific prompts. Use interview mode for comprehensive idea development with multi-stage expert analysis.
          </p>
        </div>
      </div>
    </div>
  );
};