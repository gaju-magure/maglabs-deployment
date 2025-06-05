
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const AnalyticsDashboard = () => {
  const engagementData = [
    { month: 'Jan', ideas: 45, users: 120 },
    { month: 'Feb', ideas: 52, users: 135 },
    { month: 'Mar', ideas: 61, users: 158 },
    { month: 'Apr', ideas: 58, users: 142 },
    { month: 'May', ideas: 72, users: 189 },
    { month: 'Jun', ideas: 68, users: 176 }
  ];

  const departmentData = [
    { name: 'Technology', value: 35, color: '#3b82f6' },
    { name: 'Operations', value: 25, color: '#8b5cf6' },
    { name: 'Marketing', value: 20, color: '#10b981' },
    { name: 'HR', value: 12, color: '#f59e0b' },
    { name: 'Finance', value: 8, color: '#ef4444' }
  ];

  const scoreDistribution = [
    { range: '90-100', count: 12 },
    { range: '80-89', count: 28 },
    { range: '70-79', count: 35 },
    { range: '60-69', count: 18 },
    { range: '50-59', count: 7 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="ideas" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Ideas Submitted"
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ideas by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
