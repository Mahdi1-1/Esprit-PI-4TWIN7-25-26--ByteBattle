// Editor Theme Context for Code Editor Theme Preference
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';
import { EditorTheme, DEFAULT_EDITOR_THEME, EDITOR_THEMES } from '../types/editor-theme.types';
export { defineMonacoThemes } from './defineMonacoThemes';

interface EditorThemeContextType {
    editorTheme: EditorTheme;
    setEditorTheme: (theme: EditorTheme) => void;
    themes: typeof EDITOR_THEMES;
}

const EditorThemeContext = createContext<EditorThemeContextType | undefined>(undefined);

export function EditorThemeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [editorTheme, setEditorThemeState] = useState<EditorTheme>(DEFAULT_EDITOR_THEME);

    // Initialize theme from user profile on mount
    useEffect(() => {
        if (user?.editorTheme) {
            setEditorThemeState(user.editorTheme as EditorTheme);
        }
    }, [user?.editorTheme]);

    // Monaco themes are registered lazily via defineMonacoThemes() called in the editor's
    // onMount callback — no global registration needed (require() is not available in ESM).
    const setEditorTheme = async (theme: EditorTheme) => {
        setEditorThemeState(theme);

        // Persist to backend
        try {
            await profileService.updateProfile({ editorTheme: theme });
        } catch (error) {
            console.error('Failed to save editor theme:', error);
        }
    };

    return (
        <EditorThemeContext.Provider value={{ editorTheme, setEditorTheme, themes: EDITOR_THEMES }}>
            {children}
        </EditorThemeContext.Provider>
    );
}

export function useEditorTheme() {
    const context = useContext(EditorThemeContext);
    if (context === undefined) {
        throw new Error('useEditorTheme must be used within an EditorThemeProvider');
    }
    return context;
}
