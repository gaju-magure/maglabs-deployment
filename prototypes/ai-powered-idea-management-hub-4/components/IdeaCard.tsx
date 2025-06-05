
import React, { useState } from 'react';
import { Idea, IdeaStatusEnum, AuthenticatedUser, UserRole } from '../types';
import { TagIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, LoadingSpinnerIcon, AlertTriangleIcon } from './icons';

interface IdeaCardProps {
  idea: Idea;
  currentUser: AuthenticatedUser;
  onDelete: (ideaId: string) => void;
  onUpdateStatus: (ideaId: string, newStatus: IdeaStatusEnum) => void;
  showReviewActions?: boolean; // True if displayed in a context where review actions are appropriate
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, currentUser, onDelete, onUpdateStatus, showReviewActions = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const primaryTag = idea.tags.find(tag => tag.is_primary);

  const canAdmin = currentUser.role === UserRole.ADMIN;
  const canReview = currentUser.role === UserRole.EVALUATOR || currentUser.role === UserRole.ADMIN;

  const handleApprove = () => {
    onUpdateStatus(idea.id, IdeaStatusEnum.REVIEW_APPROVED);
  };

  const handleReject = () => {
    onUpdateStatus(idea.id, IdeaStatusEnum.REVIEW_REJECTED);
  };

  const handleDelete = () => {
    onDelete(idea.id);
  };
  
  const getStatusColor = (status: IdeaStatusEnum) => {
    switch (status) {
        case IdeaStatusEnum.SUBMITTED:
        case IdeaStatusEnum.UNDER_SCREENING:
        case IdeaStatusEnum.PENDING_REVIEW:
        case IdeaStatusEnum.IN_QUESTIONNAIRE_CHAT:
             return 'bg-primary/20 text-primary-dark';
        case IdeaStatusEnum.APPROVED:
        case IdeaStatusEnum.REVIEW_APPROVED:
        case IdeaStatusEnum.SCREENING_PASSED:
            return 'bg-highlight/20 text-highlight-dark';
        case IdeaStatusEnum.REJECTED:
        case IdeaStatusEnum.REVIEW_REJECTED:
        case IdeaStatusEnum.SCREENING_FAILED:
            return 'bg-secondary/20 text-secondary-dark';
        default:
            return 'bg-neutral-light text-neutral-DEFAULT';
    }
  };


  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mb-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-start">
        <h3 className="text-2xl font-semibold text-neutral-darker mb-2">{idea.title}</h3>
        <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:text-primary-dark p-1"
            aria-label={isExpanded ? "Collapse idea details" : "Expand idea details"}
        >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      
      <div className="mb-4 flex items-center space-x-3">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(idea.status)}`}>
          {idea.status}
        </span>
        <span className="text-xs text-neutral-DEFAULT">
          Submitted by: {idea.submitterEmail === currentUser.email ? "You" : idea.submitterEmail}
        </span>
      </div>

      {idea.category_suggestion_loading && (
        <div className="flex items-center text-sm text-neutral-DEFAULT my-2 font-body-medium">
          <LoadingSpinnerIcon className="w-5 h-5 mr-2 text-primary" />
          <span>AI is categorizing your idea...</span>
        </div>
      )}

      {idea.category_suggestion_error && (
        <div className="flex items-center text-sm text-red-600 my-2 p-2 bg-red-50 rounded-md font-body-medium">
          <AlertTriangleIcon className="w-5 h-5 mr-2" />
          <span>{idea.category_suggestion_error} Could not categorize. Defaulted.</span>
        </div>
      )}

      {primaryTag && !idea.category_suggestion_loading && (
        <div className="mb-4 flex items-center text-md">
          <SparklesIcon className="w-5 h-5 mr-2 text-accent" />
          <span className="font-semibold text-neutral-darker">AI Category:</span>
          <span className="ml-2 px-2 py-1 bg-accent/20 text-accent-dark text-sm rounded-md">{primaryTag.category}</span>
        </div>
      )}
      
      {isExpanded && (
        <>
          <p className="text-neutral-darker font-body-medium mb-4 whitespace-pre-wrap">{idea.description}</p>
          
          {idea.tags.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-neutral-DEFAULT mb-1">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <span key={tag.id} className={`flex items-center px-2 py-1 text-xs font-medium rounded-full
                    ${tag.is_primary && tag.source === 'ai_categorization' ? 'bg-accent text-white' : 
                    tag.is_primary && tag.source === 'user_selection' ? 'bg-primary text-white' : 
                    'bg-neutral-light text-neutral-dark border border-neutral-DEFAULT/50'}`}>
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag.category}
                    {tag.source === 'ai_categorization' && <SparklesIcon className="w-3 h-3 ml-1.5 text-yellow-300" />}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="my-3 text-sm">
             <p>Clarity: {idea.clarityScore?.toFixed(0) ?? 'N/A'}%</p>
             {/* Add Value and Readiness scores if available */}
          </div>

          <div className="text-xs text-neutral-DEFAULT mt-4 pt-2 border-t border-neutral-light">
            <p>ID: {idea.id}</p>
            <p>Created: {idea.created_at.toLocaleDateString()} | Updated: {idea.updated_at.toLocaleDateString()}</p>
          </div>
        </>
      )}

      {showReviewActions && canReview && (idea.status === IdeaStatusEnum.PENDING_REVIEW || idea.status === IdeaStatusEnum.SUBMITTED || idea.status === IdeaStatusEnum.UNDER_SCREENING) && (
        <div className="mt-4 pt-3 border-t border-neutral-light flex items-center space-x-3">
            <button
                onClick={handleApprove}
                className="bg-highlight/80 hover:bg-highlight text-white font-semibold py-1.5 px-4 btn-rounded text-sm"
            >
                Approve
            </button>
            <button
                onClick={handleReject}
                className="bg-secondary/80 hover:bg-secondary text-white font-semibold py-1.5 px-4 btn-rounded text-sm"
            >
                Reject
            </button>
        </div>
      )}
      
      {!showReviewActions && canAdmin && isExpanded && ( // Delete button on main list for admin, if expanded
         <div className="mt-4 pt-3 border-t border-neutral-light flex justify-end">
             <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1.5 px-4 btn-rounded text-sm"
            >
                Delete Idea
            </button>
         </div>
      )}
       {showReviewActions && canAdmin && ( // Delete button on dashboard for admin
         <div className="mt-2 flex justify-end">
             <button
                onClick={handleDelete}
                className="text-xs text-red-500 hover:text-red-700 font-medium py-1 px-2"
            >
                Delete
            </button>
         </div>
      )}

    </div>
  );
};

export default IdeaCard;
