import React from 'react';
import { Brain, Eye, HelpCircle, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BeautifulTooltip } from '@/components/ui/beautiful-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AITransparencyPanelProps {
  aiState?: {
    response_confidence?: number;
    assumptions_made?: string[];
    assumption_confidence?: number;
    clarification_needed?: boolean;
    clarification_topics?: string[];
    reasoning?: string;
    alternative_approaches?: string[];
  };
  className?: string;
}

export const AITransparencyPanel: React.FC<AITransparencyPanelProps> = ({
  aiState,
  className = ''
}) => {
  if (!aiState) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-sm text-gray-500 text-center">
          AI transparency data not available
        </div>
      </div>
    );
  }

  const {
    response_confidence = 0.8,
    assumptions_made = [],
    assumption_confidence = 0,
    clarification_needed = false,
    clarification_topics = [],
    reasoning = '',
    alternative_approaches = []
  } = aiState;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (confidence >= 0.6) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatAssumption = (assumption: string) => {
    // Convert technical assumption strings to human-readable format
    return assumption
      .replace(/role_based_assumptions:/, 'Role: ')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/^./, str => str.toUpperCase());
  };

  const confidencePercentage = Math.round(response_confidence * 100);
  const assumptionPercentage = Math.round(assumption_confidence * 100);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Confidence Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Confidence</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Response Confidence</span>
            <BeautifulTooltip 
              content="How confident the AI is about its response accuracy"
              variant="default"
            >
              <div className={`
                px-3 py-1 rounded-full border text-sm font-medium
                ${getConfidenceColor(response_confidence)}
              `}>
                {confidencePercentage}%
              </div>
            </BeautifulTooltip>
          </div>
          
          {assumption_confidence > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Assumption Confidence</span>
              <BeautifulTooltip 
                content="How confident the AI is about the assumptions it has made"
                variant="default"
              >
                <div className={`
                  px-3 py-1 rounded-full border text-sm font-medium
                  ${getConfidenceColor(assumption_confidence)}
                `}>
                  {assumptionPercentage}%
                </div>
              </BeautifulTooltip>
            </div>
          )}
        </div>
      </div>

      {/* Assumptions Made */}
      {assumptions_made.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI Assumptions</h3>
            <BeautifulTooltip 
              content="Assumptions the AI has made about your context to provide better responses"
              variant="default"
            >
              <HelpCircle size={14} className="text-gray-400" />
            </BeautifulTooltip>
          </div>
          
          <div className="space-y-2">
            {assumptions_made.map((assumption, index) => (
              <div key={index} className="flex items-start gap-2">
                <Eye size={12} className="text-purple-500 mt-1 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {formatAssumption(assumption)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clarification Needed */}
      {clarification_needed && (
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-amber-600" />
            <h3 className="font-semibold text-gray-900">Clarification Needed</h3>
          </div>
          
          {clarification_topics.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-2">
                The AI would benefit from clarification on:
              </p>
              {clarification_topics.map((topic, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-2">
                  {topic.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700">
              The AI has identified that some clarification would help improve the conversation.
            </p>
          )}
        </div>
      )}

      {/* AI Reasoning */}
      {reasoning && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">AI Reasoning</h3>
          </div>
          
          <ScrollArea className="max-h-24">
            <p className="text-sm text-gray-700 leading-relaxed">
              {reasoning}
            </p>
          </ScrollArea>
        </div>
      )}

      {/* Alternative Approaches */}
      {alternative_approaches.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">Alternative Approaches</h3>
          </div>
          
          <div className="space-y-2">
            {alternative_approaches.map((approach, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {approach.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};