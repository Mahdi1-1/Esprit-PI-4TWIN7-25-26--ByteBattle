import { useEditorTheme, defineMonacoThemes } from '../../context/EditorThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Editor } from '@monaco-editor/react';
import { Palette } from 'lucide-react';

export function EditorThemeSelector() {
    const { editorTheme, setEditorTheme, themes } = useEditorTheme();
    const { t } = useLanguage();

    const codePreview = `function hello() {
  const greeting = "Hello World!";
  console.log(greeting);
  return greeting;
}`;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                <span className="font-medium">{t('settings.preferences.editorTheme')}</span>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
                {t('settings.preferences.editorTheme.desc')}
            </p>

            {/* Theme Dropdown */}
            <select
                value={editorTheme}
                onChange={(e) => setEditorTheme(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] cursor-pointer"
            >
                {themes.map((theme) => (
                    <option key={theme.id} value={theme.id} style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-primary)' }}>
                        {theme.name}
                    </option>
                ))}
            </select>

            {/* Preview */}
            <div className="space-y-2">
                <span className="text-sm text-[var(--text-secondary)]">
                    {t('settings.preferences.editorTheme.preview')}
                </span>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden h-40">
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        value={codePreview}
                        theme={editorTheme}
                        beforeMount={defineMonacoThemes}
                        options={{
                            minimap: { enabled: false },
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            fontSize: 12,
                            padding: { top: 8, bottom: 8 },
                            readOnly: true,
                            domReadOnly: true,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
