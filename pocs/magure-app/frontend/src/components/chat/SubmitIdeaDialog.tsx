import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitChatAsIdea, type ChatSessionDetail } from '@/services/chatApi';

interface SubmitIdeaDialogProps {
  session: ChatSessionDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitIdeaDialog: React.FC<SubmitIdeaDialogProps> = ({
  session,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(() => {
    // Extract key points from conversation
    const userMessages = session.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');
    return userMessages;
  });
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  const submitMutation = useMutation({
    mutationFn: () => submitChatAsIdea(session.id, { title, description, priority }),
    onSuccess: () => {
      onSuccess();
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    submitMutation.mutate();
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit as Idea</DialogTitle>
            <DialogDescription>
              Convert this chat conversation into a structured idea for the content wall.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a clear, concise title for your idea"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your idea in detail..."
                className="min-h-[200px]"
                required
              />
              <p className="text-xs text-gray-500">
                This includes the key points from your conversation above. Feel free to edit and refine.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitMutation.isPending || !title.trim() || !description.trim()}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Idea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};