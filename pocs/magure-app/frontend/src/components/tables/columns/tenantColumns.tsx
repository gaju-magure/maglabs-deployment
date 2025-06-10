import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Building2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DataTableColumn } from '@/components/ui/data-table';

export interface TenantData {
  id: number;
  name: string;
  schema_name: string;
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
    render: (tenant) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center text-white">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {tenant.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {tenant.schema_name}
          </p>
        </div>
      </div>
    )
  },
  {
    key: 'primary_domain',
    label: 'Domain',
    render: (tenant) => (
      <span className="text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
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
        return (
          <div className="space-y-1 w-full">
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
    render: (tenant) => (
      tenant.status === 'active' ? (
        <div className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Active</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 text-gray-400">
          <XCircle className="w-4 h-4" />
          <span className="text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Inactive</span>
        </div>
      )
    )
  },
  {
    key: 'created_at',
    label: 'Created',
    width: '120px',
    render: (tenant) => (
      <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {new Date(tenant.created_at).toLocaleDateString()}
      </span>
    )
  },
  {
    key: 'updated_at',
    label: 'Updated', 
    width: '120px',
    render: (tenant) => (
      <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {new Date(tenant.updated_at).toLocaleDateString()}
      </span>
    )
  },
];