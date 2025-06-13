/**
 * Utilities for extracting and working with stage progression data from chat messages
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ai_metadata?: {
    stage_name?: string;
    stage_completion?: { [stageName: string]: number };
    business_context?: {
      problem_clarity?: number;
      solution_readiness?: number;
      profile_completion_score?: number;
      technical_sophistication?: number;
      implementation_readiness?: number;
      stakeholder_engagement?: number;
      urgency_level?: string;
      budget_signals?: string;
      decision_authority?: string;
    };
    transition_ready?: boolean;
    conversation_health?: string;
    next_stage?: string;
    ai_confidence?: number;
    assumptions_made?: string[];
    clarification_needed?: boolean;
    // Legacy fields for backward compatibility
    stage?: string;
    stage_progress?: number;
    suggested_actions?: string[];
  };
  created_at: string;
}

export interface StageProgressData {
  stage_name: string;
  stage_completion: { [stageName: string]: number };
  business_context: {
    problem_clarity: number;
    solution_readiness: number;
    profile_completion_score: number;
    technical_sophistication?: number;
    implementation_readiness?: number;
    stakeholder_engagement?: number;
    urgency_level?: string;
    budget_signals?: string;
    decision_authority?: string;
  };
  transition_ready: boolean;
  conversation_health: string;
  next_stage?: string;
  ai_confidence?: number;
  assumptions_made?: string[];
  clarification_needed?: boolean;
  hasStageData: boolean;
  lastUpdated?: string;
}

/**
 * Extract the latest stage progression data from a list of chat messages
 */
export const getLatestStageProgression = (messages: ChatMessage[]): StageProgressData => {
  // Find the most recent assistant message with stage data
  const assistantMessages = messages
    .filter(msg => msg.role === 'assistant' && msg.ai_metadata)
    .reverse(); // Start from most recent
  
  for (const message of assistantMessages) {
    const metadata = message.ai_metadata!;
    
    // Check if this message has stage progression data
    if (metadata.stage_name || metadata.stage || metadata.business_context) {
      return {
        stage_name: metadata.stage_name || metadata.stage || 'initialization',
        stage_completion: metadata.stage_completion || {},
        business_context: {
          problem_clarity: metadata.business_context?.problem_clarity || 0,
          solution_readiness: metadata.business_context?.solution_readiness || 0,
          profile_completion_score: metadata.business_context?.profile_completion_score || 0,
          technical_sophistication: metadata.business_context?.technical_sophistication,
          implementation_readiness: metadata.business_context?.implementation_readiness,
          stakeholder_engagement: metadata.business_context?.stakeholder_engagement,
          urgency_level: metadata.business_context?.urgency_level,
          budget_signals: metadata.business_context?.budget_signals,
          decision_authority: metadata.business_context?.decision_authority,
        },
        transition_ready: metadata.transition_ready || false,
        conversation_health: metadata.conversation_health || 'good',
        next_stage: metadata.next_stage,
        ai_confidence: metadata.ai_confidence,
        assumptions_made: metadata.assumptions_made,
        clarification_needed: metadata.clarification_needed,
        hasStageData: true,
        lastUpdated: message.created_at
      };
    }
  }
  
  // Return default state if no stage data found
  return {
    stage_name: 'initialization',
    stage_completion: {},
    business_context: {
      problem_clarity: 0,
      solution_readiness: 0,
      profile_completion_score: 0,
    },
    transition_ready: false,
    conversation_health: 'good',
    hasStageData: false
  };
};

/**
 * Check if a conversation has progressed beyond the initialization stage
 */
export const hasActiveStageProgression = (messages: ChatMessage[]): boolean => {
  const stageData = getLatestStageProgression(messages);
  return stageData.hasStageData && stageData.stage_name !== 'initialization';
};

/**
 * Get the overall completion percentage based on stage progression
 */
export const getOverallCompletionPercentage = (stageData: StageProgressData): number => {
  const stages = [
    'initialization',
    'user_profiling', 
    'problem_capture',
    'problem_clarification',
    'solution_brainstorming',
    'value_proposition',
    'report_generation',
    'completed'
  ];
  
  const currentStageIndex = stages.indexOf(stageData.stage_name);
  if (currentStageIndex === -1) return 0;
  
  // Base completion based on current stage
  const baseCompletion = (currentStageIndex / (stages.length - 1)) * 100;
  
  // Add progress within current stage based on transition readiness
  const stageBonus = stageData.transition_ready ? 10 : 0;
  
  return Math.min(100, baseCompletion + stageBonus);
};

/**
 * Get human-readable stage name for display
 */
export const getStageDisplayName = (stageName: string): string => {
  const stageNames: { [key: string]: string } = {
    'initialization': 'Introductions',
    'user_profiling': 'Getting to Know You',
    'problem_capture': 'Exploring Your Suggestion', 
    'problem_clarification': 'Understanding the Problem',
    'solution_brainstorming': 'Developing Your Idea',
    'value_proposition': 'Collaborative Refinement',
    'report_generation': 'Summary & Next Steps',
    'completed': 'Insights Capture'
  };
  
  return stageNames[stageName] || stageName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Check if any business context scores meet their thresholds
 */
export const getThresholdStatus = (stageData: StageProgressData) => {
  return {
    profileComplete: stageData.business_context.profile_completion_score >= 0.70,
    problemClear: stageData.business_context.problem_clarity >= 0.75,
    solutionReady: stageData.business_context.solution_readiness >= 0.80,
  };
};

export default {
  getLatestStageProgression,
  hasActiveStageProgression, 
  getOverallCompletionPercentage,
  getStageDisplayName,
  getThresholdStatus
};