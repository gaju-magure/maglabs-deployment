
import React from 'react';
import { Plus, TrendingUp, Award, Lightbulb, MessageSquare, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadarChart } from '@/components/charts/RadarChart';

export const EmployeeDashboard = () => {
  const recentIdeas = [
    {
      id: 1,
      title: "AI-Powered Customer Support Chatbot",
      score: 85,
      status: "Under Review",
      clarity: 90,
      value: 85,
      complexity: 75,
      upvotes: 12,
      comments: 5
    },
    {
      id: 2,
      title: "Green Energy Initiative for Office Buildings",
      score: 92,
      status: "Approved for Prototype",
      clarity: 95,
      value: 90,
      complexity: 85,
      upvotes: 18,
      comments: 8
    }
  ];

  const badges = [
    { name: "AI Whisperer", icon: "🤖", earned: true },
    { name: "Innovation Pioneer", icon: "🚀", earned: true },
    { name: "Collaboration Master", icon: "🤝", earned: false },
    { name: "Problem Solver", icon: "🧩", earned: true }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, John! 👋</h1>
          <p className="text-gray-600 mt-1">Ready to spark some innovation today?</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Submit New Idea
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Ideas Submitted</p>
                <p className="text-2xl font-bold text-blue-900">12</p>
              </div>
              <Lightbulb className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Points</p>
                <p className="text-2xl font-bold text-green-900">2,840</p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Rank</p>
                <p className="text-2xl font-bold text-purple-900">#3</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Badges</p>
                <p className="text-2xl font-bold text-orange-900">4/8</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ideas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5" />
                Your Recent Ideas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentIdeas.map((idea) => (
                <div key={idea.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                    <Badge variant={idea.status === "Approved for Prototype" ? "default" : "secondary"}>
                      {idea.status}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>AI Score: {idea.score}/100</span>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {idea.upvotes}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {idea.comments}
                        </span>
                      </div>
                    </div>
                    <Progress value={idea.score} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-gray-500">Clarity</div>
                      <div className="font-semibold">{idea.clarity}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Value</div>
                      <div className="font-semibold">{idea.value}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Complexity</div>
                      <div className="font-semibold">{idea.complexity}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Achievements & Radar Chart */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {badges.map((badge, index) => (
                <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${badge.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <div className={`font-medium ${badge.earned ? 'text-yellow-800' : 'text-gray-500'}`}>
                      {badge.name}
                    </div>
                    {badge.earned && <div className="text-xs text-yellow-600">Earned!</div>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Scoring Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <RadarChart 
                data={[
                  { metric: 'Clarity', value: 85 },
                  { metric: 'Value', value: 92 },
                  { metric: 'Complexity', value: 78 },
                  { metric: 'Feasibility', value: 80 },
                  { metric: 'Innovation', value: 95 }
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
