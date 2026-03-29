// Editor Theme Context for Code Editor Theme Preference
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';
import { EditorTheme, DEFAULT_EDITOR_THEME, EDITOR_THEMES } from '../types/editor-theme.types';

interface EditorThemeContextType {
    editorTheme: EditorTheme;
    setEditorTheme: (theme: EditorTheme) => void;
    themes: typeof EDITOR_THEMES;
}

const EditorThemeContext = createContext<EditorThemeContextType | undefined>(undefined);

// Monaco theme definitions
const monacoThemes = {
    monokai: {
        base: 'vs-dark' as const,
        inherit: true,
        rules: [
            { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'F92672' },
            { token: 'string', foreground: 'E6DB74' },
            { token: 'number', foreground: 'AE81FF' },
            { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
            { token: 'function', foreground: 'A6E22E' },
            { token: 'variable', foreground: 'F8F8F2' },
        ],
        colors: {
            'editor.background': '#272822',
            'editor.foreground': '#F8F8F2',
            'editor.lineHighlightBackground': '#3E3D32',
            'editor.selectionBackground': '#49483E',
            'editorCursor.foreground': '#F8F8F0',
            'editorLineNumber.foreground': '#90908a',
        },
    },
    dracula: {
        base: 'vs-dark' as const,
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6272A4' },
            { token: 'keyword', foreground: 'FF79C6' },
            { token: 'string', foreground: 'F1FA8C' },
            { token: 'number', foreground: 'BD93F9' },
            { token: 'type', foreground: '8BE9FD', fontStyle: 'italic' },
            { token: 'function', foreground: '50FA7B' },
            { token: 'variable', foreground: 'F8F8F2' },
        ],
        colors: {
            'editor.background': '#282A36',
            'editor.foreground': '#F8F8F2',
            'editor.lineHighlightBackground': '#44475A',
            'editor.selectionBackground': '#44475A',
            'editorCursor.foreground': '#F8F8F2',
            'editorLineNumber.foreground': '#6272A4',
        },
    },
    'github-dark': {
        base: 'vs-dark' as const,
        inherit: true,
        rules: [
            { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff7b72' },
            { token: 'string', foreground: 'a5d6ff' },
            { token: 'number', foreground: '79c0ff' },
            { token: 'type', foreground: 'ffa657', fontStyle: 'italic' },
            { token: 'function', foreground: 'd2a8ff' },
            { token: 'variable', foreground: 'c9d1d9' },
        ],
        colors: {
            'editor.background': '#0d1117',
            'editor.foreground': '#c9d1d9',
            'editor.lineHighlightBackground': '#161b22',
            'editor.selectionBackground': '#264f78',
            'editorCursor.foreground': '#c9d1d9',
            'editorLineNumber.foreground': '#484f58',
        },
    },
    'one-dark-pro': {
        base: 'vs-dark' as const,
        inherit: true,
        rules: [
            { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'c678dd' },
            { token: 'string', foreground: '98c379' },
            { token: 'number', foreground: 'd19a66' },
            { token: 'type', foreground: 'e5c07b', fontStyle: 'italic' },
            { token: 'function', foreground: '61afef' },
            { token: 'variable', foreground: 'abb2bf' },
        ],
        colors: {
            'editor.background': '#282c34',
            'editor.foreground': '#abb2bf',
            'editor.lineHighlightBackground': '#2c313a',
            'editor.selectionBackground': '#3E4451',
            'editorCursor.foreground': '#528bff',
            'editorLineNumber.foreground': '#4b5263',
        },
    },
    'solarized-dark': {
        base: 'vs-dark' as const,
        inherit: true,
        rules: [
            { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
            { token: 'keyword', foreground: '859900' },
            { token: 'string', foreground: '2aa198' },
            { token: 'number', foreground: 'd33682' },
            { token: 'type', foreground: 'b58900', fontStyle: 'italic' },
            { token: 'function', foreground: '268bd2' },
            { token: 'variable', foreground: '839496' },
        ],
        colors: {
            'editor.background': '#002B36',
            'editor.foreground': '#839496',
            'editor.lineHighlightBackground': '#073642',
            'editor.selectionBackground': '#094551',
            'editorCursor.foreground': '#839496',
            'editorLineNumber.foreground': '#586e75',
        },
    },
    'solarized-light': {
        base: 'vs' as const,
        inherit: true,
        rules: [
            { token: 'comment', foreground: '93a1a1', fontStyle: 'italic' },
            { token: 'keyword', foreground: '859900' },
            { token: 'string', foreground: '2aa198' },
            { token: 'number', foreground: 'd33682' },
            { token: 'type', foreground: 'b58900', fontStyle: 'italic' },
            { token: 'function', foreground: '268bd2' },
            { token: 'variable', foreground: '657b83' },
        ],
        colors: {
            'editor.background': '#FDF6E3',
            'editor.foreground': '#657b83',
            'editor.lineHighlightBackground': '#EEE8D5',
            'editor.selectionBackground': '#EEE8D5',
            'editorCursor.foreground': '#657b83',
            'editorLineNumber.foreground': '#93a1a1',
        },
    },
};

export function EditorThemeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [editorTheme, setEditorThemeState] = useState<EditorTheme>(DEFAULT_EDITOR_THEME);

    // Initialize theme from user profile on mount
    useEffect(() => {
        if (user?.editorTheme) {
            setEditorThemeState(user.editorTheme as EditorTheme);
        }
    }, [user?.editorTheme]);

    // Register Monaco themes on mount
    useEffect(() => {
        const registerThemes = async () => {
            // Only register if monaco is available (browser environment)
            if (typeof window !== 'undefined') {
                try {
                    // Dynamic import
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const monaco = require('monaco-editor');

                    if (monaco?.editor) {
                        // Register custom themes
                        monaco.editor.defineTheme('monokai', monacoThemes.monokai);
                        monaco.editor.defineTheme('dracula', monacoThemes.dracula);
                        monaco.editor.defineTheme('github-dark', monacoThemes['github-dark']);
                        monaco.editor.defineTheme('one-dark-pro', monacoThemes['one-dark-pro']);
                        monaco.editor.defineTheme('solarized-dark', monacoThemes['solarized-dark']);
                        monaco.editor.defineTheme('solarized-light', monacoThemes['solarized-light']);
                    }
                } catch (error) {
                    console.warn('Monaco not available for theme registration:', error);
                }
            }
        };

        registerThemes();
    }, []);

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

export function defineMonacoThemes(monaco: any) {
    // Register all themes in monacoThemes
    Object.entries(monacoThemes).forEach(([themeId, themeDef]) => {
        monaco.editor.defineTheme(themeId, themeDef);
    });
}
