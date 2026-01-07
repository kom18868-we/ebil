import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { profileApi } from '@/lib/api/profile';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
// Import i18n instance directly instead of using useTranslation hook
import i18n from '@/lib/i18n/config';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    // First check user's preferred language
    const saved = localStorage.getItem('ebill_language') as Language;
    if (saved === 'en' || saved === 'ar') return saved;
    return 'en';
  });
  const [isRTL, setIsRTL] = useState(language === 'ar');
  const [translationKey, setTranslationKey] = useState(0); // Force re-render on language change

  // Create translation function that uses i18n directly
  // Use useCallback to make it reactive to language changes
  // Include translationKey to force re-render when language changes
  const t = useCallback((key: string, options?: any) => {
    // Access translationKey to ensure this function updates when it changes
    void translationKey;
    return i18n.t(key, options);
  }, [translationKey]); // Only depend on translationKey which changes when language changes

  // Load user's preferred language when user is loaded
  useEffect(() => {
    if (user?.preferred_language && (user.preferred_language === 'en' || user.preferred_language === 'ar')) {
      const userLang = user.preferred_language as Language;
      if (userLang !== language) {
        setLanguageState(userLang);
      }
    }
  }, [user?.preferred_language, language]);

  // Listen to i18n language change events to force re-renders
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      console.log('Language changed to:', lng);
      setTranslationKey(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Update i18n language asynchronously
    i18n.changeLanguage(language).then(() => {
      if (isMounted) {
        // Force re-render after language change completes
        setTranslationKey(prev => prev + 1);
        toast.success(language === 'ar' ? 'تم تغيير اللغة بنجاح' : 'Language changed successfully');
      }
    }).catch((error) => {
      console.error('Failed to change language:', error);
      toast.error(language === 'ar' ? 'فشل تغيير اللغة' : 'Failed to change language');
    });
    
    // Update RTL
    setIsRTL(language === 'ar');
    
    // Update document direction and lang attribute
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    
    // Update body class for RTL styling
    document.body.classList.toggle('rtl', language === 'ar');
    document.body.classList.toggle('ltr', language !== 'ar');
    
    // Save to localStorage
    localStorage.setItem('ebill_language', language);
    
    // Update user preference if authenticated
    if (user && user.id) {
      updateUserLanguage(language);
    }
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, user]);

  const updateUserLanguage = async (lang: Language) => {
    try {
      await profileApi.updatePreferences({
        preferred_language: lang,
        preferences: {},
      });
    } catch (error) {
      // Silently fail - don't show error for language preference update
      console.error('Failed to update user language preference:', error);
    }
  };

  const setLanguage = useCallback((lang: Language) => {
    console.log('setLanguage called with:', lang, 'current language:', language);
    if (lang !== language) {
      console.log('Updating language state from', language, 'to', lang);
      setLanguageState(lang);
      // Toast will be shown after language change completes in useEffect
    } else {
      console.log('Language is already', lang, '- no change needed');
    }
  }, [language]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    isRTL,
    t,
  }), [language, isRTL, t, setLanguage]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

