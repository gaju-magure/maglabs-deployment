
import React from 'react';
import { Idea, AuthenticatedUser, UserRole, IdeaStatusEnum } from './types';
import IdeaList from './components/IdeaList'; // Assuming IdeaList is in components/
import { CheckCircleIcon } // Or any relevant icon
    from './components/icons';

interface ReviewerDashboardProps {
  ideas: Idea[];
  currentUser: AuthenticatedUser;
  onUpdateStatus: (ideaId: string, newStatus: IdeaStatusEnum) => void;
  onDeleteIdea: (ideaId: string) => void;
}

const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({ ideas, currentUser, onUpdateStatus, onDeleteIdea }) => {
  if (currentUser.role !== UserRole.EVALUATOR && currentUser.role !== UserRole.ADMIN) {
    return <p className="text-red-500">Access Denied. This area is for reviewers and administrators.</p>;
  }

  // Filter ideas that are pending review or in a state that needs review action
  const ideasForReview = ideas.filter(idea => 
    idea.status === IdeaStatusEnum.PENDING_REVIEW || 
    idea.status === IdeaStatusEnum.SUBMITTED || // Or other statuses you want reviewers to act on
    idea.status === IdeaStatusEnum.UNDER_SCREENING
  );
  // Admins and evaluators can see all ideas that need review
  // if (currentUser.role === UserRole.EVALUATOR) {
  //   ideasForReview = ideas.filter(idea => idea.status === IdeaStatusEnum.PENDING_REVIEW);
  // }


  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex items-center mb-6 pb-4 border-b border-neutral-light">
        <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mr-3" />
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase text-neutral-darker">Reviewer Dashboard</h2>
            <p className="text-sm text-neutral-DEFAULT">Manage and evaluate submitted ideas.</p>
        </div>
      </div>

      {ideasForReview.length > 0 ? (
        <IdeaList 
          ideas={ideasForReview} 
          currentUser={currentUser}
          onDeleteIdea={onDeleteIdea}
          onUpdateStatus={onUpdateStatus}
          isDashboardView={true} // Key prop to enable review actions in IdeaCard
        />
      ) : (
        <p className="text-neutral-dark font-body-medium text-center py-8">
          There are no ideas currently awaiting review.
        </p>
      )}

      {currentUser.role === UserRole.ADMIN && ideas.length > ideasForReview.length && (
        <div className="mt-10 pt-6 border-t border-neutral-light">
            <h3 className="text-xl font-semibold text-neutral-darker mb-4">All Other Ideas (Admin View)</h3>
            <IdeaList
                ideas={ideas.filter(idea => !ideasForReview.find(revIdea => revIdea.id === idea.id))}
                currentUser={currentUser}
                onDeleteIdea={onDeleteIdea}
                onUpdateStatus={onUpdateStatus}
                isDashboardView={false} // Regular view for other ideas
            />
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboard;
