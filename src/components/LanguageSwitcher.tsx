import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`
          w-10 h-10
          flex items-center justify-center
          rounded-[var(--radius-md)]
          text-[var(--text-secondary)]
          hover:bg-[var(--surface-2)]
          hover:text-[var(--brand-primary)]
          transition-colors
          ${showMenu ? 'bg-[var(--surface-2)] text-[var(--brand-primary)]' : ''}
        `}
        aria-label="Change language"
        title={currentLang.name}
      >
        <Globe className="w-5 h-5" />
      </button>

      {/* Language Menu */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5
                text-[var(--text-primary)]
                hover:bg-[var(--surface-2)]
                transition-colors
                ${language === lang.code ? 'bg-[var(--surface-2)]' : ''}
              `}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="flex-1 text-left" style={{ fontFamily: lang.code === 'ar' ? 'Noto Sans Arabic, sans-serif' : 'inherit' }}>
                {lang.name}
              </span>
              {language === lang.code && (
                <span className="text-[var(--brand-primary)]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
