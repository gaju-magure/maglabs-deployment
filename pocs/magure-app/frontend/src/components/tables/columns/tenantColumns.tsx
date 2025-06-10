import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Building2 } from 'lucide-react';
import { DataTableColumn } from '@/components/ui/data-table';

export interface TenantData {
  id: number;
  name: string;
  schema_name: string;
  primary_domain: string;
  status: 'active' | 'inactive';
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