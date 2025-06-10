import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus } from 'lucide-react';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  rows = 5, 
  columns = 6 
}) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  onCreateNew?: () => void;
  createButtonLabel?: string;
  showCreateButton?: boolean;
  searchQuery?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'Get started by creating a new item',
  icon,
  onCreateNew,
  createButtonLabel = 'Create New',
  showCreateButton = false,
  searchQuery = '',
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="text-center space-y-4 animate-in fade-in duration-500">
      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        {icon || <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {searchQuery ? 'Try adjusting your search terms' : description}
        </p>
      </div>
      {showCreateButton && onCreateNew && !searchQuery && (
        <Button 
          onClick={onCreateNew} 
          className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {createButtonLabel}
        </Button>
      )}
    </div>
  </div>
);

interface CenteredLoadingProps {
  message?: string;
}

export const CenteredLoading: React.FC<CenteredLoadingProps> = ({ 
  message = 'Loading...' 
}) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B96AF7] mx-auto"></div>
      <p className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {message}
      </p>
    </div>
  </div>
);