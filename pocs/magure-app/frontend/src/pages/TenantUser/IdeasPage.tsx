
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Send, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'Open' | 'In Review' | 'Closed';
  submittedAt: string;
  submitter: string;
}

export const IdeasPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  
  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: '1',
      title: 'Implement Dark Mode',
      description: 'Add a dark mode toggle to improve user experience during night time usage.',
      category: 'UI/UX',
      status: 'In Review',
      submittedAt: '2024-01-15',
      submitter: 'John User'
    },
    {
      id: '2',
      title: 'Mobile App Development',
      description: 'Create a mobile application to complement the web dashboard for on-the-go access.',
      category: 'Feature',
      status: 'Open',
      submittedAt: '2024-01-10',
      submitter: 'John User'
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newIdea: Idea = {
      id: Date.now().toString(),
      ...formData,
      status: 'Open',
      submittedAt: new Date().toISOString().split('T')[0],
      submitter: 'John User'
    };

    setIdeas([newIdea, ...ideas]);
    setFormData({ title: '', description: '', category: '' });
    
    toast({
      title: "Success",
      description: "Your idea has been submitted successfully!",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'In Review': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Lightbulb className="h-8 w-8 text-yellow-500" />
        <h1 className="text-3xl font-bold text-gray-900">Idea Submission</h1>
      </div>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit New Idea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title for your idea"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => 
                  setFormData({ ...formData, category: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feature">New Feature</SelectItem>
                    <SelectItem value="UI/UX">UI/UX Improvement</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Integration">Integration</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your idea in detail..."
                rows={6}
                required
              />
            </div>
            
            <Button type="submit" className="w-full md:w-auto">
              <Send className="h-4 w-4 mr-2" />
              Submit Idea
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ideas List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">My Submitted Ideas</h2>
        
        {ideas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No ideas submitted yet. Share your first idea above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {ideas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                    <Badge className={getStatusColor(idea.status)}>
                      {idea.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Category: {idea.category}</span>
                    <span>•</span>
                    <span>Submitted: {idea.submittedAt}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{idea.description}</p>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
