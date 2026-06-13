import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ArrowRight, PenLine, Gauge, Tag, Sparkles } from 'lucide-react';
import type { DecisionCategory } from '../types';

const CATEGORIES: { value: DecisionCategory; label: string; icon: string }[] = [
  { value: 'career', label: 'Karir', icon: '💼' },
  { value: 'education', label: 'Pendidikan', icon: '🎓' },
  { value: 'relationship', label: 'Hubungan', icon: '💜' },
  { value: 'finance', label: 'Keuangan', icon: '💰' },
  { value: 'personal-growth', label: 'Pertumbuhan Diri', icon: '🌱' },
];

const getLevelLabel = (l: number) => l <= 2 ? 'Tenang' : l <= 4 ? 'Sedikit risau' : l <= 6 ? 'Gelisah' : l <= 8 ? 'Cemas berat' : 'Kewalahan';
const getLevelColor = (l: number) => l <= 3 ? 'text-opera-mint' : l <= 5 ? 'text-opera-warm' : l <= 7 ? 'text-orange-400' : 'text-red-400';

export default function MindDump() {
  const { navigate, setMindDump, state } = useApp();
  const [thoughts, setThoughts] = useState(state.mindDump?.thoughts || '');
  const [category, setCategory] = useState<DecisionCategory>(state.mindDump?.category || 'career');
  const [overthinkingLevel, setOverthinkingLevel] = useState(state.mindDump?.overthinkingLevel || 5);
  const canProceed = thoughts.trim().length >= 20;

  const handleSubmit = () => { setMindDump({ thoughts, category, overthinkingLevel }); navigate('council'); };
  const pct = ((overthinkingLevel - 1) / 9) * 100;

  return (
    <div className="min-h-screen bg-opera-bg pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2"><PenLine className="w-5 h-5 text-opera-indigo" /><span className="text-xs text-opera-muted uppercase tracking-wider">Langkah 1</span></div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Curhat Dulu</h1>
          <p className="text-opera-muted mb-8">Tulis aja apa adanya. Nggak perlu rapi. Yang penting keluar — setiap kepikiran, ketakutan, sama harapan.</p>

          <div className="mb-8">
            <textarea value={thoughts} onChange={e => setThoughts(e.target.value)} placeholder="Aku lagi kepikiran soal... Aku ngerasa gamang karena... Di satu sisi aku mau... tapi di sisi lain..." rows={8} className="input-field resize-none text-lg leading-relaxed" />
            <div className="flex justify-between mt-2 text-sm text-opera-muted">
              <span>{thoughts.length} karakter</span>
              <span className={canProceed ? 'text-opera-mint' : ''}>{canProceed ? 'Udah bisa lanjut' : `${20 - thoughts.length} karakter lagi`}</span>
            </div>
          </div>

          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4"><Tag className="w-5 h-5 text-opera-indigo" /><h3 className="text-white font-semibold">Ini Soal Apa?</h3></div>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${category === c.value ? 'bg-opera-indigo/15 border-opera-indigo text-white shadow-glow-indigo' : 'bg-opera-surface border-opera-border text-opera-muted hover:text-white hover:border-opera-indigo/40'}`}>
                  <span className="mr-1.5">{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-3 mb-4"><Gauge className="w-5 h-5 text-opera-indigo" /><h3 className="text-white font-semibold">Seberapa Kepikiran?</h3><span className={`ml-auto text-sm font-medium ${getLevelColor(overthinkingLevel)}`}>{getLevelLabel(overthinkingLevel)} ({overthinkingLevel}/10)</span></div>
            <input type="range" min={1} max={10} value={overthinkingLevel} onChange={e => setOverthinkingLevel(Number(e.target.value))} className="w-full" style={{ background: `linear-gradient(to right, #4EEAAC 0%, #6366F1 ${pct * 0.5}%, #F59E0B ${pct * 0.75}%, #EF4444 ${pct}%)` }} />
            <div className="flex justify-between text-xs text-opera-muted mt-3"><span>Tenang</span><span>Gelisah</span><span>Kewalahan</span></div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={!canProceed} className="btn-mint text-lg disabled:opacity-40 disabled:cursor-not-allowed"><Sparkles className="w-5 h-5" />Panggil Dewan<ArrowRight className="w-5 h-5" /></button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
