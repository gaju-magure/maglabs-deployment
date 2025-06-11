import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableAction } from './BaseTable';

interface MobileCardProps<T> {
  item: T;
  fields: Array<{
    label: string;
    value: ReactNode;
    className?: string;
  }>;
  actions?: TableAction<T>[];
  getItemKey: (item: T) => string | number;
}

export function MobileCard<T>({
  item,
  fields,
  actions = [],
  getItemKey,
}: MobileCardProps<T>) {
  return (
    <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className={`flex justify-between items-start gap-3 ${field.className || ''}`}>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0 min-w-0" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {field.label}:
              </span>
              <div className="flex-1 min-w-0 text-right">
                {field.value}
              </div>
            </div>
          ))}
          
          {actions.length > 0 && (
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
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
                const label = typeof action.label === 'function' 
                  ? action.label(item) 
                  : action.label;
                
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
                    <span className="ml-2">{label}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}