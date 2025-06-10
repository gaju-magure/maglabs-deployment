import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';
import { CompanyDetailsData } from '@/services/onboardingApi';

interface CompanyDetailsStepProps {
  onSubmit: (data: Omit<CompanyDetailsData, 'token'>) => Promise<boolean>;
  onComplete: () => void;
  isLoading: boolean;
}

interface FormData {
  company_name: string;
  company_size: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  industry: string;
  description?: string;
}

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Real Estate',
  'Media & Entertainment',
  'Non-profit',
  'Government',
  'Other',
];

export function CompanyDetailsStep({ onSubmit, onComplete, isLoading }: CompanyDetailsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>();

  const watchCompanySize = watch('company_size');

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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Company Information</h3>
        <p className="text-gray-600">
          Tell us about your company to help us customize your workspace experience.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            type="text"
            placeholder="Enter your company name"
            {...register('company_name', {
              required: 'Company name is required',
              minLength: {
                value: 2,
                message: 'Company name must be at least 2 characters',
              },
            })}
            className={errors.company_name ? 'border-red-500' : ''}
          />
          {errors.company_name && (
            <p className="text-sm text-red-600">{errors.company_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_size">Company Size</Label>
            <Select
              onValueChange={(value: any) => setValue('company_size', value)}
              required
            >
              <SelectTrigger className={errors.company_size ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {companySizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{size.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.company_size && (
              <p className="text-sm text-red-600">{errors.company_size.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              onValueChange={(value) => setValue('industry', value)}
              required
            >
              <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.industry && (
              <p className="text-sm text-red-600">{errors.industry.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Company Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Tell us about your company, what you do, your mission..."
            rows={4}
            {...register('description', {
              maxLength: {
                value: 500,
                message: 'Description must be less than 500 characters',
              },
            })}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
          <p className="text-xs text-gray-500">
            This helps us understand your business and provide relevant features.
          </p>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-900 mb-1">Why We Ask</h4>
                <p className="text-sm text-green-700">
                  This information helps us tailor your workspace experience, suggest relevant
                  features, and provide better support for your specific industry needs.
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
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}