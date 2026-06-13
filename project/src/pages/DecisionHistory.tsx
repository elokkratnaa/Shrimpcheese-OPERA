import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getCachedReflections, cacheReflection } from '../lib/cache';
import { History as HistoryIcon, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import type { DecisionCategory, CachedReflection, ClarityScores } from '../types';

const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  career: 'Karir',
  education: 'Pendidikan',
  relationship: 'Hubungan',
  finance: 'Keuangan',
  'personal-growth': 'Pertumbuhan Diri',
};

const CATEGORY_COLORS: Record<DecisionCategory, string> = {
  career: '#6366F1',
  education: '#4EEAAC',
  relationship: '#F472B6',
  finance: '#F59E0B',
  'personal-growth': '#10B981',
};

export default function DecisionHistory() {
  const { state, navigate } = useApp();
  const { user } = useAuth();
  const [dbReflections, setDbReflections] = useState<CachedReflection[]>([]);
  const [loading, setLoading] = useState(false);

  const cachedReflections = getCachedReflections();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped: CachedReflection[] = (data as Record<string, unknown>[]).map(r => ({
            id: r.id as string,
            date: r.created_at as string,
            category: r.category as DecisionCategory,
            rootConflict: r.root_conflict as string || '',
            overthinkingLevel: r.overthinking_level as number || 5,
            clarityScores: (r.clarity_scores as ClarityScores) || { emotionalAwareness: 0, logicalClarity: 0, assumptionRisk: 0, overallClarity: 0 },
          }));
          setDbReflections(mapped);
        }
        setLoading(false);
      });
  }, [user]);

  const allReflections = [
    ...state.reflections,
    ...cachedReflections.filter(cr => !state.reflections.some(sr => sr.id === cr.id)),
    ...dbReflections.filter(dr => !state.reflections.some(sr => sr.id === dr.id) && !cachedReflections.some(cr => cr.id === dr.id)),
  ];

  useEffect(() => {
    const cachedIds = new Set(getCachedReflections().map(c => c.id));
    state.reflections.forEach(r => {
      if (!cachedIds.has(r.id)) cacheReflection(r);
    });
  }, [state.reflections]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-opera-bg pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <HistoryIcon className="w-5 h-5 text-opera-indigo" />
            <span className="text-xs text-opera-muted uppercase tracking-wider">Riwayat</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Jejak Refleksi</h1>
          <p className="text-opera-muted mb-8">Lihat lagi refleksi yang udah kamu lakuin, dan lihat gimana cara mikirmu berkembang.</p>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-opera-indigo border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {allReflections.length === 0 && !loading && (
            <div className="glass-card p-8 text-center">
              <HistoryIcon className="w-12 h-12 text-opera-indigo mx-auto mb-4 opacity-40" />
              <h3 className="text-xl font-bold text-white mb-2">Belum ada refleksi</h3>
              <p className="text-opera-muted mb-6">Selesaikan refleksi pertama kamu buat mulai bikin jejak.</p>
              <button onClick={() => navigate('mind-dump')} className="btn-mint">Mulai Refleksi Pertama<ArrowRight className="w-4 h-4" /></button>
            </div>
          )}

          {allReflections.length >= 2 && (
            <div className="glass-card p-5 mb-8 border-opera-indigo/15">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-opera-indigo" />
                <div>
                  <h3 className="text-white font-medium">Lacak Perkembangan</h3>
                  <p className="text-sm text-opera-muted">
                    Rata-rata kegamangan dari {allReflections.length} refleksi: {Math.round(allReflections.reduce((s, r) => s + r.overthinkingLevel, 0) / allReflections.length)}/10
                  </p>
                </div>
              </div>
            </div>
          )}

          {allReflections.length > 0 && (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-opera-border" />
              <div className="space-y-6">
                {allReflections.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="relative pl-16"
                  >
                    <div className="absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-opera-bg" style={{ backgroundColor: CATEGORY_COLORS[r.category] }} />
                    <div className="glass-card p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${CATEGORY_COLORS[r.category]}15`, color: CATEGORY_COLORS[r.category] }}>
                          {CATEGORY_LABELS[r.category]}
                        </span>
                        <span className="text-xs text-opera-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatDate(r.date)}, {formatTime(r.date)}
                        </span>
                        <span className="text-xs text-opera-muted ml-auto">Kepikiran: {r.overthinkingLevel}/10</span>
                      </div>
                      <h3 className="text-white font-semibold mb-2">{r.rootConflict}</h3>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-opera-muted">Kejelasan</span>
                            <span className="text-opera-mint font-medium">{r.clarityScores.overallClarity}%</span>
                          </div>
                          <div className="w-full h-2 bg-opera-surface rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-opera-indigo to-opera-mint" style={{ width: `${r.clarityScores.overallClarity}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center mt-12">
            <button onClick={() => navigate('mind-dump')} className="btn-mint">Mulai Refleksi Baru<ArrowRight className="w-5 h-5" /></button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
