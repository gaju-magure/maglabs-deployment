import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, Building2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DataTableColumn } from '@/components/ui/data-table';

export interface TenantData {
  id: number;
  name: string;
  primary_domain: string;
  status: 'active' | 'inactive';
  onboarding_status?: 'pending' | 'in_progress' | 'completed';
  admin_email?: string;
  onboarding_progress?: {
    completion_percentage: number;
    completed_steps: number;
    total_steps: number;
    current_step: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export const tenantColumns: DataTableColumn<TenantData>[] = [
  {
    key: 'tenant',
    label: 'Tenant',
    width: '280px',
    render: (tenant) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center text-white flex-shrink-0">
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {tenant.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {tenant.admin_email || 'No admin email'}
          </p>
        </div>
      </div>
    )
  },
  {
    key: 'primary_domain',
    label: 'Domain',
    width: '200px',
    render: (tenant) => (
      <span className="text-gray-700 dark:text-gray-300 text-sm truncate block" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {tenant.primary_domain}
      </span>
    )
  },
  {
    key: 'onboarding_status',
    label: 'Onboarding',
    className: 'text-center',
    width: '200px',
    render: (tenant) => {
      const status = tenant.onboarding_status || 'pending';
      const progress = tenant.onboarding_progress;

      if (status === 'completed') {
        return (
          <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Complete
            </span>
          </div>
        );
      }

      if (status === 'in_progress' && progress) {
        const stepNames = ['Email Invitation', 'Profile Setup', 'Company Details', 'Preferences'];
        const currentStepIndex = Math.max(0, progress.completed_steps);
        const currentStepName = stepNames[currentStepIndex] || 'Complete';
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 w-full cursor-help">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        In Progress
                      </span>
                    </div>
                    <span className="text-xs text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {progress.completed_steps}/{progress.total_steps}
                    </span>
                  </div>
                  <Progress value={progress.completion_percentage} className="h-1.5 w-full" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">Onboarding Progress</p>
                  <p className="text-sm">Current step: {currentStepName}</p>
                  <div className="space-y-0.5">
                    {stepNames.slice(0, progress.total_steps).map((step, index) => (
                      <div key={step} className="flex items-center gap-2 text-xs">
                        {index < progress.completed_steps ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400" />
                        )}
                        <span className={index < progress.completed_steps ? 'text-green-600' : 'text-gray-500'}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Pending
          </span>
        </div>
      );
    }
  },
  {
    key: 'status',
    label: 'Status',
    className: 'text-center',
    width: '100px',
    render: (tenant) => (
      tenant.status === 'active' ? (
        <div className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs sm:text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Active</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 text-gray-400">
          <XCircle className="w-4 h-4" />
          <span className="text-xs sm:text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Inactive</span>
        </div>
      )
    )
  },
  {
    key: 'created_at',
    label: 'Created',
    width: '140px',
    className: 'hidden sm:table-cell',
    render: (tenant) => (
      <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {new Date(tenant.created_at).toLocaleDateString()}
      </span>
    )
  },
  {
    key: 'updated_at',
    label: 'Updated', 
    width: '140px',
    className: 'hidden lg:table-cell',
    render: (tenant) => (
      <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {new Date(tenant.updated_at).toLocaleDateString()}
      </span>
    )
  },
];