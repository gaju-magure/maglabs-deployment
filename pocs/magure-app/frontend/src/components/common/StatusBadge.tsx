import { IdeaStatus, IdeaStatusLabels, IdeaStatusColors, IdeaPriority, IdeaPriorityLabels, IdeaPriorityColors } from '@/enums/ideaStatus';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusEnum = status as IdeaStatus;
  const label = IdeaStatusLabels[statusEnum] || status;
  const colorClass = IdeaStatusColors[statusEnum] || 'bg-gray-100 text-gray-800';

  return (
    <Badge 
      variant="secondary" 
      className={cn(colorClass, 'text-xs font-medium', className)}
    >
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityEnum = priority as IdeaPriority;
  const label = IdeaPriorityLabels[priorityEnum] || priority;
  const colorClass = IdeaPriorityColors[priorityEnum] || 'bg-gray-100 text-gray-800';

  return (
    <Badge 
      variant="secondary" 
      className={cn(colorClass, 'text-xs font-medium', className)}
    >
      {label}
    </Badge>
  );
}