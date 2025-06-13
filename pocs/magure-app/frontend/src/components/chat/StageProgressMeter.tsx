import React from 'react';
import { CheckCircle, Circle, ArrowRight, Clock, Lightbulb, Search, Cog, Target, FileText, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  {
    id: 'initialization',
    name: 'Introductions',
    shortName: 'Intro',
    description: 'Getting to know you and setting up the conversation',
    icon: <Circle className="w-4 h-4" />,
    color: 'bg-gray-500'
  },
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

const ScoreCircle: React.FC<{ score: number; threshold?: number; size?: 'sm' | 'md' }> = ({ 
  score, 
  threshold, 
  size = 'sm' 
}) => {
  const radius = size === 'sm' ? 12 : 16;
  const strokeWidth = size === 'sm' ? 2 : 3;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(score * 100, 100);
  const offset = circumference - (scorePercent / 100) * circumference;
  
  const meetsThreshold = threshold ? score >= threshold : true;
  const strokeColor = meetsThreshold ? '#10b981' : '#f59e0b'; // green or amber
  
  return (
    <div className={`relative ${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size === 'sm' ? 12 : 16}
          cy={size === 'sm' ? 12 : 16}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size === 'sm' ? 12 : 16}
          cy={size === 'sm' ? 12 : 16}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900`}>
          {Math.round(scorePercent)}
        </span>
      </div>
    </div>
  );
};

export const StageProgressMeter: React.FC<StageProgressMeterProps> = ({ 
  stageData, 
  compact = false 
}) => {
  const currentStage = stageData.stage_name || 'initialization';
  const stageCompletion = stageData.stage_completion || {};
  const businessContext = stageData.business_context || {};
  
  const currentStageInfo = STAGE_DEFINITIONS.find(s => s.id === currentStage);
  const currentIndex = STAGE_DEFINITIONS.findIndex(s => s.id === currentStage);
  
  // Check if we have any meaningful stage data
  const hasStageData = stageData.stage_name || Object.keys(businessContext).some(key => businessContext[key] !== undefined);
  
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
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${currentStageInfo?.color} flex items-center justify-center text-white`}>
                {currentStageInfo?.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{currentStageInfo?.name}</h3>
                <p className="text-xs text-gray-600">{currentStageInfo?.description}</p>
              </div>
            </div>
            <Badge variant={stageData.transition_ready ? 'default' : 'secondary'}>
              {stageData.transition_ready ? 'Ready to advance' : 'In progress'}
            </Badge>
          </div>
          
          {/* Progress scores */}
          <div className="flex gap-4 justify-center">
            {businessContext.profile_completion_score !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <ScoreCircle score={businessContext.profile_completion_score} threshold={0.70} />
                      <p className="text-xs mt-1">Profile</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Profile Completeness (≥70% needed)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {businessContext.problem_clarity !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <ScoreCircle score={businessContext.problem_clarity} threshold={0.75} />
                      <p className="text-xs mt-1">Clarity</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Problem Clarity (≥75% needed)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {businessContext.solution_readiness !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <ScoreCircle score={businessContext.solution_readiness} threshold={0.80} />
                      <p className="text-xs mt-1">Solution</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Solution Readiness (≥80% needed)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Interview Progress</h3>
          <Badge 
            variant={stageData.conversation_health === 'excellent' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {stageData.conversation_health || 'good'}
          </Badge>
        </div>
        
        {/* Stage progression */}
        <div className="space-y-4">
          {STAGE_DEFINITIONS.map((stage, index) => {
            const status = getStageStatus(stage, currentStage, stageCompletion, businessContext);
            const score = getScoreForStage(stage, businessContext);
            const isActive = status === 'current';
            const isCompleted = status === 'completed';
            const isPending = status === 'pending';
            
            return (
              <div key={stage.id} className="flex items-center gap-4">
                {/* Stage indicator */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isCompleted ? stage.color + ' text-white' : ''}
                  ${isActive ? stage.color + ' text-white ring-2 ring-offset-2 ring-blue-500' : ''}
                  ${isPending ? 'bg-gray-200 text-gray-400' : ''}
                `}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : stage.icon}
                </div>
                
                {/* Stage info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isActive ? 'text-blue-600' : isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                      {stage.name}
                    </h4>
                    {score !== null && (
                      <ScoreCircle score={score} threshold={stage.threshold} size="md" />
                    )}
                  </div>
                  <p className={`text-sm ${isPending ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stage.description}
                  </p>
                  {stage.threshold && score !== null && (
                    <p className="text-xs text-gray-500">
                      Threshold: {(stage.threshold * 100)}% {score >= stage.threshold ? '✓' : ''}
                    </p>
                  )}
                </div>
                
                {/* Connection line */}
                {index < STAGE_DEFINITIONS.length - 1 && (
                  <div className="w-8 flex justify-center">
                    <ArrowRight className={`w-4 h-4 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Next steps */}
        {stageData.next_stage && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Next Stage</span>
            </div>
            <p className="text-sm text-blue-800 mt-1">
              Ready to move to: {STAGE_DEFINITIONS.find(s => s.id === stageData.next_stage)?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StageProgressMeter;