import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { ProfileSetupData } from '@/services/onboardingApi';

interface ProfileSetupStepProps {
  onSubmit: (data: Omit<ProfileSetupData, 'token'>) => Promise<boolean>;
  onComplete: () => void;
  isLoading: boolean;
}

interface FormData {
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export function ProfileSetupStep({ onSubmit, onComplete, isLoading }: ProfileSetupStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>();

  const watchPassword = watch('password');

  const handleFormSubmit = async (data: FormData) => {
    const success = await onSubmit(data);
    if (success) {
      reset();
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Set Up Your Profile</h3>
        <p className="text-gray-600">
          Let's start by setting up your personal information and securing your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              placeholder="Enter your first name"
              {...register('first_name', {
                required: 'First name is required',
                minLength: {
                  value: 2,
                  message: 'First name must be at least 2 characters',
                },
              })}
              className={errors.first_name ? 'border-red-500' : ''}
            />
            {errors.first_name && (
              <p className="text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              type="text"
              placeholder="Enter your last name"
              {...register('last_name', {
                required: 'Last name is required',
                minLength: {
                  value: 2,
                  message: 'Last name must be at least 2 characters',
                },
              })}
              className={errors.last_name ? 'border-red-500' : ''}
            />
            {errors.last_name && (
              <p className="text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a secure password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Password must contain uppercase, lowercase, number, and special character',
                  },
                })}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside ml-2">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character (@$!%*?&)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="password_confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...register('password_confirm', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === watchPassword || 'Passwords do not match',
                })}
                className={errors.password_confirm ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password_confirm && (
              <p className="text-sm text-red-600">{errors.password_confirm.message}</p>
            )}
          </div>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Security Note</h4>
                <p className="text-sm text-blue-700">
                  Your password will be encrypted and securely stored. Make sure to choose
                  a strong password that you can remember.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}