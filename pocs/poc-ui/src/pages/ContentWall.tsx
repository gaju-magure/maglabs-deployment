
import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Filter, TrendingUp, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    department: string;
  };
  score: number;
  upvotes: number;
  comments: number;
  isUpvoted: boolean;
  submittedDate: Date;
  category: string;
  status: string;
  tags: string[];
}

export const ContentWall = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [ideas, setIdeas] = useState<ContentIdea[]>([
    {
      id: '1',
      title: 'Smart Office Energy Management System',
      description: 'An IoT-based system that automatically adjusts lighting, heating, and cooling based on occupancy patterns and weather conditions, potentially reducing energy costs by 30%.',
      author: {
        name: 'Sarah Chen',
        avatar: '/api/placeholder/40/40',
        department: 'Engineering'
      },
      score: 94,
      upvotes: 28,
      comments: 12,
      isUpvoted: false,
      submittedDate: new Date('2024-05-20'),
      category: 'Sustainability',
      status: 'Under Review',
      tags: ['IoT', 'Energy', 'Cost Savings']
    },
    {
      id: '2',
      title: 'AI-Powered Employee Wellness Platform',
      description: 'A comprehensive platform that uses AI to analyze work patterns and suggest personalized wellness activities, break reminders, and stress management techniques.',
      author: {
        name: 'Marcus Johnson',
        avatar: '/api/placeholder/40/40',
        department: 'HR'
      },
      score: 89,
      upvotes: 22,
      comments: 8,
      isUpvoted: true,
      submittedDate: new Date('2024-05-19'),
      category: 'Wellness',
      status: 'Approved',
      tags: ['AI', 'Wellness', 'Productivity']
    },
    {
      id: '3',
      title: 'Blockchain Supply Chain Transparency',
      description: 'Implement blockchain technology to create an immutable record of our supply chain, providing customers with complete transparency about product origins and ethical sourcing.',
      author: {
        name: 'Emily Rodriguez',
        avatar: '/api/placeholder/40/40',
        department: 'Operations'
      },
      score: 87,
      upvotes: 19,
      comments: 15,
      isUpvoted: false,
      submittedDate: new Date('2024-05-18'),
      category: 'Technology',
      status: 'Under Review',
      tags: ['Blockchain', 'Transparency', 'Ethics']
    },
    {
      id: '4',
      title: 'Virtual Reality Training Modules',
      description: 'Create immersive VR training experiences for high-risk scenarios, reducing training costs and improving safety outcomes for field workers.',
      author: {
        name: 'David Kim',
        avatar: '/api/placeholder/40/40',
        department: 'Training'
      },
      score: 91,
      upvotes: 31,
      comments: 9,
      isUpvoted: true,
      submittedDate: new Date('2024-05-17'),
      category: 'Training',
      status: 'In Development',
      tags: ['VR', 'Safety', 'Training']
    },
    {
      id: '5',
      title: 'Customer Feedback Analysis Bot',
      description: 'An AI bot that analyzes customer feedback across all channels in real-time, identifying trends and urgent issues for immediate attention.',
      author: {
        name: 'Lisa Wang',
        avatar: '/api/placeholder/40/40',
        department: 'Customer Success'
      },
      score: 85,
      upvotes: 16,
      comments: 6,
      isUpvoted: false,
      submittedDate: new Date('2024-05-16'),
      category: 'Customer Service',
      status: 'Under Review',
      tags: ['AI', 'Analytics', 'Customer Service']
    }
  ]);

  const handleUpvote = (ideaId: string) => {
    setIdeas(prevIdeas =>
      prevIdeas.map(idea =>
        idea.id === ideaId
          ? {
              ...idea,
              isUpvoted: !idea.isUpvoted,
              upvotes: idea.isUpvoted ? idea.upvotes - 1 : idea.upvotes + 1
            }
          : idea
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'In Development': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortedIdeas = (sortType: string) => {
    switch (sortType) {
      case 'trending':
        return [...ideas].sort((a, b) => b.upvotes - a.upvotes);
      case 'recent':
        return [...ideas].sort((a, b) => b.submittedDate.getTime() - a.submittedDate.getTime());
      case 'top-rated':
        return [...ideas].sort((a, b) => b.score - a.score);
      default:
        return ideas;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Wall</h1>
            <p className="text-gray-600">Discover and engage with innovative ideas from your colleagues</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trending" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
          <TabsTrigger value="top-rated" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Top Rated</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          {getSortedIdeas('trending').map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} getStatusColor={getStatusColor} />
          ))}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {getSortedIdeas('recent').map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} getStatusColor={getStatusColor} />
          ))}
        </TabsContent>

        <TabsContent value="top-rated" className="space-y-4">
          {getSortedIdeas('top-rated').map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} getStatusColor={getStatusColor} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface IdeaCardProps {
  idea: ContentIdea;
  onUpvote: (ideaId: string) => void;
  getStatusColor: (status: string) => string;
}

const IdeaCard = ({ idea, onUpvote, getStatusColor }: IdeaCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={idea.author.avatar} alt={idea.author.name} />
            <AvatarFallback>{idea.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{idea.title}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  <span className="font-medium">{idea.author.name}</span>
                  <span>•</span>
                  <span>{idea.author.department}</span>
                  <span>•</span>
                  <span>{idea.submittedDate.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(idea.status)}>
                  {idea.status}
                </Badge>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{idea.score}</div>
                  <div className="text-xs text-gray-500">AI Score</div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{idea.description}</p>
            
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="outline">{idea.category}</Badge>
              {idea.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpvote(idea.id)}
                  className={`flex items-center space-x-1 ${
                    idea.isUpvoted ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${idea.isUpvoted ? 'fill-current' : ''}`} />
                  <span>{idea.upvotes}</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500 hover:text-gray-600">
                  <MessageSquare className="h-4 w-4" />
                  <span>{idea.comments}</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500 hover:text-gray-600">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
              
              <div className="w-32">
                <Progress value={idea.score} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
