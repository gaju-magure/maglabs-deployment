import React, { useState } from 'react';
import { CheckCircle, Circle, ArrowRight, Clock, Lightbulb, Search, Cog, Target, FileText, Award, ChevronDown, ChevronRight, TrendingUp, Zap, Award as Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BeautifulTooltip } from '@/components/ui/beautiful-tooltip';
import { cn } from '@/lib/utils';

interface StageData {
  stage_name?: string;
  stage_completion?: { [stageName: string]: number };
  business_context?: {
    problem_clarity?: number;
    solution_readiness?: number;
    profile_completion_score?: number;
  };
  transition_ready?: boolean;
  conversation_health?: string;
  next_stage?: string;
}

interface StageProgressMeterProps {
  stageData: StageData;
  compact?: boolean;
  density?: 'compact' | 'comfortable' | 'spacious';
  currentStageProgress?: number;
}

interface StageInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  threshold?: number;
  scoreKey?: keyof StageData['business_context'];
}

const STAGE_DEFINITIONS: StageInfo[] = [
  // {
  //   id: 'initialization',
  //   name: 'Introductions',
  //   shortName: 'Intro',
  //   description: 'Getting to know you and setting up the conversation',
  //   icon: <Circle className="w-4 h-4" />,
  //   color: 'bg-gray-500'
  // },
  {
    id: 'user_profiling',
    name: 'User Profiling',
    shortName: 'Profile',
    description: 'Understanding your background, role, and context',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'bg-blue-500',
    threshold: 0.70,
    scoreKey: 'profile_completion_score'
  },
  {
    id: 'problem_capture',
    name: 'Exploring Your Suggestion',
    shortName: 'Explore',
    description: 'Diving deep into your idea or problem',
    icon: <Search className="w-4 h-4" />,
    color: 'bg-purple-500'
  },
  {
    id: 'problem_clarification',
    name: 'Understanding the Problem',
    shortName: 'Clarify',
    description: 'Getting clarity on the problem or opportunity',
    icon: <Cog className="w-4 h-4" />,
    color: 'bg-yellow-500',
    threshold: 0.75,
    scoreKey: 'problem_clarity'
  },
  {
    id: 'solution_brainstorming',
    name: 'Developing Your Idea',
    shortName: 'Develop',
    description: 'Brainstorming and refining potential solutions',
    icon: <Target className="w-4 h-4" />,
    color: 'bg-green-500',
    threshold: 0.80,
    scoreKey: 'solution_readiness'
  },
  {
    id: 'value_proposition',
    name: 'Collaborative Refinement',
    shortName: 'Refine',
    description: 'Working together to polish your solution',
    icon: <Award className="w-4 h-4" />,
    color: 'bg-indigo-500'
  },
  {
    id: 'report_generation',
    name: 'Summary & Next Steps',
    shortName: 'Summary',
    description: 'Wrapping up with actionable insights',
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-orange-500'
  },
  {
    id: 'completed',
    name: 'Insights Capture',
    shortName: 'Complete',
    description: 'Session completed with captured insights',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-emerald-500'
  }
];

const getStageStatus = (stage: StageInfo, currentStage: string, stageCompletion: { [key: string]: number }, businessContext: StageData['business_context']) => {
  const currentIndex = STAGE_DEFINITIONS.findIndex(s => s.id === currentStage);
  const stageIndex = STAGE_DEFINITIONS.findIndex(s => s.id === stage.id);
  
  if (stageIndex < currentIndex) {
    return 'completed';
  } else if (stageIndex === currentIndex) {
    return 'current';
  } else {
    return 'pending';
  }
};

const getScoreForStage = (stage: StageInfo, businessContext: StageData['business_context']) => {
  if (!stage.scoreKey || !businessContext) return null;
  return businessContext[stage.scoreKey] || 0;
};

// Enhanced Progress Ring Component
const ProgressRing: React.FC<{ 
  progress: number; 
  size?: 'sm' | 'md' | 'lg';
  thickness?: number;
  showPercentage?: boolean;
  className?: string;
  color?: string;
}> = ({ 
  progress, 
  size = 'md',
  thickness,
  showPercentage = true,
  className,
  color = '#10b981'
}) => {
  const sizes = {
    sm: { width: 40, radius: 16, stroke: thickness || 3 },
    md: { width: 56, radius: 22, stroke: thickness || 4 },
    lg: { width: 80, radius: 32, stroke: thickness || 5 }
  };
  
  const { width, radius, stroke } = sizes[size];
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(Math.max(progress * 100, 0), 100);
  const offset = circumference - (progressPercent / 100) * circumference;
  
  return (
    <div className={cn(`relative`, className)} style={{ width, height: width }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle with gradient */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          strokeLinecap="round"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))'
          }}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-bold text-gray-900",
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'
          )}>
            {Math.round(progressPercent)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Progress Header Component
const ProgressHeader: React.FC<{
  currentStage: string;
  overallProgress: number;
  health: string;
  stageCount: number;
  completedStages: number;
  compact?: boolean;
}> = ({ currentStage, overallProgress, health, stageCount, completedStages, compact = false }) => {
  const healthColors = {
    excellent: 'bg-green-100 text-green-800 border-green-200',
    good: 'bg-blue-100 text-blue-800 border-blue-200',
    fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    poor: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Card className={cn(
      "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
      compact ? "mb-3" : "mb-4"
    )}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-3")}>
          <div>
            <h3 className={cn(
              "font-bold text-gray-900",
              compact ? "text-sm mb-0.5" : "text-lg mb-1"
            )}>
              Interview Progress
            </h3>
            <p className={cn(
              "text-gray-600",
              compact ? "text-xs" : "text-sm"
            )}>
              Stage {completedStages + 1} of {stageCount} • {currentStage}
            </p>
          </div>
          <Badge className={cn(
            "border",
            compact ? "px-2 py-0.5 text-xs" : "px-3 py-1",
            healthColors[health as keyof typeof healthColors] || healthColors.good
          )}>
            <TrendingUp size={compact ? 10 : 12} className="mr-1" />
            {health || 'Good'}
          </Badge>
        </div>
        
        <div className={cn("flex items-center", compact ? "gap-3" : "gap-4")}>
          <ProgressRing 
            progress={overallProgress} 
            size={compact ? "md" : "lg"} 
            color="#3b82f6"
            className="flex-shrink-0"
          />
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className={cn(
                  "font-bold text-green-600",
                  compact ? "text-lg" : "text-xl"
                )}>{completedStages}</div>
                <div className={cn(
                  "text-gray-500 uppercase tracking-wide",
                  compact ? "text-xs" : "text-xs"
                )}>Done</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "font-bold text-blue-600",
                  compact ? "text-lg" : "text-xl"
                )}>1</div>
                <div className={cn(
                  "text-gray-500 uppercase tracking-wide",
                  compact ? "text-xs" : "text-xs"
                )}>Active</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "font-bold text-gray-400",
                  compact ? "text-lg" : "text-xl"
                )}>{stageCount - completedStages - 1}</div>
                <div className={cn(
                  "text-gray-500 uppercase tracking-wide",
                  compact ? "text-xs" : "text-xs"
                )}>Left</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Stage Card Component
const StageCard: React.FC<{
  stage: StageInfo;
  status: 'completed' | 'current' | 'pending';
  score?: number;
  isExpanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}> = ({ stage, status, score, isExpanded, onToggle, compact = false }) => {
  const statusStyles = {
    completed: {
      card: 'bg-green-50 border-green-200 hover:bg-green-100',
      icon: 'bg-green-500 text-white',
      text: 'text-green-900',
      secondary: 'text-green-700'
    },
    current: {
      card: 'bg-blue-50 border-blue-300 hover:bg-blue-100 ring-2 ring-blue-200',
      icon: 'bg-blue-500 text-white',
      text: 'text-blue-900',
      secondary: 'text-blue-700'
    },
    pending: {
      card: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      icon: 'bg-gray-300 text-gray-600',
      text: 'text-gray-600',
      secondary: 'text-gray-500'
    }
  };

  const styles = statusStyles[status];
  const hasScore = score !== undefined && score !== null;

  return (
    <Card className={cn(
      "transition-all duration-300 cursor-pointer",
      styles.card,
      compact && "mb-2"
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-center gap-3" onClick={onToggle}>
          {/* Stage Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
            styles.icon,
            compact && "w-8 h-8"
          )}>
            {status === 'completed' ? (
              <CheckCircle className={cn("w-5 h-5", compact && "w-4 h-4")} />
            ) : (
              React.cloneElement(stage.icon as React.ReactElement, { 
                className: cn("w-5 h-5", compact && "w-4 h-4") 
              })
            )}
          </div>

          {/* Stage Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "font-semibold truncate",
                styles.text,
                compact ? "text-sm" : "text-base"
              )}>
                {stage.name}
              </h4>
              {status === 'current' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  Active
                </Badge>
              )}
            </div>
            <p className={cn(
              "text-sm leading-relaxed",
              styles.secondary,
              compact && "text-xs",
              !isExpanded && "line-clamp-1"
            )}>
              {stage.description}
            </p>
          </div>

          {/* Progress & Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasScore && (
              <ProgressRing 
                progress={score} 
                size={compact ? "sm" : "md"}
                color={status === 'completed' ? '#10b981' : status === 'current' ? '#3b82f6' : '#9ca3af'}
              />
            )}
            <Button variant="ghost" size="sm" className="p-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {hasScore && stage.threshold && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress Target:</span>
                <span className={cn(
                  "font-medium",
                  score >= stage.threshold ? "text-green-600" : "text-amber-600"
                )}>
                  {Math.round(score * 100)}% / {Math.round(stage.threshold * 100)}%
                  {score >= stage.threshold && " ✓"}
                </span>
              </div>
            )}
            
            <div className="bg-white rounded-lg p-3 text-sm">
              <h5 className="font-medium text-gray-900 mb-2">Stage Details</h5>
              <p className="text-gray-600 leading-relaxed">{stage.description}</p>
              
              {stage.threshold && (
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Success Criteria:</strong> Achieve {Math.round(stage.threshold * 100)}% completion to advance to the next stage.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const StageProgressMeter: React.FC<StageProgressMeterProps> = ({ 
  stageData, 
  compact = false,
  density = 'comfortable',
  currentStageProgress = 0
}) => {
  // Start with only current stage expanded for better space management
  const currentStage = stageData.stage_name || 'initialization';
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    compact ? new Set() : new Set([currentStage])
  );
  
  const stageCompletion = stageData.stage_completion || {};
  const businessContext = stageData.business_context || {};
  
  const currentStageInfo = STAGE_DEFINITIONS.find(s => s.id === currentStage);
  const currentIndex = STAGE_DEFINITIONS.findIndex(s => s.id === currentStage);
  
  // Check if we have any meaningful stage data
  const hasStageData = stageData.stage_name || Object.keys(businessContext).some(key => businessContext[key] !== undefined);
  
  // Calculate overall progress using current stage progress
  const completedStages = Math.max(0, currentIndex);
  const stageProgressBonus = currentStageProgress > 0 ? Math.min(currentStageProgress / 100, 1) : 0.5;
  const overallProgress = Math.min((completedStages + stageProgressBonus) / STAGE_DEFINITIONS.length, 1);
  
  const toggleStageExpansion = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };
  
  // Show placeholder when no stage data is available
  if (!hasStageData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Awaiting Stage Data</h3>
            <p className="text-gray-500 text-sm mb-4">
              Stage progression will appear here once the interview begins and the AI starts tracking your progress.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 Start by sharing your idea or business challenge to begin the structured interview process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact Header */}
        <ProgressHeader 
          currentStage={currentStageInfo?.name || 'Unknown'}
          overallProgress={overallProgress}
          health={stageData.conversation_health || 'good'}
          stageCount={STAGE_DEFINITIONS.length}
          completedStages={completedStages}
          compact={true}
        />
        
        {/* Compact Stage List */}
        <div className="space-y-1.5">
          {STAGE_DEFINITIONS.map((stage, index) => {
            const status = getStageStatus(stage, currentStage, stageCompletion, businessContext);
            // Use currentStageProgress for the active stage, or business context scores for others
            const score = status === 'current' 
              ? currentStageProgress 
              : getScoreForStage(stage, businessContext);
            const isExpanded = expandedStages.has(stage.id);
            
            return (
              <StageCard
                key={stage.id}
                stage={stage}
                status={status}
                score={score}
                isExpanded={isExpanded}
                onToggle={() => toggleStageExpansion(stage.id)}
                compact={true}
              />
            );
          })}
        </div>
        
        {/* Next Steps for Mobile */}
        {stageData.next_stage && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mt-3">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-semibold text-blue-900">Up Next</span>
              </div>
              <p className="text-xs text-blue-800">
                {STAGE_DEFINITIONS.find(s => s.id === stageData.next_stage)?.name}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header */}
      <ProgressHeader 
        currentStage={currentStageInfo?.name || 'Unknown'}
        overallProgress={overallProgress}
        health={stageData.conversation_health || 'good'}
        stageCount={STAGE_DEFINITIONS.length}
        completedStages={completedStages}
        compact={false}
      />
      
      {/* Enhanced Stage Grid */}
      <div className="space-y-3">
        <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-blue-600" />
          Stage Progression
        </h4>
        
        <div className="grid gap-2">
          {STAGE_DEFINITIONS.map((stage, index) => {
            const status = getStageStatus(stage, currentStage, stageCompletion, businessContext);
            // Use currentStageProgress for the active stage, or business context scores for others
            const score = status === 'current' 
              ? currentStageProgress 
              : getScoreForStage(stage, businessContext);
            const isExpanded = expandedStages.has(stage.id);
            
            return (
              <StageCard
                key={stage.id}
                stage={stage}
                status={status}
                score={score}
                isExpanded={isExpanded}
                onToggle={() => toggleStageExpansion(stage.id)}
                compact={false}
              />
            );
          })}
        </div>
      </div>
      
      {/* Enhanced Next Steps & Insights */}
      {stageData.next_stage && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900 text-sm">Ready for Next Stage</h4>
                <p className="text-xs text-emerald-700">Continue your progress journey</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-900 mb-1">
                <strong>Up Next:</strong> {STAGE_DEFINITIONS.find(s => s.id === stageData.next_stage)?.name}
              </p>
              <p className="text-xs text-gray-600">
                {STAGE_DEFINITIONS.find(s => s.id === stageData.next_stage)?.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Compact Progress Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-3">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-base font-bold text-gray-900">{Math.round(overallProgress * 100)}%</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Progress</div>
            </div>
            <div>
              <div className="text-base font-bold text-green-600">{completedStages}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Done</div>
            </div>
            <div>
              <div className="text-base font-bold text-blue-600">
                {Object.keys(businessContext).length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Metrics</div>
            </div>
            <div>
              <div className="text-base font-bold text-purple-600">
                {stageData.conversation_health || 'Good'}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Health</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StageProgressMeter;