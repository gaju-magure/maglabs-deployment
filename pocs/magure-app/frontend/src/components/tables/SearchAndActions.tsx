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
    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {title}
          </h1>
          {description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {description}
            </p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showRefreshButton && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-xl flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          {showCreateButton && onCreateNew && (
            <Button 
              onClick={onCreateNew}
              size="sm"
              className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200 flex-shrink-0"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{createButtonLabel}</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Search and Filter Section */}
      {onSearchChange && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 sm:pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#B96AF7] transition-all duration-200 text-sm sm:text-base"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          {showFilterButton && (
            <Button variant="outline" size="sm" className="rounded-xl flex-shrink-0">
              <Filter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};