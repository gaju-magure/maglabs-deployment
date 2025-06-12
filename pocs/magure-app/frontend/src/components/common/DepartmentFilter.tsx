import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Users, 
  ChevronDown, 
  Filter, 
  X,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Department {
  id: string;
  name: string;
  count: number;
}

interface Role {
  id: string;
  name: string;
  count: number;
}

interface DepartmentFilterProps {
  departments: Department[];
  roles: Role[];
  selectedDepartment?: string;
  selectedRole?: string;
  onDepartmentChange: (departmentId?: string) => void;
  onRoleChange: (roleId?: string) => void;
  className?: string;
}

export const DepartmentFilter: React.FC<DepartmentFilterProps> = ({
  departments,
  roles,
  selectedDepartment,
  selectedRole,
  onDepartmentChange,
  onRoleChange,
  className
}) => {
  const [showDepartments, setShowDepartments] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

  const selectedDepartmentName = departments.find(d => d.id === selectedDepartment)?.name;
  const selectedRoleName = roles.find(r => r.id === selectedRole)?.name;
  
  const hasActiveFilters = selectedDepartment || selectedRole;

  const clearAllFilters = () => {
    onDepartmentChange(undefined);
    onRoleChange(undefined);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowDepartments(false);
        setShowRoles(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Department Filter */}
        <div className="relative" data-dropdown>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDepartments(!showDepartments)}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              selectedDepartment && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {selectedDepartmentName || 'Department'}
            </span>
            <ChevronDown className={cn(
              "w-3 h-3 transition-transform duration-200",
              showDepartments && "rotate-180"
            )} />
          </Button>

          {showDepartments && (
            <Card className="absolute top-full left-0 mt-2 w-64 z-50 shadow-lg">
              <CardContent className="p-2">
                <ScrollArea className="max-h-64">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onDepartmentChange(undefined);
                        setShowDepartments(false);
                      }}
                      className={cn(
                        "w-full justify-start text-sm",
                        !selectedDepartment && "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      All Departments
                      <Badge variant="secondary" className="ml-auto">
                        {departments.reduce((sum, d) => sum + d.count, 0)}
                      </Badge>
                    </Button>
                    
                    {departments.map((department) => (
                      <Button
                        key={department.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onDepartmentChange(department.id);
                          setShowDepartments(false);
                        }}
                        className={cn(
                          "w-full justify-start text-sm",
                          selectedDepartment === department.id && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        )}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        {department.name}
                        <Badge variant="secondary" className="ml-auto">
                          {department.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Role Filter */}
        <div className="relative" data-dropdown>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRoles(!showRoles)}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              selectedRole && "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
            )}
          >
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-medium" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {selectedRoleName || 'Role'}
            </span>
            <ChevronDown className={cn(
              "w-3 h-3 transition-transform duration-200",
              showRoles && "rotate-180"
            )} />
          </Button>

          {showRoles && (
            <Card className="absolute top-full left-0 mt-2 w-64 z-50 shadow-lg">
              <CardContent className="p-2">
                <ScrollArea className="max-h-64">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onRoleChange(undefined);
                        setShowRoles(false);
                      }}
                      className={cn(
                        "w-full justify-start text-sm",
                        !selectedRole && "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      All Roles
                      <Badge variant="secondary" className="ml-auto">
                        {roles.reduce((sum, r) => sum + r.count, 0)}
                      </Badge>
                    </Button>
                    
                    {roles.map((role) => (
                      <Button
                        key={role.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onRoleChange(role.id);
                          setShowRoles(false);
                        }}
                        className={cn(
                          "w-full justify-start text-sm",
                          selectedRole === role.id && "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                        )}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        {role.name}
                        <Badge variant="secondary" className="ml-auto">
                          {role.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Filtered by:
            </span>
          </div>
          
          {selectedDepartmentName && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            >
              <Building2 className="w-3 h-3" />
              {selectedDepartmentName}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100" 
                onClick={() => onDepartmentChange(undefined)}
              />
            </Badge>
          )}
          
          {selectedRoleName && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
            >
              <Briefcase className="w-3 h-3" />
              {selectedRoleName}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-purple-900 dark:hover:text-purple-100" 
                onClick={() => onRoleChange(undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};