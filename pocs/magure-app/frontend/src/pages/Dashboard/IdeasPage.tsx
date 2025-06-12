
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Filter, BarChart3 } from 'lucide-react';
import { IdeaChat } from '@/components/common/IdeaChat';
import { IdeaDetailModal } from '@/components/common/IdeaDetailModal';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { StatusTransitionButton } from '@/components/common/StatusTransitionButton';
import {
  Idea,
  getIdeasWithFilters,
  getIdeaAnalytics,
  IdeaAnalytics,
} from '@/services/ideasApi';
import {
  IdeaStatus,
  IdeaStatusLabels,
  IdeaPriority,
  IdeaPriorityLabels,
} from '@/enums/ideaStatus';
import { toast } from 'sonner';

export const IdeasPage: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [analytics, setAnalytics] = useState<IdeaAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    assigned_to: '',
  });

  const loadIdeas = async () => {
    try {
      setIsLoading(true);
      const data = await getIdeasWithFilters(filters);
      setIdeas(data);
    } catch (error) {
      console.error('Failed to load ideas:', error);
      toast.error('Failed to load ideas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getIdeaAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdeas(prev => 
      prev.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea)
    );
    setSelectedIdea(updatedIdea);
    loadAnalytics(); // Refresh analytics after status change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      assigned_to: '',
    });
  };

  if (showChat) {
    return (
      <div className="h-full">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowChat(false)}
          >
            ← Back to Ideas
          </Button>
        </div>
        <IdeaChat />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ideas</h1>
          <p className="text-muted-foreground">
            Manage and track ideas across their lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setShowChat(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Idea
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ideas Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.total_ideas}</div>
                <div className="text-sm text-muted-foreground">Total Ideas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.created_by_me}</div>
                <div className="text-sm text-muted-foreground">Created by Me</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.assigned_to_me}</div>
                <div className="text-sm text-muted-foreground">Assigned to Me</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analytics.by_status.approved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">By Status</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <StatusBadge status={status} />
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">By Priority</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.by_priority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <PriorityBadge priority={priority} />
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ideas..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {Object.entries(IdeaStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                {Object.entries(IdeaPriorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.assigned_to}
              onValueChange={(value) => handleFilterChange('assigned_to', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Assignees</SelectItem>
                <SelectItem value="me">Assigned to Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            {(filters.search || filters.status || filters.priority || filters.assigned_to) && (
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ideas List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">Loading ideas...</div>
            </CardContent>
          </Card>
        ) : ideas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">No ideas found</div>
                <Button onClick={() => setShowChat(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first idea
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          ideas.map((idea) => (
            <Card key={idea.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className="font-semibold text-lg cursor-pointer hover:text-primary truncate"
                        onClick={() => setSelectedIdea(idea)}
                      >
                        {idea.title}
                      </h3>
                      {idea.is_pinned && (
                        <Badge variant="secondary">Pinned</Badge>
                      )}
                    </div>

                    {idea.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {idea.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <StatusBadge status={idea.status} />
                      <PriorityBadge priority={idea.priority} />
                      {idea.assigned_to_name && (
                        <Badge variant="outline">
                          Assigned to {idea.assigned_to_name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>By {idea.user_name || idea.user_email}</span>
                      <span>•</span>
                      <span>
                        {new Date(idea.created_at).toLocaleDateString()}
                      </span>
                      {idea.department_name && (
                        <>
                          <span>•</span>
                          <span>{idea.department_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <StatusTransitionButton
                      idea={idea}
                      onStatusUpdate={handleIdeaUpdate}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIdea(idea)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Idea Detail Modal */}
      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          isOpen={!!selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onIdeaUpdate={handleIdeaUpdate}
        />
      )}
    </div>
  );
};
