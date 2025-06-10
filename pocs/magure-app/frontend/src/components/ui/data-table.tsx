import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  className?: string;
  render?: (item: T) => ReactNode;
}

export interface DataTableAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  className?: string;
  title?: string;
}

interface DataTableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onCreateNew?: () => void;
  createButtonLabel?: string;
  canCreate?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: ReactNode;
  className?: string;
  getItemKey: (item: T) => string | number;
}

export function DataTable<T>({
  title,
  description,
  data,
  columns,
  actions = [],
  loading = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  onRefresh,
  isRefreshing = false,
  onCreateNew,
  createButtonLabel = 'Create New',
  canCreate = false,
  emptyStateTitle = 'No data found',
  emptyStateDescription = 'Get started by creating a new item',
  emptyStateIcon,
  className = '',
  getItemKey,
}: DataTableProps<T>) {
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {columns.map((column, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
          {actions.length > 0 && <Skeleton className="h-4 w-20" />}
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-center space-y-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
          {emptyStateIcon || <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {emptyStateTitle}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {searchQuery ? 'Try adjusting your search terms' : emptyStateDescription}
          </p>
        </div>
        {canCreate && onCreateNew && !searchQuery && (
          <Button onClick={onCreateNew} className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white">
            <Plus className="h-4 w-4 mr-2" />
            {createButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
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
              {onRefresh && (
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
              {canCreate && onCreateNew && (
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
              <Button variant="outline" className="rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-6">
          {loading ? (
            <LoadingSkeleton />
          ) : data.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        className={`text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 ${column.className || ''}`}
                        style={{ fontFamily: 'Satoshi, sans-serif', width: column.width }}
                      >
                        {column.label}
                      </th>
                    ))}
                    {actions.length > 0 && (
                      <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr 
                      key={getItemKey(item)}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className={`py-4 px-4 ${column.className || ''}`}>
                          {column.render ? column.render(item) : String((item as any)[column.key] || '')}
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            {actions.map((action, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant={action.variant || 'ghost'}
                                onClick={() => action.onClick(item)}
                                className={`rounded-lg ${action.className || ''}`}
                                title={action.title}
                              >
                                {action.icon}
                              </Button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}