import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SearchAndActions } from './SearchAndActions';
import { BaseTable, TableColumn, TableAction } from './BaseTable';
import { LoadingSkeleton, EmptyState, CenteredLoading } from './TableStates';

// Re-export types for easier imports
export type { TableColumn as DataTableColumn, TableAction as DataTableAction } from './BaseTable';

interface DataTableConfig {
  title: string;
  description?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: ReactNode;
  createButtonLabel?: string;
  searchPlaceholder?: string;
}

interface DataTableState {
  loading?: boolean;
  error?: string | null;
  searchQuery?: string;
  isRefreshing?: boolean;
}

interface DataTableActions {
  onSearchChange?: (query: string) => void;
  onRefresh?: () => void;
  onCreateNew?: () => void;
}

interface DataTablePermissions {
  canCreate?: boolean;
  showRefreshButton?: boolean;
  showFilterButton?: boolean;
}

interface DataTableProps<T> extends DataTableConfig, DataTableState, DataTableActions, DataTablePermissions {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  getItemKey: (item: T) => string | number;
  className?: string;
}

export function DataTable<T>({
  // Config
  title,
  description,
  emptyStateTitle = 'No data found',
  emptyStateDescription = 'Get started by creating a new item',
  emptyStateIcon,
  createButtonLabel = 'Create New',
  searchPlaceholder = 'Search...',
  
  // State
  loading = false,
  error = null,
  searchQuery = '',
  isRefreshing = false,
  
  // Actions
  onSearchChange,
  onRefresh,
  onCreateNew,
  
  // Permissions
  canCreate = false,
  showRefreshButton = true,
  showFilterButton = true,
  
  // Data
  data,
  columns,
  actions = [],
  getItemKey,
  className = '',
}: DataTableProps<T>) {
  const showCreateButton = canCreate && onCreateNew;

  if (loading) {
    return (
      <div className={`h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 sm:p-6 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
          <SearchAndActions
            title={title}
            description={description}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onCreateNew={onCreateNew}
            createButtonLabel={createButtonLabel}
            showCreateButton={false} // Disable during loading
            showRefreshButton={false} // Disable during loading
            showFilterButton={showFilterButton}
          />
          <CardContent className="flex-1 overflow-hidden p-4 sm:p-6">
            <LoadingSkeleton rows={5} columns={columns.length + (actions.length > 0 ? 1 : 0)} />
          </CardContent>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 sm:p-6 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
        <SearchAndActions
          title={title}
          description={description}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onCreateNew={onCreateNew}
          createButtonLabel={createButtonLabel}
          showCreateButton={showCreateButton}
          showRefreshButton={showRefreshButton}
          showFilterButton={showFilterButton}
        />
        
        <CardContent className="flex-1 overflow-hidden p-4 sm:p-6">
          {data.length === 0 ? (
            <EmptyState
              title={emptyStateTitle}
              description={emptyStateDescription}
              icon={emptyStateIcon}
              onCreateNew={onCreateNew}
              createButtonLabel={createButtonLabel}
              showCreateButton={showCreateButton}
              searchQuery={searchQuery}
            />
          ) : (
            <BaseTable
              data={data}
              columns={columns}
              actions={actions}
              getItemKey={getItemKey}
            />
          )}
        </CardContent>
      </div>
    </div>
  );
}