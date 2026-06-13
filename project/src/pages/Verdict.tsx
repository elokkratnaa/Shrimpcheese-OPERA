import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateVerdict } from '../lib/analysisEngine';
import { cacheReflection } from '../lib/cache';
import { Sparkles, Target, Eye, Lightbulb, BookOpen, RotateCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { ClarityScores } from '../types';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5 } }),
};

function ClarityBar({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.5 }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-opera-muted">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{score}%</span>
      </div>
      <div className="w-full h-3 bg-opera-surface rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: delay + 0.2, duration: 1, ease: 'easeOut' as const }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}CC)` }} />
      </div>
    </motion.div>
  );
}

function ScoreRing({ score, label, color, delay }: { score: number; label: string; color: string; delay: number }) {
  const circ = 2 * Math.PI * 42;
  const offset = circ - (score / 100) * circ;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.5 }} className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42" fill="none" stroke="#1A1F35" strokeWidth="6" />
          <motion.circle cx="48" cy="48" r="42" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ delay: delay + 0.3, duration: 1.2, ease: 'easeOut' as const }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-white">{score}</span></div>
      </div>
      <span className="text-xs text-opera-muted mt-2">{label}</span>
    </motion.div>
  );
}

export default function Verdict() {
  const { state, navigate, setVerdict, addReflection, resetSession } = useApp();
  const { user } = useAuth();

  useEffect(() => {
    if (!state.mindDump || state.verdict) return;
    const v = generateVerdict(state.mindDump, state.personaResponses);
    setVerdict(v);
  }, [state.mindDump, state.personaResponses, state.verdict, setVerdict]);

  if (!state.verdict) {
    return (
      <div className="min-h-screen bg-opera-bg pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles className="w-12 h-12 text-opera-indigo mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Belum ada kesimpulan</h2>
          <p className="text-opera-muted">Selesaikan langkah-langkah sebelumnya dulu ya.</p>
          <button onClick={() => navigate('council')} className="btn-mint mt-6">Ke Ruang Dewan</button>
        </div>
      </div>
    );
  }

  const v = state.verdict;
  const scores: ClarityScores = v.clarityScores;

  const handleNew = async () => {
    const reflectionId = Date.now().toString();
    const cached = {
      id: reflectionId,
      date: new Date().toISOString(),
      category: state.mindDump?.category || 'career',
      rootConflict: v.rootConflict,
      overthinkingLevel: state.mindDump?.overthinkingLevel || 5,
      clarityScores: scores,
    };
    cacheReflection(cached);
    addReflection(cached);
    if (user && state.mindDump) {
      await supabase.from('reflections').insert({
        user_id: user.id,
        category: state.mindDump.category,
        thoughts: state.mindDump.thoughts,
        overthinking_level: state.mindDump.overthinkingLevel,
        root_conflict: v.rootConflict,
        main_concern: v.mainConcern,
        hidden_factor: v.hiddenFactor,
        reflection_summary: v.reflectionSummary,
        clarity_scores: scores,
        persona_responses: state.personaResponses.map(r => ({ id: r.id, message: r.message })),
      });
    }
    resetSession();
  };

  const cards = [
    { icon: Target, label: 'Akar Konflik', value: v.rootConflict, color: '#6366F1' },
    { icon: Lightbulb, label: 'Kekhawatiran Utama', value: v.mainConcern, color: '#4EEAAC' },
    { icon: Eye, label: 'Faktor Tersembunyi', value: v.hiddenFactor, color: '#F472B6' },
  ];

  return (
    <div className="min-h-screen bg-opera-bg pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}>
            <div className="flex items-center gap-3 mb-2"><Sparkles className="w-5 h-5 text-opera-mint" /><span className="text-xs text-opera-muted uppercase tracking-wider">Langkah Terakhir</span></div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Kesimpulan</h1>
            <p className="text-opera-muted mb-10">Bukan keputusan — tapi pemahaman. Setelah melihat semuanya, mungkin ini yang perlu kamu pertimbangkan.</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="glass-card p-8 mb-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-opera-mint" />Skor Kejelasan</h3>
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <ScoreRing score={scores.overallClarity} label="Keseluruhan" color="#4EEAAC" delay={0.3} />
              <ScoreRing score={scores.emotionalAwareness} label="Emosional" color="#F472B6" delay={0.5} />
              <ScoreRing score={scores.logicalClarity} label="Logis" color="#6366F1" delay={0.7} />
            </div>
            <div className="space-y-5">
              <ClarityBar label="Kesadaran Emosi" score={scores.emotionalAwareness} color="#F472B6" delay={0.4} />
              <ClarityBar label="Kejelasan Logis" score={scores.logicalClarity} color="#6366F1" delay={0.6} />
              <ClarityBar label="Risiko Asumsi" score={scores.assumptionRisk} color="#F59E0B" delay={0.8} />
              <ClarityBar label="Kejelasan Keseluruhan" score={scores.overallClarity} color="#4EEAAC" delay={1.0} />
            </div>
          </motion.div>

          {cards.map((card, i) => (
            <motion.div key={card.label} variants={fadeUp} custom={i + 2} className="glass-card p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.color}12` }}><card.icon className="w-5 h-5" style={{ color: card.color }} /></div>
                <div><h3 className="text-sm font-medium mb-1" style={{ color: card.color }}>{card.label}</h3><p className="text-white leading-relaxed">{card.value}</p></div>
              </div>
            </motion.div>
          ))}

          <motion.div variants={fadeUp} custom={5} className="glass-card p-8 mb-6 border-opera-mint/15">
            <div className="flex items-center gap-3 mb-4"><BookOpen className="w-5 h-5 text-opera-mint" /><h3 className="text-lg font-semibold text-white">Ringkasan Refleksi</h3></div>
            <p className="text-opera-text leading-[1.8] text-base">{v.reflectionSummary}</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="p-5 rounded-2xl bg-opera-mint/5 border border-opera-mint/15 mb-8">
            <p className="text-sm text-opera-text leading-relaxed"><span className="font-semibold text-opera-mint">Penting:</span> OPERA nggak nyuruh kamu milih apa. Kami bantu kamu ngerti kenapa kamu gamang. Kejelasan yang kamu butuhin udah ada di dalam dirimu — ini cuma cermin.</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={7} className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleNew} className="btn-mint flex-1 justify-center"><RotateCcw className="w-4 h-4" />Refleksi Baru</button>
            <button onClick={() => navigate('landing')} className="btn-ghost flex-1 justify-center"><ArrowLeft className="w-4 h-4" />Kembali ke Beranda</button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
