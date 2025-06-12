import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pin, Loader2, Sparkles, Clock, User, Heart, Search, X, Building2, Briefcase, Filter } from 'lucide-react';
import { getContentWallIdeas, toggleIdeaPin, likeIdea, unlikeIdea, type Idea } from '@/services/ideasApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { IdeaDetailModal } from '@/components/common/IdeaDetailModal';
import { AdminPinningSidebar } from '@/components/common/AdminPinningSidebar';
import { DepartmentFilter } from '@/components/common/DepartmentFilter';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is admin (can pin/unpin ideas)
  const isAdmin = user?.role === 'superadmin' || user?.role === 'tenant_admin';

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
    
    // Department filter
    if (selectedDepartment) {
      if (!idea.department_name || idea.department_name !== getDepartmentName(selectedDepartment)) {
        return false;
      }
    }
    
    // Role filter
    if (selectedRole) {
      if (!idea.custom_role_name || idea.custom_role_name !== getRoleName(selectedRole)) {
        return false;
      }
    }
    
    // Status filter
    if (selectedStatus) {
      if (idea.status !== selectedStatus) {
        return false;
      }
    }
    
    // Priority filter
    if (selectedPriority) {
      if (idea.priority !== selectedPriority) {
        return false;
      }
    }
    
    return true;
  });

  // Helper functions
  const getDepartmentName = (id: string) => {
    const departments = getDepartmentStats();
    return departments.find(d => d.id === id)?.name;
  };

  const getRoleName = (id: string) => {
    const roles = getRoleStats();
    return roles.find(r => r.id === id)?.name;
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

  // Load content wall ideas on mount and when filters change
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (selectedDepartment) params.append('department', selectedDepartment);
        if (selectedRole) params.append('role', selectedRole);
        if (selectedStatus) params.append('status', selectedStatus);
        if (selectedPriority) params.append('priority', selectedPriority);
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
  }, [toast, selectedDepartment, selectedRole, selectedStatus, selectedPriority, searchQuery]);

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
    <div className="w-full min-h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isAdmin && sidebarOpen ? 'mr-96' : ''}`}>
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

        {/* Filters */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="space-y-4">
            <DepartmentFilter
              departments={getDepartmentStats()}
              roles={getRoleStats()}
              selectedDepartment={selectedDepartment}
              selectedRole={selectedRole}
              onDepartmentChange={setSelectedDepartment}
              onRoleChange={setSelectedRole}
            />
            
            {/* Additional Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Additional Filters:</span>
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="in_development">In Development</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
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

              {(selectedStatus || selectedPriority) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
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
          <div className="space-y-6">
            {/* Search Results Count */}
            {searchQuery && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Found {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </div>
            )}
            
            {filteredIdeas.map((idea, index) => (
              <Card 
                key={idea.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-in slide-in-from-bottom cursor-pointer ${
                  idea.is_pinned 
                    ? 'ring-2 ring-yellow-200 dark:ring-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20' 
                    : 'hover:scale-[1.02] transform'
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  fontFamily: 'Satoshi, sans-serif'
                }}
                onClick={() => handleIdeaClick(idea)}
              >
                {idea.is_pinned && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-yellow-400">
                    <Pin className="absolute -top-8 -right-7 w-4 h-4 text-white transform rotate-45" />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12 ring-2 ring-gray-200 dark:ring-gray-700">
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
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {idea.title}
                        </CardTitle>
                        
                        {/* Author and Job Title */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {idea.user_name || idea.user_email.split('@')[0]}
                          </span>
                          {idea.user_profile?.job_title && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {idea.user_profile.job_title}
                              </span>
                            </>
                          )}
                        </div>
                        
                        {/* Department and Role Badges */}
                        <div className="flex items-center gap-2 mb-3">
                          {idea.department_name && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              {idea.department_name}
                            </Badge>
                          )}
                          {idea.custom_role_name && (
                            <Badge variant="outline" className="text-xs">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {idea.custom_role_name}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Meta Information */}
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{getRelativeTime(idea.created_at)}</span>
                          </div>
                          <StatusBadge status={idea.status} />
                          <PriorityBadge priority={idea.priority} />
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
                        className={`ml-4 transition-all duration-200 ${
                          idea.is_pinned 
                            ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                        }`}
                      >
                        {togglingPin === idea.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Pin className={`w-4 h-4 ${idea.is_pinned ? 'fill-current' : ''}`} />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                    {idea.description}
                  </p>
                  
                  {/* Engagement Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeIdea(idea.id, idea.is_liked);
                      }}
                      disabled={likingIdea === idea.id}
                      className={`flex items-center gap-2 transition-all duration-200 ${
                        idea.is_liked 
                          ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30' 
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                      }`}
                    >
                      {likingIdea === idea.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className={`w-4 h-4 ${idea.is_liked ? 'fill-current' : ''}`} />
                      )}
                      <span className="text-sm font-medium">{idea.like_count}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Admin Sidebar */}
      {isAdmin && (
        <AdminPinningSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onIdeaUpdate={(updatedIdea) => {
            setIdeas(prevIdeas => 
              prevIdeas.map(idea => 
                idea.id === updatedIdea.id ? updatedIdea : idea
              )
            );
          }}
        />
      )}

      {/* Idea Detail Modal */}
      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleModalLike}
        onPin={isAdmin ? handleModalPin : undefined}
        isLiking={likingIdea === selectedIdea?.id}
        isPinning={togglingPin === selectedIdea?.id}
        isAdmin={isAdmin}
      />
    </div>
  );
};