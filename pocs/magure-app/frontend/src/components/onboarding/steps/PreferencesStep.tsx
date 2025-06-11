import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Clock, Calendar, Bell, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { PreferencesData } from '@/services/onboardingApi';

interface PreferencesStepProps {
  onSubmit: (data: Omit<PreferencesData, 'token'>) => Promise<boolean>;
  onComplete: () => void;
  isLoading: boolean;
}

interface FormData {
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  notifications_enabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)', example: '12/31/2023' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European Format)', example: '31/12/2023' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)', example: '2023-12-31' },
];

const themes = [
  { value: 'light', label: 'Light', description: 'Clean and bright interface', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes for long work sessions', icon: Moon },
  { value: 'system', label: 'System', description: 'Follow your device settings', icon: Monitor },
];

export function PreferencesStep({ onSubmit, onComplete, isLoading }: PreferencesStepProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      notifications_enabled: true,
      theme: 'system',
    },
  });

  const watchTimezone = watch('timezone');
  const watchDateFormat = watch('date_format');
  const watchNotifications = watch('notifications_enabled');
  const watchTheme = watch('theme');

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
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Workspace Preferences</h3>
        <p className="text-gray-600">
          Customize your workspace settings to match your preferences and workflow.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="timezone" className="text-base font-medium">
                    Timezone
                  </Label>
                  <Select
                    value={watchTimezone}
                    onValueChange={(value) => setValue('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    This will be used for scheduling and time-based features.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="date_format" className="text-base font-medium">
                    Date Format
                  </Label>
                  <Select
                    value={watchDateFormat}
                    onValueChange={(value: any) => setValue('date_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{format.label}</span>
                            <span className="text-gray-500 ml-2">({format.example})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    Choose how dates are displayed throughout the application.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Palette className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="theme" className="text-base font-medium">
                    Interface Theme
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {themes.map((themeOption) => {
                      const Icon = themeOption.icon;
                      return (
                        <div
                          key={themeOption.value}
                          className={`relative cursor-pointer rounded-lg border p-3 transition-all ${
                            watchTheme === themeOption.value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setValue('theme', themeOption.value as any)}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-5 h-5 ${
                              watchTheme === themeOption.value ? 'text-indigo-600' : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${
                                watchTheme === themeOption.value ? 'text-indigo-900' : 'text-gray-900'
                              }`}>
                                {themeOption.label}
                              </h4>
                              <p className={`text-xs ${
                                watchTheme === themeOption.value ? 'text-indigo-700' : 'text-gray-500'
                              }`}>
                                {themeOption.description}
                              </p>
                            </div>
                          </div>
                          {watchTheme === themeOption.value && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-600">
                    Choose your preferred interface appearance.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Bell className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications" className="text-base font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-600">
                        Receive email notifications for important updates and activity.
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={watchNotifications}
                      onCheckedChange={(checked) => setValue('notifications_enabled', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-900 mb-1">Customize Later</h4>
                <p className="text-sm text-purple-700">
                  Don't worry! You can always change these preferences later in your account
                  settings. These are just the defaults to get you started.
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
            {isLoading ? 'Completing...' : 'Complete Setup'}
          </Button>
        </div>
      </form>
    </div>
  );
}