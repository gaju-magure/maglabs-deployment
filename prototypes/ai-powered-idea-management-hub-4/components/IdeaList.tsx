
import React from 'react';
import { Idea, AuthenticatedUser, IdeaStatusEnum } from '../types';
import IdeaCard from './IdeaCard';

interface IdeaListProps {
  ideas: Idea[];
  currentUser: AuthenticatedUser | null;
  onDeleteIdea: (ideaId: string) => void;
  onUpdateStatus: (ideaId: string, newStatus: IdeaStatusEnum) => void;
  isDashboardView?: boolean; // To indicate if this list is on the reviewer dashboard
}

const IdeaList: React.FC<IdeaListProps> = ({ ideas, currentUser, onDeleteIdea, onUpdateStatus, isDashboardView = false }) => {
  if (!currentUser) { // Should not happen if App.tsx logic is correct
    return <p className="text-center text-red-500">Error: User not authenticated.</p>;
  }
  
  if (ideas.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-DEFAULT text-lg">
          {isDashboardView ? "No ideas currently require your review." : "No ideas submitted yet. Be the first to spark innovation!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ideas.map((idea) => (
        <IdeaCard 
          key={idea.id} 
          idea={idea} 
          currentUser={currentUser}
          onDelete={onDeleteIdea}
          onUpdateStatus={onUpdateStatus}
          showReviewActions={isDashboardView} // Show approve/reject only on dashboard
        />
      ))}
    </div>
  );
};

export default IdeaList;
