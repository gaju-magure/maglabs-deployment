import { useEffect, useRef, useCallback } from 'react';
import { ChatSessionDetail } from '@/services/chatApi';
import { toast } from '@/hooks/use-toast';

export interface ConversationHealthMonitor {
  checkHealth: (session: ChatSessionDetail, skipMomentumWarning?: boolean) => void;
  resetMonitoring: () => void;
  shouldShowMomentumWarning: (momentum: number, messageCount: number, timeSinceLastWarning: number) => boolean;
  markMomentumWarningShown: () => void;
}

export const useConversationHealth = (): ConversationHealthMonitor => {
  const lastHealthCheck = useRef<string>('good');
  const stagnationStartTime = useRef<number | null>(null);
  const lastStageProgress = useRef<number>(0);
  const progressStagnationTime = useRef<number | null>(null);
  const notificationShown = useRef<Set<string>>(new Set());
  const lastMomentumWarningTime = useRef<number>(0);

  const checkHealth = useCallback((session: ChatSessionDetail, skipMomentumWarning: boolean = false) => {
    if (!session) return;

    const currentHealth = session.conversation_health || 'good';
    const currentProgress = session.stage_progress || 0;
    const flowIssues = session.flow_issues || [];
    const momentum = session.conversation_momentum || 0;
    const velocity = session.progress_velocity || 0;
    const interventions = session.quality_metrics?.intervention_suggestions || [];

    // Health degradation detection
    if (currentHealth !== lastHealthCheck.current) {
      if (currentHealth === 'poor' && !notificationShown.current.has('health_poor')) {
        toast({
          title: "Conversation Health Alert",
          description: "The conversation may benefit from some guidance to improve flow.",
          variant: "destructive",
        });
        notificationShown.current.add('health_poor');
      } else if (currentHealth === 'fair' && lastHealthCheck.current === 'good' && !notificationShown.current.has('health_fair')) {
        toast({
          title: "Conversation Health",
          description: "The conversation flow could be improved with some adjustments.",
          variant: "default",
        });
        notificationShown.current.add('health_fair');
      } else if (currentHealth === 'good' || currentHealth === 'excellent') {
        // Reset notifications when health improves
        notificationShown.current.clear();
      }
      lastHealthCheck.current = currentHealth;
    }

    // Stage stagnation detection
    if (flowIssues.includes('stage_stagnation')) {
      if (!stagnationStartTime.current) {
        stagnationStartTime.current = Date.now();
      } else {
        const stagnationDuration = Date.now() - stagnationStartTime.current;
        
        // Alert after 5 minutes of stagnation
        if (stagnationDuration > 5 * 60 * 1000 && !notificationShown.current.has('stage_stagnation')) {
          toast({
            title: "Stage Stagnation Detected",
            description: "The conversation has been in the same stage for a while. Consider moving forward or asking clarifying questions.",
            variant: "default",
          });
          notificationShown.current.add('stage_stagnation');
        }
      }
    } else {
      stagnationStartTime.current = null;
    }

    // Progress stagnation detection
    if (currentProgress === lastStageProgress.current && currentProgress > 0) {
      if (!progressStagnationTime.current) {
        progressStagnationTime.current = Date.now();
      } else {
        const progressStagnationDuration = Date.now() - progressStagnationTime.current;
        
        // Alert after 10 exchanges without progress
        if (progressStagnationDuration > 3 * 60 * 1000 && !notificationShown.current.has('progress_stagnation')) {
          toast({
            title: "Progress Stagnation",
            description: "Progress hasn't advanced in a while. Try a different approach or ask for clarification.",
            variant: "default",
          });
          notificationShown.current.add('progress_stagnation');
        }
      }
    } else {
      progressStagnationTime.current = null;
      lastStageProgress.current = currentProgress;
    }

    // Low momentum alert (only if not skipped and not shown recently)
    if (!skipMomentumWarning && 
        momentum < 0.2 && 
        velocity < 0.05 && 
        session.messages.length > 3 &&
        !notificationShown.current.has('low_momentum') &&
        Date.now() - lastMomentumWarningTime.current > 30000) { // 30 seconds minimum between warnings
      
      toast({
        title: "Low Conversation Momentum",
        description: "The conversation momentum is low. Consider asking more specific questions or providing more details.",
        variant: "default",
      });
      notificationShown.current.add('low_momentum');
      lastMomentumWarningTime.current = Date.now();
      
      // Clear the notification flag after 30 seconds so it can show again if needed
      setTimeout(() => {
        notificationShown.current.delete('low_momentum');
      }, 30000);
    }

    // Transition ready notification
    if (session.next_actions?.transition_ready && !notificationShown.current.has('transition_ready')) {
      const nextStage = session.next_actions.recommended_stage;
      toast({
        title: "Ready to Advance",
        description: `You're ready to move to the next stage${nextStage ? `: ${nextStage.replace('_', ' ')}` : ''}`,
        variant: "default",
      });
      notificationShown.current.add('transition_ready');
    }

    // High-priority intervention suggestions
    const highPriorityInterventions = interventions.filter(i => 
      i.includes('transition') || i.includes('advance') || i.includes('critical')
    );
    
    if (highPriorityInterventions.length > 0 && !notificationShown.current.has('high_priority_intervention')) {
      toast({
        title: "AI Suggestion Available",
        description: "The AI has important suggestions to improve the conversation flow.",
        variant: "default",
      });
      notificationShown.current.add('high_priority_intervention');
    }
  }, []);

  const shouldShowMomentumWarning = useCallback((momentum: number, messageCount: number, timeSinceLastWarning: number): boolean => {
    return momentum !== undefined &&
           momentum < 0.3 &&
           messageCount > 3 &&
           timeSinceLastWarning > 30000;
  }, []);

  const markMomentumWarningShown = useCallback(() => {
    lastMomentumWarningTime.current = Date.now();
    notificationShown.current.add('low_momentum');
    
    // Clear the notification flag after 30 seconds
    setTimeout(() => {
      notificationShown.current.delete('low_momentum');
    }, 30000);
  }, []);

  const resetMonitoring = useCallback(() => {
    lastHealthCheck.current = 'good';
    stagnationStartTime.current = null;
    lastStageProgress.current = 0;
    progressStagnationTime.current = null;
    lastMomentumWarningTime.current = 0;
    notificationShown.current.clear();
  }, []);

  // Listen for custom events to handle intervention display
  useEffect(() => {
    const handleShowInterventions = (event: any) => {
      // This could be handled by parent components
      console.log('Show interventions:', event.detail);
    };

    const handleShowProgressPanel = () => {
      // This could trigger showing the progress panel
      console.log('Show progress panel requested');
    };

    window.addEventListener('showInterventions', handleShowInterventions);
    window.addEventListener('showProgressPanel', handleShowProgressPanel);

    return () => {
      window.removeEventListener('showInterventions', handleShowInterventions);
      window.removeEventListener('showProgressPanel', handleShowProgressPanel);
    };
  }, []);

  return {
    checkHealth,
    resetMonitoring,
    shouldShowMomentumWarning,
    markMomentumWarningShown
  };
};