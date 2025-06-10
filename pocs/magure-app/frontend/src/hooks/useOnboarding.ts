import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  OnboardingTenant,
  OnboardingStatus,
  ProfileSetupData,
  CompanyDetailsData,
  PreferencesData,
  verifyOnboardingToken,
  getOnboardingStatus,
  completeProfileSetup,
  completeCompanyDetails,
  completePreferences,
} from '@/services/onboardingApi';

interface UseOnboardingState {
  tenant: OnboardingTenant | null;
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  isTokenValid: boolean;
  currentStep: number;
}

interface UseOnboardingActions {
  verifyToken: (token: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  submitProfileSetup: (data: Omit<ProfileSetupData, 'token'>) => Promise<boolean>;
  submitCompanyDetails: (data: Omit<CompanyDetailsData, 'token'>) => Promise<boolean>;
  submitPreferences: (data: Omit<PreferencesData, 'token'>) => Promise<boolean>;
}

export function useOnboarding(initialToken?: string): UseOnboardingState & UseOnboardingActions {
  const [state, setState] = useState<UseOnboardingState>({
    tenant: null,
    status: null,
    isLoading: !!initialToken,
    error: null,
    isTokenValid: false,
    currentStep: 0,
  });

  const [token, setToken] = useState<string | null>(initialToken || null);

  // Map onboarding steps to step numbers
  const getStepNumber = (currentStep: string): number => {
    switch (currentStep) {
      case 'email_invitation':
        return 0;
      case 'profile_setup':
        return 1;
      case 'company_details':
        return 2;
      case 'preferences':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const verifyToken = async (tokenToVerify: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await verifyOnboardingToken(tokenToVerify);
      
      if (result.valid) {
        setToken(tokenToVerify);
        setState(prev => ({
          ...prev,
          tenant: result.tenant,
          isTokenValid: true,
          currentStep: getStepNumber(result.tenant.onboarding_progress?.current_step || 'profile_setup'),
          isLoading: false,
        }));
        
        // Also fetch the detailed status
        await refreshStatus();
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: 'Invalid or expired onboarding token',
          isTokenValid: false,
          isLoading: false,
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify token';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isTokenValid: false,
        isLoading: false,
      }));
      toast.error(errorMessage);
      return false;
    }
  };

  const refreshStatus = async (): Promise<void> => {
    if (!token) return;

    try {
      const status = await getOnboardingStatus(token);
      setState(prev => ({
        ...prev,
        status,
        currentStep: Math.max(prev.currentStep, getStepNumber(status.steps.email_sent ? 'profile_setup' : 'email_invitation')),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch onboarding status';
      console.error('Failed to refresh onboarding status:', errorMessage);
    }
  };

  const submitProfileSetup = async (data: Omit<ProfileSetupData, 'token'>): Promise<boolean> => {
    if (!token) {
      toast.error('No valid token available');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await completeProfileSetup({ ...data, token });
      setState(prev => ({ ...prev, currentStep: 2, isLoading: false }));
      toast.success('Profile setup completed successfully!');
      await refreshStatus();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete profile setup';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      toast.error(errorMessage);
      return false;
    }
  };

  const submitCompanyDetails = async (data: Omit<CompanyDetailsData, 'token'>): Promise<boolean> => {
    if (!token) {
      toast.error('No valid token available');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await completeCompanyDetails({ ...data, token });
      setState(prev => ({ ...prev, currentStep: 3, isLoading: false }));
      toast.success('Company details saved successfully!');
      await refreshStatus();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save company details';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      toast.error(errorMessage);
      return false;
    }
  };

  const submitPreferences = async (data: Omit<PreferencesData, 'token'>): Promise<boolean> => {
    if (!token) {
      toast.error('No valid token available');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await completePreferences({ ...data, token });
      setState(prev => ({ 
        ...prev, 
        currentStep: result.onboarding_completed ? 4 : 3, 
        isLoading: false 
      }));
      
      if (result.onboarding_completed) {
        toast.success('Onboarding completed successfully! Welcome to your new workspace!');
      } else {
        toast.success('Preferences saved successfully!');
      }
      
      await refreshStatus();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preferences';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      toast.error(errorMessage);
      return false;
    }
  };

  // Auto-verify token on mount if provided
  useEffect(() => {
    if (initialToken && !state.isTokenValid) {
      verifyToken(initialToken);
    }
  }, [initialToken]);

  return {
    ...state,
    verifyToken,
    refreshStatus,
    submitProfileSetup,
    submitCompanyDetails,
    submitPreferences,
  };
}