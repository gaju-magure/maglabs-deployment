import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TenantOnboarding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const {
    tenant,
    status,
    isLoading,
    error,
    isTokenValid,
    currentStep,
    verifyToken,
    submitProfileSetup,
    submitCompanyDetails,
    submitPreferences,
  } = useOnboarding(token);

  useEffect(() => {
    if (!token) {
      navigate('/404');
      return;
    }

    if (!isTokenValid && !isLoading) {
      verifyToken(token);
    }
  }, [token, isTokenValid, isLoading, verifyToken, navigate]);

  // Handle completion - redirect to tenant dashboard
  useEffect(() => {
    if (status?.onboarding_status === 'completed' || currentStep >= 4) {
      // Wait a moment to show completion, then redirect
      const timer = setTimeout(() => {
        // Redirect to tenant dashboard
        const domain = tenant?.primary_domain;
        if (domain) {
          window.location.href = `https://${domain}/dashboard`;
        } else {
          navigate('/dashboard');
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status?.onboarding_status, currentStep, tenant?.primary_domain, navigate]);

  if (isLoading && !tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <h3 className="text-lg font-semibold">Verifying Your Invitation</h3>
              <p className="text-gray-600">
                Please wait while we verify your onboarding token...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !isTokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h3 className="text-lg font-semibold text-red-900">Invalid or Expired Link</h3>
              <p className="text-red-700">
                {error || 'This onboarding link is invalid or has expired. Please contact your administrator for a new invitation.'}
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="mt-4"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.onboarding_status === 'completed' || currentStep >= 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              <h3 className="text-2xl font-bold text-green-900">Setup Complete!</h3>
              <p className="text-green-700">
                Welcome to {tenant?.name}! Your workspace is ready.
              </p>
              <p className="text-sm text-green-600">
                Redirecting you to your dashboard...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-lg font-semibold">Unable to Load Tenant</h3>
              <p className="text-gray-600">
                We couldn't load your tenant information. Please try refreshing the page.
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <OnboardingWizard
      currentStep={currentStep}
      status={status}
      tenantName={tenant.name}
      onProfileSetup={submitProfileSetup}
      onCompanyDetails={submitCompanyDetails}
      onPreferences={submitPreferences}
      isLoading={isLoading}
    />
  );
}