import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import Landing from './pages/Landing';
import MindDump from './pages/MindDump';
import CouncilRoom from './pages/CouncilRoom';
import Verdict from './pages/Verdict';
import DecisionHistory from './pages/DecisionHistory';
import type { Page } from './types';

function Router() {
  const { state } = useApp();
  const pages: Record<Page, React.ReactNode> = {
    landing: <Landing />,
    'mind-dump': <MindDump />,
    council: <CouncilRoom />,
    verdict: <Verdict />,
    history: <DecisionHistory />,
  };
  return pages[state.currentPage] || <Landing />;
}

function AppShell() {
  const [authOpen, setAuthOpen] = useState(false);
  return (
    <AppProvider>
      <Navigation onAuthClick={() => setAuthOpen(true)} />
      <Router />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
