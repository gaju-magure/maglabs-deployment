import React from 'react';
import { Clock, TrendingUp, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BeautifulTooltip } from '@/components/ui/beautiful-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSessionDetail } from '@/services/chatApi';

interface EnhancedProgressMeterProps {
  session: ChatSessionDetail;
  className?: string;
  compact?: boolean;
}

export const EnhancedProgressMeter: React.FC<EnhancedProgressMeterProps> = ({
  session,
  className = '',
  compact = false
}) => {
  const {
    stage_progress = 0,
    conversation_momentum = 0,
    progress_velocity = 0,
    conversation_health = 'good',
    estimated_remaining_seconds = 0,
    quality_metrics,
    flow_issues = [],
    transition_triggers = [],
    business_context,
    next_actions
  } = session;

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Unknown';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  const getMomentumColor = (momentum: number) => {
    if (momentum >= 0.7) return 'bg-emerald-500';
    if (momentum >= 0.4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getVelocityColor = (velocity: number) => {
    if (velocity >= 0.15) return 'text-emerald-600';
    if (velocity >= 0.08) return 'text-amber-600';
    return 'text-red-600';
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-emerald-600 bg-emerald-50';
      case 'good': return 'text-green-600 bg-green-50';
      case 'fair': return 'text-amber-600 bg-amber-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-600" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`px-2 py-1 rounded ${getHealthColor(conversation_health)}`}>
              {conversation_health}
            </div>
            {estimated_remaining_seconds > 0 && (
              <div className="text-gray-500">
                ~{formatTime(estimated_remaining_seconds)}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Main Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.max(stage_progress || 0, 2)}%` }}
            />
          </div>
          
          {/* Momentum and Velocity */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Zap size={10} />
              <span>Momentum:</span>
              <div className="w-8 h-1 bg-gray-200 rounded-full">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getMomentumColor(conversation_momentum)}`}
                  style={{ width: `${Math.max(conversation_momentum * 100, 5)}%` }}
                />
              </div>
            </div>
            <div className={`${getVelocityColor(progress_velocity)}`}>
              Velocity: {(progress_velocity * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            Conversation Progress
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(conversation_health)}`}>
            {conversation_health}
          </div>
        </div>

        {/* Stage Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-mono font-medium">{Math.round(stage_progress || 0)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 relative"
              style={{ width: `${Math.max(stage_progress || 0, 2)}%` }}
            >
              {/* Animated progress indicator */}
              <div className="absolute inset-0 bg-white opacity-30 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Momentum and Velocity */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <BeautifulTooltip content="How much forward momentum the conversation has">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap size={14} />
                Momentum
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getMomentumColor(conversation_momentum)}`}
                  style={{ width: `${Math.max(conversation_momentum * 100, 5)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {(conversation_momentum * 100).toFixed(1)}%
              </div>
            </div>
          </BeautifulTooltip>

          <BeautifulTooltip content="Rate of progress through conversation stages">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp size={14} />
                Velocity
              </div>
              <div className={`text-2xl font-bold ${getVelocityColor(progress_velocity)}`}>
                {(progress_velocity * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                per exchange
              </div>
            </div>
          </BeautifulTooltip>
        </div>

        {/* Time Estimate */}
        {estimated_remaining_seconds > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Clock size={14} />
            <span>Estimated time remaining: </span>
            <span className="font-medium text-gray-900">
              {formatTime(estimated_remaining_seconds)}
            </span>
          </div>
        )}
      </div>

      {/* Issues and Triggers */}
      <ScrollArea className="max-h-40">
        <div className="p-4 space-y-3">
          {/* Flow Issues */}
          {flow_issues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle size={14} />
                Detected Issues
              </div>
              <div className="flex flex-wrap gap-1">
                {flow_issues.map((issue, index) => (
                  <Badge key={index} variant="outline" className="text-amber-700 border-amber-300">
                    {issue.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Transition Triggers */}
          {transition_triggers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle size={14} />
                Ready to Advance
              </div>
              <div className="flex flex-wrap gap-1">
                {transition_triggers.map((trigger, index) => (
                  <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                    {trigger.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Intervention Suggestions */}
          {quality_metrics?.intervention_suggestions && quality_metrics.intervention_suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-700">
                Suggested Actions
              </div>
              <div className="space-y-1">
                {quality_metrics.intervention_suggestions.map((suggestion, index) => (
                  <div key={index} className="text-xs text-blue-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full" />
                    {suggestion.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Context Metrics */}
          {business_context && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Business Context
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {business_context.problem_clarity !== undefined && (
                  <div className="flex justify-between">
                    <span>Problem Clarity:</span>
                    <span className="font-mono">{Math.round(business_context.problem_clarity * 100)}%</span>
                  </div>
                )}
                {business_context.solution_readiness !== undefined && (
                  <div className="flex justify-between">
                    <span>Solution Ready:</span>
                    <span className="font-mono">{Math.round(business_context.solution_readiness * 100)}%</span>
                  </div>
                )}
                {business_context.technical_sophistication !== undefined && (
                  <div className="flex justify-between">
                    <span>Tech Level:</span>
                    <span className="font-mono">{Math.round(business_context.technical_sophistication * 100)}%</span>
                  </div>
                )}
                {business_context.urgency_level && (
                  <div className="flex justify-between">
                    <span>Urgency:</span>
                    <Badge variant="outline" className="text-xs">
                      {business_context.urgency_level}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};