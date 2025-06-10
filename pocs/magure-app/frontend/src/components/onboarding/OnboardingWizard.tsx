import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, User, Building2, Settings, Mail } from 'lucide-react';
import { ProfileSetupStep } from './steps/ProfileSetupStep';
import { CompanyDetailsStep } from './steps/CompanyDetailsStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { OnboardingStatus } from '@/services/onboardingApi';

interface OnboardingWizardProps {
  currentStep: number;
  status: OnboardingStatus | null;
  tenantName: string;
  onProfileSetup: (data: any) => Promise<boolean>;
  onCompanyDetails: (data: any) => Promise<boolean>;
  onPreferences: (data: any) => Promise<boolean>;
  isLoading: boolean;
}

const steps = [
  {
    id: 0,
    title: 'Email Invitation',
    description: 'Invitation sent to your email',
    icon: Mail,
    component: null,
  },
  {
    id: 1,
    title: 'Profile Setup',
    description: 'Set up your personal profile',
    icon: User,
    component: ProfileSetupStep,
  },
  {
    id: 2,
    title: 'Company Details',
    description: 'Configure your company information',
    icon: Building2,
    component: CompanyDetailsStep,
  },
  {
    id: 3,
    title: 'Preferences',
    description: 'Customize your workspace',
    icon: Settings,
    component: PreferencesStep,
  },
];

export function OnboardingWizard({
  currentStep,
  status,
  tenantName,
  onProfileSetup,
  onCompanyDetails,
  onPreferences,
  isLoading,
}: OnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState(Math.max(1, currentStep));

  const progressPercentage = status?.completion_percentage || 0;

  const getStepStatus = (stepId: number) => {
    if (stepId < activeStep) return 'completed';
    if (stepId === activeStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (step: any, stepStatus: string) => {
    const IconComponent = step.icon;
    
    if (stepStatus === 'completed') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    
    if (stepStatus === 'current') {
      return <IconComponent className="w-5 h-5 text-blue-600" />;
    }
    
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const handleStepComplete = (stepId: number) => {
    if (stepId < 4) {
      setActiveStep(stepId + 1);
    }
  };

  const renderStepContent = () => {
    const currentStepData = steps.find(step => step.id === activeStep);
    
    if (!currentStepData?.component) {
      return (
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Welcome to {tenantName}!</h3>
          <p className="text-gray-600">Your workspace is ready. You can now access your dashboard.</p>
        </div>
      );
    }

    const StepComponent = currentStepData.component;
    
    const stepProps = {
      onSubmit: activeStep === 1 ? onProfileSetup :
                activeStep === 2 ? onCompanyDetails :
                onPreferences,
      onComplete: () => handleStepComplete(activeStep),
      isLoading,
    };

    return <StepComponent {...stepProps} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {tenantName}
          </h1>
          <p className="text-lg text-gray-600">
            Let's get your workspace set up in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg">Setup Progress</CardTitle>
              <Badge variant="outline">
                {status?.completed_steps || 0} of {status?.total_steps || 4} completed
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <CardDescription>
              {progressPercentage.toFixed(0)}% complete
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step) => {
                  const stepStatus = getStepStatus(step.id);
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                        stepStatus === 'current'
                          ? 'bg-blue-50 border border-blue-200'
                          : stepStatus === 'completed'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getStepIcon(step, stepStatus)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          stepStatus === 'upcoming' ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {step.title}
                        </h4>
                        <p className={`text-xs ${
                          stepStatus === 'upcoming' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {steps.find(step => step.id === activeStep)?.title || 'Setup Complete'}
                </CardTitle>
                <CardDescription>
                  {steps.find(step => step.id === activeStep)?.description || 'Your workspace is ready!'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}