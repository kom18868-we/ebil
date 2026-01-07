import { useState, useEffect } from 'react';
import { profileApi } from '@/lib/api/profile';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Mail, Save, Info, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface UserPreferences {
  email_reminders_enabled: boolean;
  reminder_7_days: boolean;
  reminder_3_days: boolean;
  reminder_1_day: boolean;
  reminder_overdue: boolean;
}

export default function PreferencesSettings() {
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<string>(language);
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_reminders_enabled: true,
    reminder_7_days: true,
    reminder_3_days: true,
    reminder_1_day: true,
    reminder_overdue: true,
  });

  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setFetching(true);
        const response = await profileApi.getPreferences();
        if (response.data) {
          setPreferredLanguage(response.data.preferred_language || 'en');
          setPreferences({
            email_reminders_enabled: response.data.preferences?.email_reminders_enabled ?? true,
            reminder_7_days: response.data.preferences?.reminder_7_days ?? true,
            reminder_3_days: response.data.preferences?.reminder_3_days ?? true,
            reminder_1_day: response.data.preferences?.reminder_1_day ?? true,
            reminder_overdue: response.data.preferences?.reminder_overdue ?? true,
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch preferences:', err);
        toast.error('Failed to load preferences');
      } finally {
        setFetching(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await profileApi.updatePreferences({
        preferred_language: preferredLanguage,
        preferences: preferences,
      });

      if (response.errors) {
        const errorMessage = response.errors.general?.[0] || response.message || t('errors.serverError');
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        // Update language context if language changed
        if (preferredLanguage !== language) {
          setLanguage(preferredLanguage as 'en' | 'ar');
        }
        toast.success(t('common.success'));
      }
    } catch (err: any) {
      console.error('Preferences update error:', err);
      const errorMessage = err?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllReminders = (enabled: boolean) => {
    setPreferences({
      email_reminders_enabled: enabled,
      reminder_7_days: enabled,
      reminder_3_days: enabled,
      reminder_1_day: enabled,
      reminder_overdue: enabled,
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preferences</h1>
          <p className="text-muted-foreground mt-1">Manage your notification and language preferences</p>
        </div>
        <Link to="/settings">
          <Button variant="outline" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Language Preferences */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Language Preferences</h2>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.preferredLanguage')}</Label>
            <Select value={preferredLanguage} onValueChange={(value) => {
              setPreferredLanguage(value);
            }}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t('settings.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('settings.english')}</SelectItem>
                <SelectItem value="ar">{t('settings.arabic')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('settings.languageDescription')}
            </p>
          </div>
        </div>

        {/* Email Reminders */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Email Reminders</h2>
            </div>
            <Switch
              checked={preferences.email_reminders_enabled}
              onCheckedChange={toggleAllReminders}
            />
          </div>
          <Separator />
          
          {preferences.email_reminders_enabled ? (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Enable or disable specific reminder types. You'll receive email notifications before invoice due dates.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder_7_days" className="text-base">7 Days Before Due Date</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a reminder 7 days before your invoice is due
                    </p>
                  </div>
                  <Switch
                    id="reminder_7_days"
                    checked={preferences.reminder_7_days}
                    onCheckedChange={() => togglePreference('reminder_7_days')}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder_3_days" className="text-base">3 Days Before Due Date</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a reminder 3 days before your invoice is due
                    </p>
                  </div>
                  <Switch
                    id="reminder_3_days"
                    checked={preferences.reminder_3_days}
                    onCheckedChange={() => togglePreference('reminder_3_days')}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder_1_day" className="text-base">1 Day Before Due Date</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a reminder 1 day before your invoice is due
                    </p>
                  </div>
                  <Switch
                    id="reminder_1_day"
                    checked={preferences.reminder_1_day}
                    onCheckedChange={() => togglePreference('reminder_1_day')}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder_overdue" className="text-base">Overdue Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders for invoices that are past their due date
                    </p>
                  </div>
                  <Switch
                    id="reminder_overdue"
                    checked={preferences.reminder_overdue}
                    onCheckedChange={() => togglePreference('reminder_overdue')}
                  />
                </div>
              </div>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Email reminders are currently disabled. Enable them to receive notifications about upcoming and overdue invoices.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

