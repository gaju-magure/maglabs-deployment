import React, { useState } from 'react';
import { Lightbulb, ChevronRight, X, ArrowRight, MessageCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BeautifulTooltip } from '@/components/ui/beautiful-tooltip';

interface InterventionSuggestionsProps {
  suggestions?: string[];
  nextActions?: {
    recommended_stage?: string;
    transition_ready?: boolean;
    client_actions?: string[];
    suggested_questions?: string[];
  };
  onSuggestionClick?: (suggestion: string) => void;
  onQuestionClick?: (question: string) => void;
  className?: string;
}

export const InterventionSuggestions: React.FC<InterventionSuggestionsProps> = ({
  suggestions = [],
  nextActions,
  onSuggestionClick,
  onQuestionClick,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const formatSuggestion = (suggestion: string) => {
    const formatted = suggestion
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/^./, str => str.toUpperCase());
    
    return formatted;
  };

  const getSuggestionIcon = (suggestion: string) => {
    if (suggestion.includes('advance') || suggestion.includes('transition')) {
      return ArrowRight;
    }
    if (suggestion.includes('inject') || suggestion.includes('assumption')) {
      return TrendingUp;
    }
    return MessageCircle;
  };

  const getSuggestionVariant = (suggestion: string) => {
    if (suggestion.includes('advance') || suggestion.includes('transition')) {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    }
    if (suggestion.includes('inject') || suggestion.includes('assumption')) {
      return 'bg-purple-50 border-purple-200 text-purple-800';
    }
    return 'bg-green-50 border-green-200 text-green-800';
  };

  const activeSuggestions = suggestions.filter(s => !dismissed.includes(s));
  const hasContent = activeSuggestions.length > 0 || 
                    (nextActions?.suggested_questions && nextActions.suggested_questions.length > 0) ||
                    (nextActions?.client_actions && nextActions.client_actions.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-blue-600" />
            <h4 className="font-medium text-gray-900">Smart Suggestions</h4>
            {activeSuggestions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {activeSuggestions.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {(nextActions?.suggested_questions && nextActions.suggested_questions.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                <ChevronRight 
                  size={14} 
                  className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                />
              </Button>
            )}
          </div>
        </div>

        {/* Primary Intervention Suggestions */}
        {activeSuggestions.length > 0 && (
          <div className="space-y-2 mb-3">
            {activeSuggestions.map((suggestion, index) => {
              const Icon = getSuggestionIcon(suggestion);
              const variant = getSuggestionVariant(suggestion);
              
              return (
                <div key={index} className="group relative">
                  <BeautifulTooltip 
                    content={`AI suggests: ${formatSuggestion(suggestion)}`}
                    variant="default"
                  >
                    <div 
                      className={`
                        flex items-center gap-2 p-2 rounded border cursor-pointer
                        transition-all duration-200 hover:shadow-sm ${variant}
                      `}
                      onClick={() => onSuggestionClick?.(suggestion)}
                    >
                      <Icon size={14} />
                      <span className="text-sm flex-1">
                        {formatSuggestion(suggestion)}
                      </span>
                      <ArrowRight size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </BeautifulTooltip>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDismissed([...dismissed, suggestion]);
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    <X size={10} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Stage Transition Indicator */}
        {nextActions?.transition_ready && nextActions?.recommended_stage && (
          <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
            <div className="flex items-center gap-2 text-green-800">
              <TrendingUp size={14} />
              <span className="text-sm font-medium">
                Ready to advance to {nextActions.recommended_stage.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Client Actions */}
        {nextActions?.client_actions && nextActions.client_actions.length > 0 && (
          <div className="space-y-1 mb-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Recommended Actions:</div>
            {nextActions.client_actions.map((action, index) => (
              <div key={index} className="text-xs text-gray-700 flex items-center gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                {action.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expandable Suggested Questions */}
      {isExpanded && nextActions?.suggested_questions && nextActions.suggested_questions.length > 0 && (
        <div className="border-t border-blue-200 bg-white bg-opacity-50 p-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Suggested Questions:</div>
          <div className="space-y-2">
            {nextActions.suggested_questions.map((question, index) => (
              <div
                key={index}
                onClick={() => onQuestionClick?.(question)}
                className="
                  text-sm p-2 bg-white border border-gray-200 rounded cursor-pointer
                  hover:border-blue-300 hover:shadow-sm transition-all duration-200
                  flex items-center gap-2
                "
              >
                <MessageCircle size={12} className="text-blue-600 flex-shrink-0" />
                <span className="flex-1">{question}</span>
                <ArrowRight size={10} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};