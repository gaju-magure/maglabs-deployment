import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pin, Loader2, Sparkles, Clock, User, Heart, Search, X, Building2, Briefcase, Filter, BarChart3 } from 'lucide-react';
import { getContentWallIdeas, toggleIdeaPin, likeIdea, unlikeIdea, getIdeaAnalytics, type Idea, type IdeaAnalytics } from '@/services/ideasApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { IdeaDetailModal } from '@/components/common/IdeaDetailModal';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  IdeaStatus,
  IdeaStatusLabels,
  IdeaPriority,
  IdeaPriorityLabels,
  IdeaStickyNoteColors,
  IdeaStickyNoteRotations,
  IdeaStickyNoteShadows,
} from '@/enums/ideaStatus';

export const ContentWallPage: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);
  const [likingIdea, setLikingIdea] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>();
  const [analytics, setAnalytics] = useState<IdeaAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is admin (can pin/unpin ideas and see filters)
  const isAdmin = user?.role === 'superadmin' || user?.role === 'tenant_admin';

  // Get sticky-note styling for an idea
  const getStickyNoteStyle = (idea: Idea, index: number) => {
    const statusStyle = IdeaStickyNoteColors[idea.status as IdeaStatus] || IdeaStickyNoteColors[IdeaStatus.Submitted];
    const rotation = IdeaStickyNoteRotations[index % IdeaStickyNoteRotations.length];
    const shadow = idea.is_pinned ? IdeaStickyNoteShadows.pinned : IdeaStickyNoteShadows.default;
    
    return {
      backgroundClass: statusStyle,
      rotationClass: rotation,
      shadowClass: shadow,
      hoverShadow: IdeaStickyNoteShadows.hover,
    };
  };

  // Calculate department statistics
  const getDepartmentStats = () => {
    const departmentCounts: { [key: string]: number } = {};
    const departmentNames: { [key: string]: string } = {};
    
    ideas.forEach(idea => {
      if (idea.department_name) {
        const key = idea.department_name;
        departmentCounts[key] = (departmentCounts[key] || 0) + 1;
        departmentNames[key] = idea.department_name;
      }
    });
    
    return Object.entries(departmentCounts).map(([name, count]) => ({
      id: name,
      name,
      count
    }));
  };

  // Calculate role statistics
  const getRoleStats = () => {
    const roleCounts: { [key: string]: number } = {};
    const roleNames: { [key: string]: string } = {};
    
    ideas.forEach(idea => {
      if (idea.custom_role_name) {
        const key = idea.custom_role_name;
        roleCounts[key] = (roleCounts[key] || 0) + 1;
        roleNames[key] = idea.custom_role_name;
      }
    });
    
    return Object.entries(roleCounts).map(([name, count]) => ({
      id: name,
      name,
      count
    }));
  };

  // Helper functions
  const getDepartmentName = (id: string) => {
    const departments = getDepartmentStats();
    return departments.find(d => d.id === id)?.name;
  };

  const getRoleName = (id: string) => {
    const roles = getRoleStats();
    return roles.find(r => r.id === id)?.name;
  };

  // Filter ideas based on search query, department, and role
  const filteredIdeas = ideas.filter(idea => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        idea.title.toLowerCase().includes(query) ||
        idea.description.toLowerCase().includes(query) ||
        idea.user_email.toLowerCase().includes(query) ||
        idea.user_name?.toLowerCase().includes(query) ||
        idea.department_name?.toLowerCase().includes(query) ||
        idea.custom_role_name?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Department filter (only for admins)
    if (isAdmin && selectedDepartment) {
      if (!idea.department_name || idea.department_name !== getDepartmentName(selectedDepartment)) {
        return false;
      }
    }
    
    // Role filter (only for admins)
    if (isAdmin && selectedRole) {
      if (!idea.custom_role_name || idea.custom_role_name !== getRoleName(selectedRole)) {
        return false;
      }
    }
    
    // Status filter (only for admins)
    if (isAdmin && selectedStatus && selectedStatus !== 'all') {
      if (idea.status !== selectedStatus) {
        return false;
      }
    }
    
    // Priority filter (only for admins)
    if (isAdmin && selectedPriority && selectedPriority !== 'all') {
      if (idea.priority !== selectedPriority) {
        return false;
      }
    }
    
    return true;
  });

  // Load analytics for admins
  const loadAnalytics = async () => {
    if (!isAdmin) return;
    try {
      const data = await getIdeaAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Load content wall ideas on mount and when filters change
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        setLoading(true);
        
        // Build query parameters (only for admins)
        const params = new URLSearchParams();
        if (isAdmin) {
          if (selectedDepartment) params.append('department', selectedDepartment);
          if (selectedRole) params.append('role', selectedRole);
          if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
          if (selectedPriority && selectedPriority !== 'all') params.append('priority', selectedPriority);
        }
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        
        const data = await getContentWallIdeas(params.toString());
        setIdeas(data);
        setError(null);
      } catch (err) {
        setError('Failed to load ideas');
        toast({
          title: "Error",
          description: "Failed to load content wall ideas",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(loadIdeas, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [toast, selectedDepartment, selectedRole, selectedStatus, selectedPriority, searchQuery, isAdmin]);

  // Load analytics on mount for admins
  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin]);

  const handleTogglePin = async (id: string) => {
    try {
      setTogglingPin(id);
      const updatedIdea = await toggleIdeaPin(id);
      
      // Update the idea in the local state
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === id ? updatedIdea : idea
        )
      );

      toast({
        title: "Success",
        description: `Idea ${updatedIdea.is_pinned ? 'pinned' : 'unpinned'} successfully`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to toggle pin status",
        variant: "destructive",
      });
    } finally {
      setTogglingPin(null);
    }
  };

  const handleLikeIdea = async (id: string, currentlyLiked: boolean) => {
    try {
      setLikingIdea(id);
      
      const response = currentlyLiked 
        ? await unlikeIdea(id)
        : await likeIdea(id);
      
      // Update the idea in the local state
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === id ? response.idea : idea
        )
      );

      toast({
        title: "Success",
        description: response.message,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${currentlyLiked ? 'unlike' : 'like'} idea`,
        variant: "destructive",
      });
    } finally {
      setLikingIdea(null);
    }
  };

  const handleIdeaClick = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIdea(null);
  };

  const handleModalLike = async (id: string, currentlyLiked: boolean) => {
    await handleLikeIdea(id, currentlyLiked);
    // Update the selected idea if it's the one being liked
    if (selectedIdea && selectedIdea.id === id) {
      const updatedIdea = ideas.find(idea => idea.id === id);
      if (updatedIdea) {
        setSelectedIdea(updatedIdea);
      }
    }
  };

  const handleModalPin = async (id: string) => {
    await handleTogglePin(id);
    // Update the selected idea if it's the one being pinned
    if (selectedIdea && selectedIdea.id === id) {
      const updatedIdea = ideas.find(idea => idea.id === id);
      if (updatedIdea) {
        setSelectedIdea(updatedIdea);
      }
    }
  };

  const handleStatusUpdate = (updatedIdea: Idea) => {
    // Update the idea in the local state
    setIdeas(prevIdeas => 
      prevIdeas.map(idea => 
        idea.id === updatedIdea.id ? updatedIdea : idea
      )
    );
    
    // Update the selected idea if it's the one being updated
    if (selectedIdea && selectedIdea.id === updatedIdea.id) {
      setSelectedIdea(updatedIdea);
    }
    
    // Refresh analytics for admins
    if (isAdmin) {
      loadAnalytics();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuthorInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="flex items-center justify-center animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text animate-spin" />
            </div>
          </div>
        </div>
        <span className="text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>Loading ideas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center animate-in slide-in-from-bottom duration-300">
          <p className="text-red-600 mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200"
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-4 sm:hidden animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Ideas Wall
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Discover and explore refined ideas from your team
                </p>
              </div>
            </div>
            
            {/* Mobile Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search ideas, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between gap-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Ideas Wall
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Discover and explore refined ideas from your team
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Analytics Button - Admin Only */}
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="flex items-center gap-2"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              )}
              
              {/* Desktop Search Bar */}
              <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search ideas, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Only visible for admins */}
        {isAdmin && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="space-y-4">
              {/* Department and Role Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                </div>
                
                {/* Department Filter */}
                {getDepartmentStats().length > 0 && (
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {getDepartmentStats().map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Role Filter */}
                {getRoleStats().length > 0 && (
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {getRoleStats().map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name} ({role.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(IdeaStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.entries(IdeaPriorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {(selectedDepartment || selectedRole || (selectedStatus && selectedStatus !== 'all') || (selectedPriority && selectedPriority !== 'all')) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(undefined);
                      setSelectedRole(undefined);
                      setSelectedStatus(undefined);
                      setSelectedPriority(undefined);
                    }}
                    className="text-sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Dashboard - Admin Only */}
        {isAdmin && showAnalytics && analytics && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  <BarChart3 className="h-5 w-5" />
                  Ideas Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Satoshi, sans-serif' }}>{analytics.total_ideas}</div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Satoshi, sans-serif' }}>Total Ideas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Satoshi, sans-serif' }}>{analytics.created_by_me}</div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Satoshi, sans-serif' }}>Created by Me</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Satoshi, sans-serif' }}>{analytics.assigned_to_me}</div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Satoshi, sans-serif' }}>Assigned to Me</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {analytics.by_status.approved || 0}
                    </div>
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: 'Satoshi, sans-serif' }}>Approved</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>By Status</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.by_status).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <StatusBadge status={status} />
                          <span className="font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>By Priority</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.by_priority).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <PriorityBadge priority={priority} />
                          <span className="font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {ideas.length === 0 ? (
          <div className="text-center py-16 animate-in slide-in-from-bottom duration-500">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              No refined ideas yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Ideas submitted through the idea chat will appear here. Start sharing your innovative thoughts!
            </p>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-16 animate-in slide-in-from-bottom duration-500">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-gradient-to-br from-[#FDA052] via-[#B96AF7] via-[#3077F3] to-[#41E6F8] p-[2px]">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <Search className="w-12 h-12 text-transparent bg-gradient-to-br from-[#FDA052] via-[#B96AF7] to-[#3077F3] bg-clip-text" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              No ideas found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              No ideas match your search "{searchQuery}". Try different keywords or browse all ideas.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="mt-4"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div>
            {/* Search Results Count */}
            {searchQuery && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Found {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </div>
            )}
            
            {/* Two Column Sticky Note Board Layout */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Left Column */}
              <div className="flex-1 space-y-6">
                {filteredIdeas.filter((_, index) => index % 2 === 0).map((idea, originalIndex) => {
                  const actualIndex = filteredIdeas.findIndex(i => i.id === idea.id);
                  const stickyStyle = getStickyNoteStyle(idea, actualIndex);
                  return (
                    <Card 
                      key={idea.id} 
                      className={`w-full relative overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom cursor-pointer group border-2 ${
                        stickyStyle.backgroundClass
                      } ${
                        stickyStyle.rotationClass
                      } ${
                        stickyStyle.shadowClass
                      } hover:${stickyStyle.hoverShadow} hover:scale-105 hover:rotate-0 hover:z-10`}
                      style={{ 
                        animationDelay: `${actualIndex * 50}ms`,
                        fontFamily: 'Satoshi, sans-serif',
                        transformOrigin: 'center center',
                      }}
                      onClick={() => handleIdeaClick(idea)}
                    >
                    {idea.is_pinned && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <div className="relative">
                          {/* Pushpin shadow */}
                          <div className="absolute top-1 left-1 w-6 h-6 bg-gray-800/20 rounded-full blur-sm"></div>
                          {/* Pushpin body */}
                          <div className="w-6 h-6 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full shadow-lg border-2 border-red-800 transform rotate-12">
                            <div className="absolute inset-1 bg-gradient-to-br from-red-300 to-red-400 rounded-full"></div>
                            {/* Pushpin needle */}
                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-gray-600 shadow-sm"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-12 h-12 ring-2 ring-offset-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all duration-300">
                            {idea.user_profile?.profile_avatar ? (
                              <AvatarImage 
                                src={idea.user_profile.profile_avatar} 
                                alt={idea.user_name || idea.user_email}
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                              {getAuthorInitials(idea.user_email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-bold text-current mb-2 line-clamp-2 drop-shadow-sm">
                              {idea.title}
                            </CardTitle>
                            
                            {/* Author and Job Title */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-current opacity-90">
                                {idea.user_name || idea.user_email.split('@')[0]}
                              </span>
                              {idea.user_profile?.job_title && (
                                <>
                                  <span className="text-current opacity-60">•</span>
                                  <span className="text-sm text-current opacity-80">
                                    {idea.user_profile.job_title}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Department and Role Badges */}
                            <div className="flex flex-wrap items-center gap-1 mb-2">
                              {idea.department_name && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                                  <Building2 className="w-2.5 h-2.5 mr-1" />
                                  {idea.department_name}
                                </Badge>
                              )}
                              {idea.custom_role_name && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                                  <Briefcase className="w-2.5 h-2.5 mr-1" />
                                  {idea.custom_role_name}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Meta Information */}
                            <div className="flex items-center gap-2 text-xs text-current opacity-80">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{getRelativeTime(idea.created_at)}</span>
                              </div>
                              
                              {/* Status Badge */}
                              <Badge 
                                variant="outline" 
                                className="text-xs capitalize bg-green-100 text-green-800 border-green-200 px-1.5 py-0.5"
                              >
                                {IdeaStatusLabels[idea.status as keyof typeof IdeaStatusLabels] || idea.status}
                              </Badge>
                              
                              {idea.priority && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs capitalize bg-orange-100 text-orange-800 border-orange-200 px-1.5 py-0.5"
                                >
                                  {IdeaPriorityLabels[idea.priority as keyof typeof IdeaPriorityLabels] || idea.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(idea.id);
                            }}
                            disabled={togglingPin === idea.id}
                            className={`ml-2 transition-all duration-200 rounded-full w-8 h-8 p-0 backdrop-blur-sm ${
                              idea.is_pinned 
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-300' 
                                : 'bg-white/50 hover:bg-white/70 text-gray-600 hover:text-red-600 border border-gray-300'
                            }`}
                            title={idea.is_pinned ? 'Unpin idea' : 'Pin idea'}
                          >
                            {togglingPin === idea.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Pin className={`w-3 h-3 ${idea.is_pinned ? 'fill-current' : ''}`} />
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-current opacity-90 leading-relaxed line-clamp-2 mb-3 text-sm font-medium">
                        {idea.description}
                      </p>
                      
                      {/* Engagement Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-current/20">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeIdea(idea.id, idea.is_liked);
                            }}
                            disabled={likingIdea === idea.id}
                            className={`flex items-center gap-1 h-7 px-2 transition-all duration-200 rounded-full backdrop-blur-sm ${
                              idea.is_liked 
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-300' 
                                : 'bg-white/50 hover:bg-white/70 text-gray-600 hover:text-red-600 border border-gray-300'
                            }`}
                          >
                            {likingIdea === idea.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Heart className={`w-3 h-3 transition-all duration-200 ${idea.is_liked ? 'fill-current' : ''}`} />
                            )}
                            <span className="text-xs font-medium">{idea.like_count || 0}</span>
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs bg-white/50 hover:bg-white/70 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full px-3 h-7 transition-all duration-200 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIdeaClick(idea);
                          }}
                        >
                          View Details →
                        </Button>
                      </div>
                    </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Right Column */}
              <div className="flex-1 space-y-6">
                {filteredIdeas.filter((_, index) => index % 2 === 1).map((idea, originalIndex) => {
                  const actualIndex = filteredIdeas.findIndex(i => i.id === idea.id);
                  const stickyStyle = getStickyNoteStyle(idea, actualIndex);
                  return (
                    <Card 
                      key={idea.id} 
                      className={`w-full relative overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom cursor-pointer group border-2 ${
                        stickyStyle.backgroundClass
                      } ${
                        stickyStyle.rotationClass
                      } ${
                        stickyStyle.shadowClass
                      } hover:${stickyStyle.hoverShadow} hover:scale-105 hover:rotate-0 hover:z-10`}
                      style={{ 
                        animationDelay: `${actualIndex * 50}ms`,
                        fontFamily: 'Satoshi, sans-serif',
                        transformOrigin: 'center center',
                      }}
                      onClick={() => handleIdeaClick(idea)}
                    >
                    {idea.is_pinned && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <div className="relative">
                          {/* Pushpin shadow */}
                          <div className="absolute top-1 left-1 w-6 h-6 bg-gray-800/20 rounded-full blur-sm"></div>
                          {/* Pushpin body */}
                          <div className="w-6 h-6 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full shadow-lg border-2 border-red-800 transform rotate-12">
                            <div className="absolute inset-1 bg-gradient-to-br from-red-300 to-red-400 rounded-full"></div>
                            {/* Pushpin needle */}
                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-gray-600 shadow-sm"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-12 h-12 ring-2 ring-offset-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all duration-300">
                            {idea.user_profile?.profile_avatar ? (
                              <AvatarImage 
                                src={idea.user_profile.profile_avatar} 
                                alt={idea.user_name || idea.user_email}
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                              {getAuthorInitials(idea.user_email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-bold text-current mb-2 line-clamp-2 drop-shadow-sm">
                              {idea.title}
                            </CardTitle>
                            
                            {/* Author and Job Title */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-current opacity-90">
                                {idea.user_name || idea.user_email.split('@')[0]}
                              </span>
                              {idea.user_profile?.job_title && (
                                <>
                                  <span className="text-current opacity-60">•</span>
                                  <span className="text-sm text-current opacity-80">
                                    {idea.user_profile.job_title}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Department and Role Badges */}
                            <div className="flex flex-wrap items-center gap-1 mb-2">
                              {idea.department_name && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                                  <Building2 className="w-2.5 h-2.5 mr-1" />
                                  {idea.department_name}
                                </Badge>
                              )}
                              {idea.custom_role_name && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                                  <Briefcase className="w-2.5 h-2.5 mr-1" />
                                  {idea.custom_role_name}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Meta Information */}
                            <div className="flex items-center gap-2 text-xs text-current opacity-80">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{getRelativeTime(idea.created_at)}</span>
                              </div>
                              
                              {/* Status Badge */}
                              <Badge 
                                variant="outline" 
                                className="text-xs capitalize bg-green-100 text-green-800 border-green-200 px-1.5 py-0.5"
                              >
                                {IdeaStatusLabels[idea.status as keyof typeof IdeaStatusLabels] || idea.status}
                              </Badge>
                              
                              {idea.priority && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs capitalize bg-orange-100 text-orange-800 border-orange-200 px-1.5 py-0.5"
                                >
                                  {IdeaPriorityLabels[idea.priority as keyof typeof IdeaPriorityLabels] || idea.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(idea.id);
                            }}
                            disabled={togglingPin === idea.id}
                            className={`ml-2 transition-all duration-200 rounded-full w-8 h-8 p-0 backdrop-blur-sm ${
                              idea.is_pinned 
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-300' 
                                : 'bg-white/50 hover:bg-white/70 text-gray-600 hover:text-red-600 border border-gray-300'
                            }`}
                            title={idea.is_pinned ? 'Unpin idea' : 'Pin idea'}
                          >
                            {togglingPin === idea.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Pin className={`w-3 h-3 ${idea.is_pinned ? 'fill-current' : ''}`} />
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-current opacity-90 leading-relaxed line-clamp-2 mb-3 text-sm font-medium">
                        {idea.description}
                      </p>
                      
                      {/* Engagement Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-current/20">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeIdea(idea.id, idea.is_liked);
                            }}
                            disabled={likingIdea === idea.id}
                            className={`flex items-center gap-1 h-7 px-2 transition-all duration-200 rounded-full backdrop-blur-sm ${
                              idea.is_liked 
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-300' 
                                : 'bg-white/50 hover:bg-white/70 text-gray-600 hover:text-red-600 border border-gray-300'
                            }`}
                          >
                            {likingIdea === idea.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Heart className={`w-3 h-3 transition-all duration-200 ${idea.is_liked ? 'fill-current' : ''}`} />
                            )}
                            <span className="text-xs font-medium">{idea.like_count || 0}</span>
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs bg-white/50 hover:bg-white/70 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full px-3 h-7 transition-all duration-200 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIdeaClick(idea);
                          }}
                        >
                          View Details →
                        </Button>
                      </div>
                    </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </div>
      {/* Idea Detail Modal */}
      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleModalLike}
        onPin={isAdmin ? handleModalPin : undefined}
        onStatusUpdate={isAdmin ? handleStatusUpdate : undefined}
        isLiking={likingIdea === selectedIdea?.id}
        isPinning={togglingPin === selectedIdea?.id}
        isAdmin={isAdmin}
      />
    </div>
  );
};