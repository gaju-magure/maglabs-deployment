
import React, { useState } from 'react';
import { Lightbulb, MessageSquare, Heart, Filter, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Idea {
  id: string;
  title: string;
  description: string;
  score: number;
  status: 'Under Review' | 'Approved for Prototype' | 'In Development' | 'Rejected' | 'Completed';
  clarity: number;
  value: number;
  complexity: number;
  upvotes: number;
  comments: number;
  submittedDate: Date;
  category: string;
}

export const MyIdeas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  const myIdeas: Idea[] = [
    {
      id: '1',
      title: 'AI-Powered Customer Support Chatbot',
      description: 'Implement an AI chatbot that can handle 80% of customer inquiries automatically, reducing response time and improving customer satisfaction.',
      score: 85,
      status: 'Under Review',
      clarity: 90,
      value: 85,
      complexity: 75,
      upvotes: 12,
      comments: 5,
      submittedDate: new Date('2024-05-15'),
      category: 'Technology'
    },
    {
      id: '2',
      title: 'Green Energy Initiative for Office Buildings',
      description: 'Convert office buildings to use solar panels and energy-efficient systems to reduce carbon footprint by 40%.',
      score: 92,
      status: 'Approved for Prototype',
      clarity: 95,
      value: 90,
      complexity: 85,
      upvotes: 18,
      comments: 8,
      submittedDate: new Date('2024-05-10'),
      category: 'Sustainability'
    },
    {
      id: '3',
      title: 'Remote Work Productivity Platform',
      description: 'A comprehensive platform to track and improve remote work productivity with integrated wellness features.',
      score: 78,
      status: 'In Development',
      clarity: 80,
      value: 82,
      complexity: 70,
      upvotes: 7,
      comments: 3,
      submittedDate: new Date('2024-05-05'),
      category: 'Productivity'
    },
    {
      id: '4',
      title: 'Automated Inventory Management System',
      description: 'Use IoT sensors and machine learning to predict inventory needs and automate reordering processes.',
      score: 88,
      status: 'Completed',
      clarity: 85,
      value: 95,
      complexity: 85,
      upvotes: 25,
      comments: 12,
      submittedDate: new Date('2024-04-20'),
      category: 'Operations'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'Approved for Prototype': return 'bg-blue-100 text-blue-800';
      case 'In Development': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIdeas = myIdeas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.score - a.score;
      case 'date': return b.submittedDate.getTime() - a.submittedDate.getTime();
      case 'title': return a.title.localeCompare(b.title);
      default: return 0;
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Lightbulb className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Ideas</h1>
            <p className="text-gray-600">Track and manage your submitted innovations</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ideas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Approved for Prototype">Approved</SelectItem>
              <SelectItem value="In Development">In Development</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{myIdeas.length}</div>
            <div className="text-sm text-gray-500">Total Ideas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {myIdeas.filter(i => i.status === 'Approved for Prototype' || i.status === 'In Development' || i.status === 'Completed').length}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(myIdeas.reduce((sum, idea) => sum + idea.score, 0) / myIdeas.length)}
            </div>
            <div className="text-sm text-gray-500">Avg Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {myIdeas.reduce((sum, idea) => sum + idea.upvotes, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Upvotes</div>
          </CardContent>
        </Card>
      </div>

      {/* Ideas List */}
      <div className="space-y-4">
        {filteredIdeas.map((idea) => (
          <Card key={idea.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                    <Badge className={getStatusColor(idea.status)}>
                      {idea.status}
                    </Badge>
                    <Badge variant="outline">{idea.category}</Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{idea.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {idea.submittedDate.toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {idea.upvotes} upvotes
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {idea.comments} comments
                    </span>
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{idea.score}</div>
                  <div className="text-sm text-gray-500">AI Score</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Clarity</span>
                    <span>{idea.clarity}%</span>
                  </div>
                  <Progress value={idea.clarity} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Value</span>
                    <span>{idea.value}%</span>
                  </div>
                  <Progress value={idea.value} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Complexity</span>
                    <span>{idea.complexity}%</span>
                  </div>
                  <Progress value={idea.complexity} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
