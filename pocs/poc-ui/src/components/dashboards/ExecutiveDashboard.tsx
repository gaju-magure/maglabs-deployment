
import React, { useState } from 'react';
import { TrendingUp, Filter, Download, MessageSquare, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ExecutiveDashboard = () => {
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterScore, setFilterScore] = useState('all');

  const highScoringIdeas = [
    {
      id: 1,
      title: "AI-Powered Predictive Analytics Platform",
      score: 95,
      department: "Technology",
      submitter: "Sarah Chen",
      aiRecommendation: "High feasibility with React/Python stack",
      techStack: ["React", "Python", "TensorFlow", "AWS"],
      feasibilityNote: "Strong technical foundation, recommended for immediate prototyping",
      status: "pending",
      timeline: "3-6 months",
      budget: "$150K - $200K"
    },
    {
      id: 2,
      title: "Sustainable Supply Chain Optimization",
      score: 92,
      department: "Operations",
      submitter: "Mike Rodriguez",
      aiRecommendation: "Medium complexity with high business impact",
      techStack: ["Node.js", "MongoDB", "React", "D3.js"],
      feasibilityNote: "Requires integration with existing ERP systems",
      status: "pending",
      timeline: "6-9 months",
      budget: "$300K - $400K"
    },
    {
      id: 3,
      title: "Employee Wellness Mobile App",
      score: 88,
      department: "HR",
      submitter: "Lisa Wang",
      aiRecommendation: "Low complexity with immediate implementation potential",
      techStack: ["React Native", "Firebase", "Node.js"],
      feasibilityNote: "Can leverage existing infrastructure",
      status: "prototype",
      timeline: "2-4 months",
      budget: "$80K - $120K"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'prototype': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDecision = (ideaId: number, decision: string) => {
    console.log(`Idea ${ideaId} marked as ${decision}`);
    // Implement decision logic
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Review and approve high-potential innovations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Review
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">High-Scoring Ideas</p>
                <p className="text-2xl font-bold text-emerald-900">24</p>
                <p className="text-xs text-emerald-600 mt-1">+12% this month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Pending Review</p>
                <p className="text-2xl font-bold text-blue-900">8</p>
                <p className="text-xs text-blue-600 mt-1">Avg. score: 89</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">In Prototype</p>
                <p className="text-2xl font-bold text-purple-900">5</p>
                <p className="text-xs text-purple-600 mt-1">$2.1M invested</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">ROI Potential</p>
                <p className="text-2xl font-bold text-amber-900">340%</p>
                <p className="text-xs text-amber-600 mt-1">Projected 18mo</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters & Controls
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterScore} onValueChange={setFilterScore}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Score Threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="90+">90+ Score</SelectItem>
                <SelectItem value="80+">80+ Score</SelectItem>
                <SelectItem value="70+">70+ Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* High-Scoring Ideas */}
      <Card>
        <CardHeader>
          <CardTitle>High-Scoring Ideas Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {highScoringIdeas.map((idea) => (
            <div key={idea.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                    <Badge className={getStatusColor(idea.status)}>
                      {idea.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-500">Score:</span>
                      <span className="font-bold text-green-600">{idea.score}/100</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">{idea.submitter}</span> • {idea.department} • {idea.timeline} • {idea.budget}
                  </div>
                  <Progress value={idea.score} className="mb-4" />
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="recommendation">AI Recommendation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Timeline:</strong> {idea.timeline}
                    </div>
                    <div>
                      <strong>Budget:</strong> {idea.budget}
                    </div>
                    <div>
                      <strong>Department:</strong> {idea.department}
                    </div>
                    <div>
                      <strong>Submitter:</strong> {idea.submitter}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="technical" className="mt-4">
                  <div className="space-y-3">
                    <div>
                      <strong className="text-sm">Suggested Tech Stack:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {idea.techStack.map((tech, index) => (
                          <Badge key={index} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong className="text-sm">Feasibility Notes:</strong>
                      <p className="text-sm text-gray-600 mt-1">{idea.feasibilityNote}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="recommendation" className="mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                    <p className="text-sm text-blue-800">{idea.aiRecommendation}</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleDecision(idea.id, 'not-feasible')}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Not Feasible
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDecision(idea.id, 'for-review')}
                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                >
                  For Review
                </Button>
                <Button 
                  onClick={() => handleDecision(idea.id, 'prototype')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve for Prototype
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
