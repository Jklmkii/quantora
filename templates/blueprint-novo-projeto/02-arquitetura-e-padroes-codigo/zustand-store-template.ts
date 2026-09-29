import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Definição do Modelo de Dados
export interface UserProfile {
  username: string;
  totalXp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
}

export interface AppState {
  // Estado
  theme: 'light' | 'dark' | 'system';
  language: 'pt' | 'en';
  profile: UserProfile;

  // Ações Atômicas
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: 'pt' | 'en') => void;
  addXp: (amount: number) => void;
  resetProgress: () => void;
}

// 2. Estado Inicial Canônico
const initialProfile: UserProfile = {
  username: 'Explorador',
  totalXp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
};

// 3. Criação da Store com Persistência Segura & Migração de Versão
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'pt',
      profile: initialProfile,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),

      addXp: (amount) =>
        set((state) => {
          const newXp = Math.max(0, state.profile.totalXp + amount);
          // Exemplo de fórmula de nível: L = floor(sqrt(XP / 50)) + 1
          const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 50)) + 1);

          return {
            profile: {
              ...state.profile,
              totalXp: newXp,
              level: newLevel,
            },
          };
        }),

      resetProgress: () =>
        set({
          profile: initialProfile,
        }),
    }),
    {
      name: 'app_storage_key_v1', // Chave única no localStorage
      version: 1, // Versão do Schema
      storage: createJSONStorage(() => localStorage),

      // 4. Migração Defensiva contra Corrupção de Dados
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState as Partial<AppState>) || {};

        if (version === 0) {
          // Migração da v0 para v1 (adiciona campos novos sem perder progresso antigo)
          return {
            ...state,
            theme: state.theme || 'system',
            language: state.language || 'pt',
            profile: {
              ...initialProfile,
              ...(state.profile || {}),
            },
          } as AppState;
        }

        return state as AppState;
      },
    }
  )
);
