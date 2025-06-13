import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, Plus, Sparkles, Lightbulb, Settings, Briefcase, Users, TrendingUp, Zap, Globe, Recycle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createChatSession, getChatTemplates, ChatTemplate } from '@/services/chatApi';

interface EmptyChatProps {
  onNewChat: (sessionId: string) => void;
}

interface TemplateWithIcon extends ChatTemplate {
  icon: React.ReactNode;
  color: string;
}

const getIconForTemplate = (name: string): { icon: React.ReactNode; color: string } => {
  const nameLC = name.toLowerCase();
  
  if (nameLC.includes('product') || nameLC.includes('feature')) {
    return { icon: <Lightbulb className="w-4 h-4" />, color: 'blue' };
  } else if (nameLC.includes('process') || nameLC.includes('improvement')) {
    return { icon: <Settings className="w-4 h-4" />, color: 'green' };
  } else if (nameLC.includes('customer') || nameLC.includes('experience')) {
    return { icon: <Users className="w-4 h-4" />, color: 'purple' };
  } else if (nameLC.includes('cost') || nameLC.includes('reduction')) {
    return { icon: <TrendingUp className="w-4 h-4" />, color: 'red' };
  } else if (nameLC.includes('technology') || nameLC.includes('innovation')) {
    return { icon: <Zap className="w-4 h-4" />, color: 'yellow' };
  } else if (nameLC.includes('marketing') || nameLC.includes('campaign')) {
    return { icon: <Globe className="w-4 h-4" />, color: 'indigo' };
  } else if (nameLC.includes('employee') || nameLC.includes('engagement')) {
    return { icon: <Users className="w-4 h-4" />, color: 'pink' };
  } else if (nameLC.includes('sustainability') || nameLC.includes('environment')) {
    return { icon: <Recycle className="w-4 h-4" />, color: 'emerald' };
  } else if (nameLC.includes('digital') || nameLC.includes('transformation')) {
    return { icon: <Briefcase className="w-4 h-4" />, color: 'cyan' };
  } else if (nameLC.includes('refine') || nameLC.includes('polish')) {
    return { icon: <Sparkles className="w-4 h-4" />, color: 'violet' };
  } else {
    return { icon: <MessageSquare className="w-4 h-4" />, color: 'blue' };
  }
};

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
  const [templates, setTemplates] = useState<TemplateWithIcon[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const fetchedTemplates = await getChatTemplates();
        const templatesWithIcons = fetchedTemplates.map(template => {
          const { icon, color } = getIconForTemplate(template.name);
          return { ...template, icon, color };
        });
        setTemplates(templatesWithIcons);
      } catch (error) {
        console.error('Failed to load templates:', error);
        toast.error('Failed to load chat templates');
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  const createSessionMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (newSession) => {
      console.log('Chat session created in EmptyChat:', newSession);
      
      if (!newSession || !newSession.id) {
        console.error('Session creation succeeded but no valid session ID returned:', newSession);
        toast.error('Failed to create chat session - invalid response from server');
        return;
      }
      
      onNewChat(newSession.id);
    },
    onError: (error) => {
      console.error('Failed to create chat session:', error);
      toast.error('Failed to create chat session. Please try again.');
    },
  });
  
  const handleCreateBasicChat = (title: string, initialPrompt?: string) => {
    createSessionMutation.mutate({
      title,
      initial_message: initialPrompt,
    });
  };

  const handleTemplateSelect = (template: ChatTemplate) => {
    createSessionMutation.mutate({
      title: template.name,
      template_id: template.id,
      initial_message: template.initial_prompt,
    });
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
            onClick={() => handleCreateBasicChat('Brainstorming Session', "I'd like to brainstorm some creative ideas. Can you help me explore innovative solutions?")}
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
            onClick={() => handleCreateBasicChat('Idea Refinement', "I have a rough idea that I'd like to develop further. Can you help me refine it?")}
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
            onClick={() => handleCreateBasicChat('Problem Solving', "I need help analyzing and solving a problem systematically. Can you guide me through this?")}
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
            onClick={() => handleCreateBasicChat('General Chat')}
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
          {loading ? (
            <div className="text-gray-500">Loading templates...</div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const colors = getColorClasses(template.color);
                return (
                  <div
                    key={template.id}
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
                          Template
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
          ) : (
            <div className="text-gray-500">No templates available</div>
          )}
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