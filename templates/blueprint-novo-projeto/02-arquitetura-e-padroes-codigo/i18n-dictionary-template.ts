export type SupportedLanguage = 'pt' | 'en';

export const translations = {
  pt: {
    app_title: 'Meu Novo Projeto',
    welcome: 'Bem-vindo de volta!',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    settings: 'Configurações',
    theme_light: 'Claro',
    theme_dark: 'Escuro',
    theme_system: 'Sistema',
    streak_days: 'dias seguidos',
  },
  en: {
    app_title: 'My New Project',
    welcome: 'Welcome back!',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    settings: 'Settings',
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_system: 'System',
    streak_days: 'day streak',
  },
} as const;

export type TranslationKey = keyof typeof translations.pt;

/**
 * Hook ou helper utilitário para obter o dicionário ativo com tipagem estrita
 */
export function getDictionary(lang: SupportedLanguage = 'pt') {
  return translations[lang] || translations.pt;
}
