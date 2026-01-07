import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLang: 'en' | 'ar') => {
    console.log('Language change requested:', newLang, 'current:', language);
    if (newLang !== language) {
      console.log('Calling setLanguage with:', newLang);
      setLanguage(newLang);
      console.log('setLanguage called');
    } else {
      console.log('Language is already', newLang);
    }
  };

  const languages = [
    { code: 'en' as const, label: 'English', native: 'English' },
    { code: 'ar' as const, label: 'Arabic', native: 'العربية' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          type="button"
        >
          <Languages className="h-4 w-4" />
          <span className="flex-1 text-left">{language === 'ar' ? 'العربية' : 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={() => {
              console.log('DropdownMenuItem onSelect fired for:', lang.code);
              handleLanguageChange(lang.code);
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>{lang.native}</span>
                <span className="text-muted-foreground text-xs">({lang.label})</span>
              </div>
              {language === lang.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
