import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';

interface SearchAndActionsProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onCreateNew?: () => void;
  createButtonLabel?: string;
  showCreateButton?: boolean;
  showRefreshButton?: boolean;
  showFilterButton?: boolean;
  title: string;
  description?: string;
}

export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  onRefresh,
  isRefreshing = false,
  onCreateNew,
  createButtonLabel = 'Create New',
  showCreateButton = false,
  showRefreshButton = true,
  showFilterButton = true,
  title,
  description,
}) => {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {title}
          </h1>
          {description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showRefreshButton && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          {showCreateButton && onCreateNew && (
            <Button 
              onClick={onCreateNew}
              className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createButtonLabel}
            </Button>
          )}
        </div>
      </div>
      
      {onSearchChange && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          {showFilterButton && (
            <Button variant="outline" className="rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
};