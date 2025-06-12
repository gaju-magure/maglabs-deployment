import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Users, Shield } from 'lucide-react';
import { DataTableColumn } from '@/components/ui/data-table';
import { CustomRole } from '@/services/organizationApi';


const getStatusBadgeColor = (isActive: boolean) => {
  return isActive 
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
};

export const customRoleColumns: DataTableColumn<CustomRole>[] = [
  {
    key: 'name',
    label: 'Role Name',
    width: '250px',
    render: (role) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#3077F3] to-[#41E6F8] flex items-center justify-center text-white flex-shrink-0">
          {role.is_system_role ? (
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <span className="font-semibold text-xs sm:text-sm">
              {role.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {role.name}
            {role.is_system_role && (
              <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs border-blue-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                System
              </Badge>
            )}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {role.description || 'No description'}
          </p>
        </div>
      </div>
    )
  },
  {
    key: 'type',
    label: 'Type',
    width: '150px',
    className: 'hidden sm:table-cell',
    render: (role) => (
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {role.is_system_role ? 'System Role' : 'Custom Role'}
        </span>
      </div>
    )
  },
  {
    key: 'users',
    label: 'Users',
    width: '120px',
    className: 'hidden md:table-cell text-center',
    render: (role) => (
      <div className="flex items-center justify-center gap-2">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {role.user_count || 0}
        </span>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    className: 'text-center',
    width: '120px',
    render: (role) => (
      <Badge 
        className={`${getStatusBadgeColor(role.is_active)} px-2 sm:px-3 py-1 text-xs sm:text-sm`} 
        style={{ fontFamily: 'Satoshi, sans-serif' }}
      >
        {role.is_active ? (
          <div className="inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </div>
        ) : (
          <div className="inline-flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Inactive
          </div>
        )}
      </Badge>
    )
  },
  {
    key: 'created_at',
    label: 'Created',
    className: 'hidden lg:table-cell text-center',
    width: '120px',
    render: (role) => (
      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {new Date(role.created_at).toLocaleDateString()}
      </span>
    )
  },
];