import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Sparkles, 
  Lightbulb, 
  Settings, 
  Users, 
  TrendingUp,
  HelpCircle,
  Zap,
  CheckCircle,
  ArrowRight,
  Brain,
  Target,
  Rocket
} from 'lucide-react';

interface ChatHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatHelpModal: React.FC<ChatHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="h-6 w-6 text-blue-600" />
            AI Chat Help & Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to effectively use the AI chat system to refine and develop your ideas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-green-600" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">1. Start Chatting</h4>
                    <p className="text-xs text-muted-foreground">
                      Type your idea or question in the message box
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">2. Use Interview Mode</h4>
                    <p className="text-xs text-muted-foreground">
                      Click "Start Interview" for guided idea development
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">3. Submit Ideas</h4>
                    <p className="text-xs text-muted-foreground">
                      Convert refined chats into formal idea submissions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Starter Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose from a variety of templates to kickstart your conversation with AI. Each template provides a focused starting point for different types of discussions.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 How Templates Work:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Provide structured starting prompts for specific scenarios
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Guide the AI to understand your context quickly
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Can be customized after starting the conversation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Choose "General Chat" for open-ended discussions
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Interview Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Interview Mode
                <Badge variant="outline" className="text-xs">Advanced Feature</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Interview Mode provides a structured, multi-stage conversation that guides you through comprehensive idea development.
              </p>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">What Interview Mode Does:</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Asks targeted questions to understand your idea deeply
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Helps identify potential challenges and opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Guides you through business model considerations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Suggests implementation strategies and next steps
                  </li>
                </ul>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Pro Tip:</span>
                <span className="text-muted-foreground">
                  Use Interview Mode when you have a rough idea and want comprehensive development
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Effective Prompting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Writing Effective Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ Good Examples:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      "I want to improve our customer onboarding process. Currently, new users are confused about our pricing tiers."
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      "Our team spends too much time on manual data entry. How can we automate this workflow?"
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      "I have an idea for a mobile app that helps remote teams collaborate better during meetings."
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">❌ Avoid These:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      "Help me" <span className="text-red-600 text-xs">(too vague)</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      "Fix everything" <span className="text-red-600 text-xs">(no specific focus)</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      "Make money fast" <span className="text-red-600 text-xs">(unrealistic expectations)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Conversations:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Be specific about the problem you're trying to solve</li>
                  <li>• Provide context about your role, department, or industry</li>
                  <li>• Mention any constraints or requirements you have</li>
                  <li>• Ask follow-up questions to dive deeper into suggestions</li>
                  <li>• Share your thoughts on the AI's suggestions to get better responses</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Templates & Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                Common Use Cases & Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold text-sm">Process Improvement</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      "Our [process/workflow] takes too long because [specific issue]. How can we streamline this?"
                    </p>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Use Template
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-sm">Customer Experience</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      "Our customers struggle with [specific pain point]. What solutions could improve their experience?"
                    </p>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Use Template
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <h4 className="font-semibold text-sm">New Technology</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      "How could we use [technology] to solve [business challenge] in our [department/industry]?"
                    </p>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Use Template
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-purple-600" />
                      <h4 className="font-semibold text-sm">Product Feature</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      "I want to add [feature description] to our product because [user need/business goal]."
                    </p>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Process */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-600" />
                From Chat to Idea Submission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you've refined your idea through conversation, you can submit it as a formal proposal.
              </p>
              
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Ready to Submit?</h4>
                  <p className="text-sm text-muted-foreground">
                    Look for the "Submit as Idea" button when your conversation has enough detail
                  </p>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Submit as Idea
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <strong>Note:</strong> Submitted ideas will appear on the Content Wall where they can be reviewed, 
                assigned, and tracked through the implementation process.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};