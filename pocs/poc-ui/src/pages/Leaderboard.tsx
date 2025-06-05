
import React, { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  department: string;
  points: number;
  ideasSubmitted: number;
  averageScore: number;
  badges: string[];
  rank: number;
  monthlyRank: number;
  weeklyRank: number;
  trend: 'up' | 'down' | 'same';
}

interface Achievement {
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedBy: number;
}

export const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('overall');

  const leaderboardData: LeaderboardUser[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: '/api/placeholder/40/40',
      department: 'Engineering',
      points: 3420,
      ideasSubmitted: 15,
      averageScore: 91,
      badges: ['AI Whisperer', 'Innovation Pioneer', 'Top Contributor'],
      rank: 1,
      monthlyRank: 1,
      weeklyRank: 2,
      trend: 'up'
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      avatar: '/api/placeholder/40/40',
      department: 'HR',
      points: 3180,
      ideasSubmitted: 12,
      averageScore: 88,
      badges: ['People Champion', 'Collaboration Master'],
      rank: 2,
      monthlyRank: 3,
      weeklyRank: 1,
      trend: 'up'
    },
    {
      id: '3',
      name: 'John Doe',
      avatar: '/api/placeholder/40/40',
      department: 'Product',
      points: 2840,
      ideasSubmitted: 12,
      averageScore: 85,
      badges: ['Innovation Pioneer', 'Problem Solver'],
      rank: 3,
      monthlyRank: 2,
      weeklyRank: 3,
      trend: 'same'
    },
    {
      id: '4',
      name: 'Emily Rodriguez',
      avatar: '/api/placeholder/40/40',
      department: 'Operations',
      points: 2650,
      ideasSubmitted: 10,
      averageScore: 89,
      badges: ['Efficiency Expert', 'Quality Champion'],
      rank: 4,
      monthlyRank: 4,
      weeklyRank: 5,
      trend: 'down'
    },
    {
      id: '5',
      name: 'David Kim',
      avatar: '/api/placeholder/40/40',
      department: 'Training',
      points: 2490,
      ideasSubmitted: 9,
      averageScore: 87,
      badges: ['Knowledge Sharer', 'Mentor'],
      rank: 5,
      monthlyRank: 6,
      weeklyRank: 4,
      trend: 'up'
    },
    {
      id: '6',
      name: 'Lisa Wang',
      avatar: '/api/placeholder/40/40',
      department: 'Customer Success',
      points: 2320,
      ideasSubmitted: 8,
      averageScore: 86,
      badges: ['Customer Champion'],
      rank: 6,
      monthlyRank: 5,
      weeklyRank: 6,
      trend: 'down'
    }
  ];

  const achievements: Achievement[] = [
    {
      name: 'AI Whisperer',
      description: 'Achieved an average AI score of 90+ across 5+ ideas',
      icon: '🤖',
      rarity: 'epic',
      unlockedBy: 3
    },
    {
      name: 'Innovation Pioneer',
      description: 'First to submit an idea in a new category',
      icon: '🚀',
      rarity: 'rare',
      unlockedBy: 12
    },
    {
      name: 'Top Contributor',
      description: 'Ranked #1 on the leaderboard',
      icon: '👑',
      rarity: 'legendary',
      unlockedBy: 1
    },
    {
      name: 'Collaboration Master',
      description: 'Received 50+ upvotes across all ideas',
      icon: '🤝',
      rarity: 'rare',
      unlockedBy: 8
    },
    {
      name: 'Problem Solver',
      description: 'Had 3+ ideas approved for prototype',
      icon: '🧩',
      rarity: 'common',
      unlockedBy: 45
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return null;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-gray-600">See how you rank against your colleagues</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="overall">All Time</TabsTrigger>
                  <TabsTrigger value="monthly">This Month</TabsTrigger>
                  <TabsTrigger value="weekly">This Week</TabsTrigger>
                </TabsList>

                <TabsContent value="overall" className="space-y-4">
                  {leaderboardData.map((user, index) => (
                    <LeaderboardRow 
                      key={user.id} 
                      user={user} 
                      rank={user.rank}
                      getRankIcon={getRankIcon}
                      getTrendIcon={getTrendIcon}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4">
                  {[...leaderboardData].sort((a, b) => a.monthlyRank - b.monthlyRank).map((user) => (
                    <LeaderboardRow 
                      key={user.id} 
                      user={user} 
                      rank={user.monthlyRank}
                      getRankIcon={getRankIcon}
                      getTrendIcon={getTrendIcon}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="weekly" className="space-y-4">
                  {[...leaderboardData].sort((a, b) => a.weeklyRank - b.weeklyRank).map((user) => (
                    <LeaderboardRow 
                      key={user.id} 
                      user={user} 
                      rank={user.weeklyRank}
                      getRankIcon={getRankIcon}
                      getTrendIcon={getTrendIcon}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{achievement.name}</h4>
                        <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Users className="h-3 w-3" />
                        <span>{achievement.unlockedBy} earned</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Your Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Points to #2</span>
                  <span>340 pts</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">#3</div>
                  <div className="text-xs text-gray-500">Current Rank</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">2,840</div>
                  <div className="text-xs text-gray-500">Total Points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface LeaderboardRowProps {
  user: LeaderboardUser;
  rank: number;
  getRankIcon: (rank: number) => React.ReactNode;
  getTrendIcon: (trend: string) => React.ReactNode;
}

const LeaderboardRow = ({ user, rank, getRankIcon, getTrendIcon }: LeaderboardRowProps) => {
  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-center w-12">
        {getRankIcon(rank)}
      </div>
      
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">{user.name}</h3>
          {getTrendIcon(user.trend)}
        </div>
        <p className="text-sm text-gray-500">{user.department}</p>
        <div className="flex items-center space-x-4 mt-1">
          {user.badges.slice(0, 2).map((badge, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="text-right space-y-1">
        <div className="text-lg font-bold text-gray-900">{user.points.toLocaleString()}</div>
        <div className="text-xs text-gray-500">
          {user.ideasSubmitted} ideas • {user.averageScore}% avg
        </div>
      </div>
    </div>
  );
};
