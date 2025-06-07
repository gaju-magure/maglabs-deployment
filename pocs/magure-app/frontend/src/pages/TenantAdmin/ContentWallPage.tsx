
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Pin } from 'lucide-react';
import { CreatePostModal } from '@/components/TenantAdmin/CreatePostModal';
import { useEffect } from 'react';
import { createUser, CreateUserRequest } from '@/services/usersApi';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface ContentPost {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  isPinned: boolean;
  type: 'announcement' | 'post' | 'file';
}

export const ContentWallPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [posts, setPosts] = useState<ContentPost[]>([
    {
      id: '1',
      title: 'Welcome to the New Dashboard',
      content: 'We are excited to introduce our new dashboard with enhanced features and improved user experience.',
      author: 'Admin User',
      timestamp: '2024-01-20 10:30',
      isPinned: true,
      type: 'announcement'
    },
    {
      id: '2',
      title: 'Q1 Company Meeting',
      content: 'Join us for our quarterly meeting to discuss progress and upcoming initiatives.',
      author: 'HR Team',
      timestamp: '2024-01-19 14:15',
      isPinned: false,
      type: 'post'
    }
  ]);

  const handleCreatePost = (newPost: Omit<ContentPost, 'id' | 'timestamp'>) => {
    const post: ContentPost = {
      ...newPost,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
    };
    setPosts([post, ...posts]);
    setIsCreateModalOpen(false);
  };

  const togglePin = (id: string) => {
    setPosts(posts.map(post => 
      post.id === id ? { ...post, isPinned: !post.isPinned } : post
    ));
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });


  return (
    <div className="space-y-6">
      {/* Content Wall Section */}
      <div>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Content Wall</h1>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>

        <div className="grid gap-6">
          {sortedPosts.map((post) => (
            <Card key={post.id} className="relative">
              {post.isPinned && (
                <div className="absolute top-4 right-4">
                  <Pin className="h-4 w-4 text-yellow-600" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {post.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{post.author}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{post.timestamp}</span>
                        <Badge variant={post.type === 'announcement' ? 'default' : 'secondary'}>
                          {post.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePin(post.id)}
                    className="text-gray-400 hover:text-yellow-600"
                  >
                    <Pin className={`h-4 w-4 ${post.isPinned ? 'text-yellow-600' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePost}
        />
      </div>
    </div>
  );
};
