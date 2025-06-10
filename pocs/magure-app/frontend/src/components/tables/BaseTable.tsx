import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

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
  return (
    <div className={`overflow-x-auto ${className}`}>
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
                          className={`rounded-lg ${action.className || ''}`}
                          title={title}
                          disabled={isDisabled}
                        >
                          {icon}
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
  );
}