import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  getDepartments, 
  createDepartment, 
  updateDepartment,
  deleteDepartment,
  getDepartmentTree,
  assignDepartmentHead,
  type Department,
  type CreateDepartmentRequest,
  type UpdateDepartmentRequest
} from '@/services/organizationApi';

export const useDepartmentManagement = () => {
  // State management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentTree, setDepartmentTree] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  // Fetch departments function
  const fetchDepartments = async (showRefreshIndicator = false) => {
    try {
      setError(null);
      
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const [deptData, treeData] = await Promise.all([
        getDepartments(),
        getDepartmentTree().catch(() => []) // Fallback to empty array if tree fails
      ]);
      
      setDepartments(deptData.results || []);
      setDepartmentTree(treeData || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch departments';
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
    fetchDepartments();
  }, []);

  // Handle create department
  const handleCreateDepartment = async (deptData: CreateDepartmentRequest) => {
    try {
      const createdDepartment = await createDepartment(deptData);
      setDepartments([...departments, createdDepartment]);
      
      toast({
        title: "Success",
        description: `Department "${deptData.name}" created successfully`,
      });
      
      setIsCreateModalOpen(false);
      
      // Refresh tree data
      fetchDepartments(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create department';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle edit department
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsEditModalOpen(true);
  };

  // Handle update department
  const handleUpdateDepartment = async (deptData: UpdateDepartmentRequest) => {
    if (!editingDepartment) return;
    
    try {
      const updatedDepartment = await updateDepartment(editingDepartment.id, deptData);
      
      // Update the department in the local state
      setDepartments(departments.map(dept => 
        dept.id === editingDepartment.id ? { ...dept, ...updatedDepartment } : dept
      ));
      
      toast({
        title: "Success",
        description: `Department "${deptData.name || editingDepartment.name}" updated successfully`,
      });
      
      setIsEditModalOpen(false);
      setEditingDepartment(null);
      
      // Refresh tree data
      fetchDepartments(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update department';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle delete department
  const handleDeleteDepartment = (department: Department) => {
    setDeletingDepartment(department);
  };

  // Confirm delete department
  const confirmDeleteDepartment = async () => {
    if (deletingDepartment) {
      try {
        await deleteDepartment(deletingDepartment.id);
        setDepartments(departments.filter(dept => dept.id !== deletingDepartment.id));
        
        toast({
          title: "Success",
          description: `Department "${deletingDepartment.name}" deleted successfully`,
        });
        
        // Refresh tree data
        fetchDepartments(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete department';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDeletingDepartment(null);
      }
    }
  };

  // Handle assign department head
  const handleAssignDepartmentHead = async (department: Department, userId: number) => {
    try {
      const updatedDepartment = await assignDepartmentHead(department.id, userId);
      
      // Update the department in the local state
      setDepartments(departments.map(dept => 
        dept.id === department.id ? { ...dept, ...updatedDepartment } : dept
      ));
      
      toast({
        title: "Success",
        description: `Department head assigned to "${department.name}" successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign department head';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Modal controls
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDepartment(null);
  };

  // Filtered data
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Action handlers for table
  const createActionHandlers = (canEdit: boolean, canDelete: boolean) => ({
    onEdit: canEdit ? handleEditDepartment : undefined,
    onDelete: canDelete ? handleDeleteDepartment : undefined,
    onAssignHead: canEdit ? handleAssignDepartmentHead : undefined,
    canEdit,
    canDelete,
    canAssignHead: canEdit,
  });

  return {
    // Data
    departments: filteredDepartments,
    departmentTree,
    isLoading,
    error,
    isRefreshing,
    searchQuery,
    
    // Modal states
    isCreateModalOpen,
    isEditModalOpen,
    editingDepartment,
    deletingDepartment,
    
    // Actions
    setSearchQuery,
    fetchDepartments,
    handleCreateDepartment,
    handleUpdateDepartment,
    handleAssignDepartmentHead,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    confirmDeleteDepartment,
    createActionHandlers,
    
    // Retry action for error banner
    retryFetch: () => fetchDepartments(),
  };
};