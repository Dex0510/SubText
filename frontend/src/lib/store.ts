import { create } from 'zustand';

interface User {
  user_id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ user: null, isAuthenticated: false });
  },
}));

interface AnalysisState {
  currentCaseId: string | null;
  currentConversationId: string | null;
  status: string;
  progress: number;
  stage: string;
  setCaseId: (id: string) => void;
  setConversationId: (id: string) => void;
  setStatus: (status: string, progress: number, stage: string) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentCaseId: null,
  currentConversationId: null,
  status: 'idle',
  progress: 0,
  stage: '',
  setCaseId: (id) => set({ currentCaseId: id }),
  setConversationId: (id) => set({ currentConversationId: id }),
  setStatus: (status, progress, stage) => set({ status, progress, stage }),
  reset: () => set({ currentCaseId: null, currentConversationId: null, status: 'idle', progress: 0, stage: '' }),
}));

export type TabType = 'analysis' | 'deep-analysis' | 'mri' | 'chat-recommender';

interface ConversationViewState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const useConversationViewStore = create<ConversationViewState>((set) => ({
  activeTab: 'analysis',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
