import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Brain, Menu, X, LogOut, LogIn } from 'lucide-react';
import type { Page } from '../types';

const NAV_ITEMS: { label: string; page: Page }[] = [
  { label: 'Curhat Dulu', page: 'mind-dump' },
  { label: 'Dewan', page: 'council' },
  { label: 'Kesimpulan', page: 'verdict' },
  { label: 'Riwayat', page: 'history' },
];

export default function Navigation({ onAuthClick }: { onAuthClick: () => void }) {
  const { state, navigate } = useApp();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLanding = state.currentPage === 'landing';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isLanding ? 'bg-transparent' : 'glass border-b border-opera-border/40'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => navigate('landing')} className="flex items-center gap-2 group">
          <Brain className="w-7 h-7 text-opera-indigo group-hover:text-opera-mint transition-colors" />
          <span className="text-lg font-bold tracking-wider text-white">OPERA</span>
        </button>
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <button key={item.page} onClick={() => navigate(item.page)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${state.currentPage === item.page ? 'bg-opera-indigo/15 text-opera-indigo-light' : 'text-opera-muted hover:text-white hover:bg-opera-card/50'}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={signOut} className="hidden md:flex items-center gap-1.5 text-opera-muted hover:text-white transition-colors text-sm">
              <LogOut className="w-4 h-4" /><span>Keluar</span>
            </button>
          ) : (
            <button onClick={onAuthClick} className="hidden md:flex items-center gap-1.5 text-opera-muted hover:text-white transition-colors text-sm">
              <LogIn className="w-4 h-4" /><span>Masuk</span>
            </button>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-opera-muted hover:text-white">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden glass border-t border-opera-border/40 py-4 px-6">
          {NAV_ITEMS.map(item => (
            <button key={item.page} onClick={() => { navigate(item.page); setMobileOpen(false); }} className={`block w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${state.currentPage === item.page ? 'bg-opera-indigo/15 text-opera-indigo-light' : 'text-opera-muted hover:text-white'}`}>
              {item.label}
            </button>
          ))}
          <div className="border-t border-opera-border/30 mt-2 pt-2">
            {user ? (
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="block w-full text-left px-4 py-3 rounded-lg text-sm text-opera-muted hover:text-white">Keluar</button>
            ) : (
              <button onClick={() => { onAuthClick(); setMobileOpen(false); }} className="block w-full text-left px-4 py-3 rounded-lg text-sm text-opera-mint">Masuk</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
