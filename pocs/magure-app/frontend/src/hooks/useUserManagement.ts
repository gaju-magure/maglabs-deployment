import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  getUsers, 
  createUser, 
  type CreateUserRequest, 
  type CreateUserResponse 
} from '@/services/usersApi';
import { UserData } from '@/components/tables';

export interface ExtendedUser extends CreateUserResponse, UserData {}

export const useUserManagement = () => {
  // State management
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ExtendedUser | null>(null);

  // Fetch users function
  const fetchUsers = async (showRefreshIndicator = false) => {
    try {
      setError(null);
      
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const usersData = await getUsers();
      setUsers(usersData.results || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle create user
  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      const createdUser = await createUser(userData);
      setUsers([...users, createdUser]);
      
      toast({
        title: "Success",
        description: `User "${userData.username}" created successfully`,
      });
      
      setIsCreateModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle edit user (placeholder)
  const handleEditUser = (user: ExtendedUser) => {
    console.log('Edit user:', user);
    // TODO: Implement edit functionality
  };

  // Handle delete user
  const handleDeleteUser = (user: ExtendedUser) => {
    setDeletingUser(user);
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (deletingUser) {
      try {
        // For now, just remove from local state since delete API might not be implemented
        setUsers(users.filter(u => u.id !== deletingUser.id));
        
        toast({
          title: "Info", 
          description: `User "${deletingUser.username}" removed (API implementation pending)`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDeletingUser(null);
      }
    }
  };

  // Modal controls
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Filtered data
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Action handlers for table
  const createActionHandlers = (canEdit: boolean, canDelete: boolean) => ({
    onEdit: canEdit ? handleEditUser : undefined,
    onDelete: canDelete ? handleDeleteUser : undefined,
    canEdit,
    canDelete,
  });

  return {
    // Data
    users: filteredUsers,
    isLoading,
    error,
    isRefreshing,
    searchQuery,
    
    // Modal states
    isCreateModalOpen,
    deletingUser,
    
    // Actions
    setSearchQuery,
    fetchUsers,
    handleCreateUser,
    openCreateModal,
    closeCreateModal,
    confirmDeleteUser,
    createActionHandlers,
    
    // Retry action for error banner
    retryFetch: () => fetchUsers(),
  };
};