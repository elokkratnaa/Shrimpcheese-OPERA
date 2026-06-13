import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Page, UserProfile, MindDumpData, PersonaResponse, VerdictData, CachedReflection } from '../types';

interface AppState {
  currentPage: Page;
  userProfile: UserProfile | null;
  mindDump: MindDumpData | null;
  personaResponses: PersonaResponse[];
  verdict: VerdictData | null;
  reflections: CachedReflection[];
}

const initialState: AppState = {
  currentPage: 'landing',
  userProfile: null,
  mindDump: null,
  personaResponses: [],
  verdict: null,
  reflections: [],
};

interface AppContextType {
  state: AppState;
  navigate: (page: Page) => void;
  setUserProfile: (p: UserProfile) => void;
  setMindDump: (d: MindDumpData) => void;
  setPersonaResponses: (r: PersonaResponse[]) => void;
  setVerdict: (v: VerdictData) => void;
  addReflection: (r: CachedReflection) => void;
  resetSession: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const navigate = useCallback((page: Page) => setState(p => ({ ...p, currentPage: page })), []);
  const setUserProfile = useCallback((p: UserProfile) => setState(s => ({ ...s, userProfile: p })), []);
  const setMindDump = useCallback((d: MindDumpData) => setState(s => ({ ...s, mindDump: d })), []);
  const setPersonaResponses = useCallback((r: PersonaResponse[]) => setState(s => ({ ...s, personaResponses: r })), []);
  const setVerdict = useCallback((v: VerdictData) => setState(s => ({ ...s, verdict: v })), []);
  const addReflection = useCallback((r: CachedReflection) => setState(s => ({ ...s, reflections: [r, ...s.reflections] })), []);
  const resetSession = useCallback(() => setState(s => ({ ...s, mindDump: null, personaResponses: [], verdict: null, currentPage: 'mind-dump' })), []);

  return (
    <AppContext.Provider value={{ state, navigate, setUserProfile, setMindDump, setPersonaResponses, setVerdict, addReflection, resetSession }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
