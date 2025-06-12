import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronDown, Edit3 } from 'lucide-react';
import { Idea, updateIdeaStatus, StatusUpdateRequest } from '@/services/ideasApi';
import { IdeaStatusLabels } from '@/enums/ideaStatus';
import { toast } from 'sonner';

interface StatusTransitionButtonProps {
  idea: Idea;
  onStatusUpdate: (updatedIdea: Idea) => void;
  className?: string;
}

export function StatusTransitionButton({ idea, onStatusUpdate, className }: StatusTransitionButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableTransitions = idea.available_status_transitions || [];

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus) return;

    setIsLoading(true);
    try {
      const updateData: StatusUpdateRequest = {
        status: selectedStatus,
        notes: notes.trim() || undefined,
      };

      const updatedIdea = await updateIdeaStatus(idea.id, updateData);
      onStatusUpdate(updatedIdea);
      toast.success(`Status updated to ${IdeaStatusLabels[selectedStatus as keyof typeof IdeaStatusLabels]}`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!idea.can_change_status || availableTransitions.length === 0) {
    return null;
  }

  const requiresNotes = ['rejected', 'on_hold', 'needs_clarification'].includes(selectedStatus);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Edit3 className="h-4 w-4 mr-1" />
            Change Status
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Current: {IdeaStatusLabels[idea.status as keyof typeof IdeaStatusLabels]}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {availableTransitions.map((transition) => (
            <DropdownMenuItem
              key={transition.value}
              onClick={() => handleStatusChange(transition.value)}
              className="cursor-pointer"
            >
              {transition.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Change status from{' '}
              <span className="font-medium">
                {IdeaStatusLabels[idea.status as keyof typeof IdeaStatusLabels]}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {IdeaStatusLabels[selectedStatus as keyof typeof IdeaStatusLabels]}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">
                Notes {requiresNotes && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  requiresNotes
                    ? 'Please provide a reason for this status change...'
                    : 'Optional notes about this status change...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={isLoading || (requiresNotes && !notes.trim())}
            >
              {isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}