import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { BeautifulTooltip } from '@/components/ui/beautiful-tooltip';

interface ConversationHealthIndicatorProps {
  health: 'excellent' | 'good' | 'fair' | 'poor';
  momentum?: number;
  velocity?: number;
  stuckIndicators?: string[];
  progressIndicators?: string[];
  className?: string;
}

export const ConversationHealthIndicator: React.FC<ConversationHealthIndicatorProps> = ({
  health,
  momentum = 0,
  velocity = 0,
  stuckIndicators = [],
  progressIndicators = [],
  className = ''
}) => {
  const getHealthConfig = () => {
    switch (health) {
      case 'excellent':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'Excellent',
          description: 'Conversation is flowing smoothly with high engagement'
        };
      case 'good':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Good',
          description: 'Conversation is progressing well with good momentum'
        };
      case 'fair':
        return {
          icon: Info,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Fair',
          description: 'Conversation needs some guidance to improve flow'
        };
      case 'poor':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Poor',
          description: 'Conversation is struggling and may need intervention'
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          description: 'Health status unavailable'
        };
    }
  };

  const config = getHealthConfig();
  const Icon = config.icon;

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold">Conversation Health: {config.label}</div>
      <div className="text-sm text-gray-600">{config.description}</div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Momentum:</span>
          <span className="font-mono">{(momentum * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Velocity:</span>
          <span className="font-mono">{(velocity * 100).toFixed(1)}%</span>
        </div>
      </div>

      {stuckIndicators.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-amber-700">Issues Detected:</div>
          <ul className="text-xs text-amber-600 mt-1 space-y-1">
            {stuckIndicators.map((indicator, index) => (
              <li key={index} className="flex items-center gap-1">
                <AlertTriangle size={10} />
                {indicator.replace('_', ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {progressIndicators.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-green-700">Progress Indicators:</div>
          <ul className="text-xs text-green-600 mt-1 space-y-1">
            {progressIndicators.map((indicator, index) => (
              <li key={index} className="flex items-center gap-1">
                <CheckCircle size={10} />
                {indicator.replace('_', ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <BeautifulTooltip content={tooltipContent} variant="glass" size="lg">
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border 
        ${config.bgColor} ${config.borderColor} ${className}
      `}>
        <Icon size={14} className={config.color} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        
        {/* Momentum indicator */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              momentum > 0.7 ? 'bg-emerald-500' : 
              momentum > 0.4 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(momentum * 100, 10)}%` }}
          />
        </div>
      </div>
    </BeautifulTooltip>
  );
};