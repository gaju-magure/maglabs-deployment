import React, { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
}

interface AlertBannerProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  title?: string;
  message: string | ReactNode;
  actions?: AlertAction[];
  onDismiss?: () => void;
  icon?: ReactNode;
  className?: string;
}

const variantConfig = {
  default: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  destructive: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
    iconClassName: 'text-green-600 dark:text-green-400',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = 'default',
  title,
  message,
  actions = [],
  onDismiss,
  icon,
  className = '',
}) => {
  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;

  return (
    <Alert className={`${config.className} ${className}`} variant={variant === 'destructive' ? 'destructive' : 'default'}>
      <div className="flex items-start gap-3">
        <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.iconClassName}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {title}
            </h4>
          )}
          
          <AlertDescription 
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            {message}
          </AlertDescription>
          
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className={`h-7 px-2 text-xs ${action.className || ''}`}
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 flex-shrink-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </Alert>
  );
};