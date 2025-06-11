import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { MobileCard } from './MobileCard';

export interface TableColumn<T> {
  key: string;
  label: string;
  width?: string;
  className?: string;
  render?: (item: T) => ReactNode;
}

export interface TableAction<T> {
  label: string | ((item: T) => string);
  icon?: ReactNode | ((item: T) => ReactNode);
  onClick: (item: T) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  className?: string;
  title?: string | ((item: T) => string);
  disabled?: boolean | ((item: T) => boolean);
}

interface BaseTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  getItemKey: (item: T) => string | number;
  className?: string;
}

export function BaseTable<T>({
  data,
  columns,
  actions = [],
  getItemKey,
  className = '',
}: BaseTableProps<T>) {
  // Mobile card view
  const MobileView = () => (
    <div className="space-y-4 sm:hidden">
      {data.map((item) => {
        const fields = columns
          .filter(column => !column.className?.includes('hidden'))
          .map(column => ({
            label: column.label,
            value: column.render ? column.render(item) : String((item as any)[column.key] || ''),
            className: column.className,
          }));

        return (
          <MobileCard
            key={getItemKey(item)}
            item={item}
            fields={fields}
            actions={actions}
            getItemKey={getItemKey}
          />
        );
      })}
    </div>
  );

  // Desktop table view
  const DesktopView = () => (
    <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-6">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className={`text-left py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap ${column.className || ''}`}
                    style={{ fontFamily: 'Satoshi, sans-serif', minWidth: column.width || 'auto' }}
                  >
                    {column.label}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="text-right py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap" style={{ fontFamily: 'Satoshi, sans-serif', minWidth: '120px' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {data.map((item) => (
                <tr 
                  key={getItemKey(item)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`py-3 sm:py-4 px-3 sm:px-4 text-sm text-gray-900 dark:text-gray-100 ${column.className || ''}`}>
                      <div className="truncate" title={column.render ? undefined : String((item as any)[column.key] || '')}>
                        {column.render ? column.render(item) : String((item as any)[column.key] || '')}
                      </div>
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="py-3 sm:py-4 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {actions.map((action, index) => {
                          const isDisabled = typeof action.disabled === 'function' 
                            ? action.disabled(item) 
                            : action.disabled || false;
                          const title = typeof action.title === 'function' 
                            ? action.title(item) 
                            : action.title;
                          const icon = typeof action.icon === 'function' 
                            ? action.icon(item) 
                            : action.icon;
                          
                          return (
                            <Button
                              key={index}
                              size="sm"
                              variant={action.variant || 'ghost'}
                              onClick={() => action.onClick(item)}
                              className={`rounded-lg h-8 w-8 sm:h-9 sm:w-auto sm:px-3 ${action.className || ''}`}
                              title={title}
                              disabled={isDisabled}
                            >
                              {icon}
                              <span className="hidden sm:inline ml-2">
                                {typeof action.label === 'function' ? action.label(item) : action.label}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <MobileView />
      <DesktopView />
    </div>
  );
}