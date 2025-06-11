import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Users, Building, Crown } from 'lucide-react';
import { DataTableColumn } from '@/components/ui/data-table';
import { Department } from '@/services/organizationApi';

const getStatusBadgeColor = (isActive: boolean) => {
  return isActive 
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
};

const getDepartmentIcon = (dept: Department) => {
  if (dept.department_head) {
    return <Crown className="w-4 h-4 sm:w-5 sm:h-5" />;
  }
  return <Building className="w-4 h-4 sm:w-5 sm:h-5" />;
};

export const departmentColumns: DataTableColumn<Department>[] = [
  {
    key: 'name',
    label: 'Department',
    width: '250px',
    render: (dept) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-[#B96AF7] to-[#FDA052] flex items-center justify-center text-white flex-shrink-0">
          {getDepartmentIcon(dept)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {dept.name}
            {dept.department_head && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs border-yellow-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Has Head
              </Badge>
            )}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {dept.description || 'No description'}
          </p>
        </div>
      </div>
    )
  },
  {
    key: 'parent',
    label: 'Parent Department',
    width: '180px',
    className: 'hidden md:table-cell',
    render: (dept) => (
      <span className="text-sm text-gray-700 dark:text-gray-300 truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {dept.parent_department ? `Dept ID: ${dept.parent_department}` : 'Root Department'}
      </span>
    )
  },
  {
    key: 'members',
    label: 'Members',
    width: '120px',
    className: 'text-center',
    render: (dept) => (
      <div className="flex items-center justify-center gap-2">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {dept.member_count || 0}
        </span>
      </div>
    )
  },
  {
    key: 'head',
    label: 'Department Head',
    width: '150px',
    className: 'hidden sm:table-cell',
    render: (dept) => (
      <div className="flex items-center gap-2">
        {dept.department_head ? (
          <>
            <Crown className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              User ID: {dept.department_head}
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-400 italic" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            No head assigned
          </span>
        )}
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    className: 'text-center',
    width: '120px',
    render: (dept) => (
      <Badge 
        className={`${getStatusBadgeColor(dept.is_active)} px-2 sm:px-3 py-1 text-xs sm:text-sm`} 
        style={{ fontFamily: 'Satoshi, sans-serif' }}
      >
        {dept.is_active ? (
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
    render: (dept) => (
      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {new Date(dept.created_at).toLocaleDateString()}
      </span>
    )
  },
];