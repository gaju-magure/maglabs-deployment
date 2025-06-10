import React, { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
  icon?: ReactNode;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  icon,
  loading = false,
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-2 rounded-full ${variant === 'destructive'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                {icon}
              </div>
            )}
            <AlertDialogTitle className="text-lg font-semibold" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400 mt-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 mt-6">
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 text-white ${getConfirmButtonStyles()}`}
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};