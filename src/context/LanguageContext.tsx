import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  direction: 'ltr' | 'rtl';
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    'auth.login.title': 'Sign in to your account',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.remember': 'Remember me',
    'auth.login.forgot': 'Forgot password?',
    'auth.login.signin': 'Sign In',
    'auth.login.signup': 'Sign up',
    'auth.login.noaccount': "Don't have an account?",
    'auth.login.orcontinue': 'or continue with',
    
    // Navigation
    'nav.problems': 'Problems',
    'nav.canvas': 'Canvas',
    'nav.duel': 'Duel',
    'nav.hackathon': 'Hackathon',
    'nav.leaderboard': 'Leaderboard',
    'nav.themes': 'Themes',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.quickduel': 'Quick Duel',
    'dashboard.quickduel.desc': 'Challenge an opponent',
    'dashboard.solo': 'Solo Mode',
    'dashboard.solo.desc': 'Solve problems',
    'dashboard.hackathon': 'Hackathon',
    'dashboard.hackathon.desc': 'Join a team',
    'dashboard.recommended': 'Recommended Problems',
    'dashboard.viewall': 'View All',
    'dashboard.recent': 'Recent Matches',
    'dashboard.history': 'History',
    'dashboard.skills': 'Skills',
    'dashboard.badges': 'Recent Badges',
    'dashboard.unlock': 'Unlock new themes',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    
    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.appearance': 'Appearance',
    'settings.preferences': 'Preferences',
    'settings.language': 'Language',
    'settings.dangerzone': 'Danger Zone',
  },
  
  fr: {
    // Auth
    'auth.login.title': 'Connectez-vous à votre compte',
    'auth.login.email': 'Email',
    'auth.login.password': 'Mot de passe',
    'auth.login.remember': 'Se souvenir de moi',
    'auth.login.forgot': 'Mot de passe oublié ?',
    'auth.login.signin': 'Se connecter',
    'auth.login.signup': "S'inscrire",
    'auth.login.noaccount': "Vous n'avez pas de compte ?",
    'auth.login.orcontinue': 'ou continuer avec',
    
    // Navigation
    'nav.problems': 'Problèmes',
    'nav.canvas': 'Canvas',
    'nav.duel': 'Duel',
    'nav.hackathon': 'Hackathon',
    'nav.leaderboard': 'Classement',
    'nav.themes': 'Thèmes',
    'nav.dashboard': 'Tableau de bord',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    'nav.login': 'Connexion',
    'nav.signup': 'Inscription',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.quickduel': 'Duel Rapide',
    'dashboard.quickduel.desc': 'Défiez un adversaire',
    'dashboard.solo': 'Mode Solo',
    'dashboard.solo.desc': 'Résoudre des problèmes',
    'dashboard.hackathon': 'Hackathon',
    'dashboard.hackathon.desc': 'Rejoindre une équipe',
    'dashboard.recommended': 'Problèmes Recommandés',
    'dashboard.viewall': 'Voir Tout',
    'dashboard.recent': 'Matchs Récents',
    'dashboard.history': 'Historique',
    'dashboard.skills': 'Compétences',
    'dashboard.badges': 'Badges Récents',
    'dashboard.unlock': 'Débloquer de nouveaux thèmes',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.profile': 'Profil',
    'settings.notifications': 'Notifications',
    'settings.security': 'Sécurité',
    'settings.appearance': 'Apparence',
    'settings.preferences': 'Préférences',
    'settings.language': 'Langue',
    'settings.dangerzone': 'Zone Dangereuse',
  },
  
  ar: {
    // Auth
    'auth.login.title': 'تسجيل الدخول إلى حسابك',
    'auth.login.email': 'البريد الإلكتروني',
    'auth.login.password': 'كلمة المرور',
    'auth.login.remember': 'تذكرني',
    'auth.login.forgot': 'نسيت كلمة المرور؟',
    'auth.login.signin': 'تسجيل الدخول',
    'auth.login.signup': 'إنشاء حساب',
    'auth.login.noaccount': 'ليس لديك حساب؟',
    'auth.login.orcontinue': 'أو المتابعة مع',
    
    // Navigation
    'nav.problems': 'المسائل',
    'nav.canvas': 'لوحة الرسم',
    'nav.duel': 'المبارزة',
    'nav.hackathon': 'الهاكاثون',
    'nav.leaderboard': 'لوحة المتصدرين',
    'nav.themes': 'السمات',
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.quickduel': 'مبارزة سريعة',
    'dashboard.quickduel.desc': 'تحدى خصم',
    'dashboard.solo': 'الوضع الفردي',
    'dashboard.solo.desc': 'حل المسائل',
    'dashboard.hackathon': 'هاكاثون',
    'dashboard.hackathon.desc': 'انضم إلى فريق',
    'dashboard.recommended': 'المسائل الموصى بها',
    'dashboard.viewall': 'عرض الكل',
    'dashboard.recent': 'المباريات الأخيرة',
    'dashboard.history': 'السجل',
    'dashboard.skills': 'المهارات',
    'dashboard.badges': 'الشارات الأخيرة',
    'dashboard.unlock': 'فتح سمات جديدة',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    
    // Settings
    'settings.title': 'الإعدادات',
    'settings.profile': 'الملف الشخصي',
    'settings.notifications': 'الإشعارات',
    'settings.security': 'الأمان',
    'settings.appearance': 'المظهر',
    'settings.preferences': 'التفضيلات',
    'settings.language': 'اللغة',
    'settings.dangerzone': 'منطقة الخطر',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('bytebattle_language');
    return (stored as Language) || 'en';
  });

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('bytebattle_language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', direction);
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, direction, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
