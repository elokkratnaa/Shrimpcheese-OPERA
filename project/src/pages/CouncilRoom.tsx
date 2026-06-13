import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Heart, Lightbulb, Flame, Users, Sparkles, Download, Share2, MessageCircle, UserCheck, ChevronRight } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { PersonaResponse, VerdictData } from '../types';
import { generatePersonaResponses, generateVerdict } from '../lib/analysisEngine';

const PERSONA_META: Record<string, { name: string; role: string; color: string; avatar: string; Icon: typeof Heart }> = {
  luna: { name: 'Luna', role: 'Si Empati', color: '#F472B6', avatar: 'L', Icon: Heart },
  sage: { name: 'Sage', role: 'Si Analis', color: '#6366F1', avatar: 'S', Icon: Lightbulb },
  baz: { name: 'Baz', role: 'Si Penantang', color: '#F59E0B', avatar: 'B', Icon: Flame },
};

type ChatMode = 'group' | 'private';

interface ChatMessage {
  id: string;
  personaId: string;
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

function TypingIndicator({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-end gap-2.5 mb-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>{name[0]}</div>
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-opera-chat-bubble max-w-[75%]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-opera-muted mr-1">{name} lagi ngetik</span>
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg, animate }: { msg: ChatMessage; animate: boolean }) {
  const meta = PERSONA_META[msg.personaId];
  if (!meta) return null;
  const isUser = msg.personaId === 'user';
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex items-end gap-2.5 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ backgroundColor: isUser ? '#4EEAAC20' : `${meta.color}20`, color: isUser ? '#4EEAAC' : meta.color }}>
        {isUser ? 'K' : meta.avatar}
      </div>
      <div className={`rounded-2xl px-4 py-3 max-w-[75%] ${isUser ? 'rounded-br-sm bg-opera-chat-bubble-self' : 'rounded-bl-sm bg-opera-chat-bubble'}`}>
        {!isUser && <p className="text-[11px] font-semibold mb-1" style={{ color: meta.color }}>{meta.name}</p>}
        <p className="text-sm text-opera-text leading-relaxed whitespace-pre-wrap">{msg.text}</p>
        <p className="text-[10px] text-opera-muted/60 mt-1.5 text-right">
          {msg.timestamp.toLocaleTimeString('id-ID', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function VerdictInline({ verdict, onNewReflection, onBackHome, screenshotRef }: {
  verdict: VerdictData;
  onNewReflection: () => void;
  onBackHome: () => void;
  screenshotRef: React.RefObject<HTMLDivElement>;
}) {
  const scores = verdict.clarityScores;

  const handleDownload = async () => {
    if (!screenshotRef.current) return;
    try {
      const dataUrl = await toPng(screenshotRef.current, { backgroundColor: '#0B0F19', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `opera-refleksi-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch { /* fallback: do nothing */ }
  };

  const handleShare = async () => {
    const text = `OPERA Refleksi\nKonflik: ${verdict.rootConflict}\nKejelasan: ${scores.overallClarity}%\n— opera.app`;
    if (navigator.share) {
      try { await navigator.share({ title: 'OPERA Refleksi', text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div ref={screenshotRef} className="mt-6 space-y-4">
      {/* Verdict header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-opera-chat-bubble">
          <Sparkles className="w-4 h-4 text-opera-mint" />
          <span className="text-xs font-semibold text-opera-mint uppercase tracking-wider">Kesimpulan</span>
        </div>
      </motion.div>

      {/* Score rings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="rounded-2xl bg-opera-chat-bubble p-6">
        <div className="flex justify-center gap-6 mb-4">
          {[
            { s: scores.overallClarity, l: 'Keseluruhan', c: '#4EEAAC' },
            { s: scores.emotionalAwareness, l: 'Emosional', c: '#F472B6' },
            { s: scores.logicalClarity, l: 'Logis', c: '#6366F1' },
          ].map(r => {
            const circ = 2 * Math.PI * 32;
            const off = circ - (r.s / 100) * circ;
            return (
              <div key={r.l} className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="32" fill="none" stroke="#1C2230" strokeWidth="5" />
                    <circle cx="36" cy="36" r="32" fill="none" stroke={r.c} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-white">{r.s}</span></div>
                </div>
                <span className="text-[10px] text-opera-muted mt-1">{r.l}</span>
              </div>
            );
          })}
        </div>
        {/* Bars */}
        <div className="space-y-3">
          {[
            { l: 'Kesadaran Emosi', s: scores.emotionalAwareness, c: '#F472B6' },
            { l: 'Kejelasan Logis', s: scores.logicalClarity, c: '#6366F1' },
            { l: 'Risiko Asumsi', s: scores.assumptionRisk, c: '#F59E0B' },
            { l: 'Kejelasan Total', s: scores.overallClarity, c: '#4EEAAC' },
          ].map(b => (
            <div key={b.l}>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-opera-muted">{b.l}</span><span style={{ color: b.c }}>{b.s}%</span></div>
              <div className="w-full h-2 bg-opera-surface rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${b.s}%`, background: `linear-gradient(90deg, ${b.c}, ${b.c}BB)` }} /></div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Insight cards */}
      {[
        { label: 'Akar Konflik', value: verdict.rootConflict, color: '#6366F1' },
        { label: 'Kekhawatiran Utama', value: verdict.mainConcern, color: '#4EEAAC' },
        { label: 'Faktor Tersembunyi', value: verdict.hiddenFactor, color: '#F472B6' },
      ].map((card, i) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }} className="rounded-2xl bg-opera-chat-bubble p-4">
          <p className="text-[11px] font-semibold mb-1" style={{ color: card.color }}>{card.label}</p>
          <p className="text-sm text-opera-text leading-relaxed">{card.value}</p>
        </motion.div>
      ))}

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.3 }} className="rounded-2xl bg-opera-chat-bubble p-4 border border-opera-sage/15">
        <p className="text-sm text-opera-text leading-relaxed">{verdict.reflectionSummary}</p>
      </motion.div>

      {/* Disclaimer */}
      <div className="rounded-2xl bg-opera-mint/5 border border-opera-mint/10 p-3">
        <p className="text-[11px] text-opera-text leading-relaxed"><span className="font-semibold text-opera-mint">Penting:</span> OPERA nggak nyuruh kamu milih apa. Ini cuma cermin — kejelasan yang kamu butuhin udah ada di dalam dirimu.</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-opera-chat-bubble hover:bg-opera-card text-opera-text text-sm font-medium transition-colors">
          <Download className="w-4 h-4 text-opera-sage" />Simpan Gambar
        </button>
        <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-opera-mint/10 hover:bg-opera-mint/20 text-opera-mint text-sm font-medium transition-colors">
          <Share2 className="w-4 h-4" />Bagikan
        </button>
      </div>

      {/* Nav */}
      <div className="flex gap-3 pt-1 pb-4">
        <button onClick={onNewReflection} className="btn-mint flex-1 justify-center text-sm"><RotateCcw className="w-3.5 h-3.5" />Refleksi Baru</button>
        <button onClick={onBackHome} className="btn-ghost flex-1 justify-center text-sm"><ArrowLeft className="w-3.5 h-3.5" />Beranda</button>
      </div>
    </div>
  );
}

// Import for the inline component above
import { RotateCcw } from 'lucide-react';

export default function CouncilRoom() {
  const { navigate, state, setPersonaResponses, setVerdict, addReflection, resetSession } = useApp();
  const [responses, setResponses] = useState<PersonaResponse[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>('group');
  const [privatePersona, setPrivatePersona] = useState<string>('luna');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<'loading' | 'chatting' | 'done'>('loading');
  const [typingPersona, setTypingPersona] = useState<string | null>(null);
  const [currentPersonaIdx, setCurrentPersonaIdx] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdict, setLocalVerdict] = useState<VerdictData | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Generate responses
  useEffect(() => {
    const dump = state.mindDump;
    if (!dump || generatedRef.current) return;
    generatedRef.current = true;
    const timer = setTimeout(() => {
      const gen = generatePersonaResponses(dump);
      setResponses(gen);
      setPersonaResponses(gen);
      setPhase('chatting');
      setTypingPersona(gen[0].id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.mindDump, setPersonaResponses]);

  // Sequential reveal: typing -> message -> next persona
  useEffect(() => {
    if (phase !== 'chatting' || responses.length === 0) return;
    if (currentPersonaIdx >= responses.length) {
      // All done
      setTypingPersona(null);
      setPhase('done');
      return;
    }

    if (typingPersona) {
      // Show typing for 1.5s, then reveal message
      const persona = responses[currentPersonaIdx];
      if (typingPersona !== persona.id) {
        setTypingPersona(persona.id);
        return;
      }
      const typingTimer = setTimeout(() => {
        const newMsg: ChatMessage = {
          id: `msg-${persona.id}-${Date.now()}`,
          personaId: persona.id,
          text: persona.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMsg]);
        setTypingPersona(null);
        scrollToBottom();
        // After message appears, move to next persona
        setTimeout(() => {
          setCurrentPersonaIdx(prev => prev + 1);
        }, 600);
      }, 1800);
      return () => clearTimeout(typingTimer);
    } else if (currentPersonaIdx < responses.length) {
      // Start typing for next persona
      const delay = setTimeout(() => {
        setTypingPersona(responses[currentPersonaIdx].id);
        scrollToBottom();
      }, 400);
      return () => clearTimeout(delay);
    }
  }, [phase, currentPersonaIdx, typingPersona, responses, scrollToBottom]);

  // When phase is done, show verdict button
  useEffect(() => {
    if (phase === 'done' && responses.length > 0 && !verdict) {
      const v = generateVerdict(state.mindDump!, responses);
      setVerdict(v);
      setLocalVerdict(v);
    }
  }, [phase, responses, state.mindDump, state.personaResponses, setVerdict, verdict]);

  const handleShowVerdict = () => {
    setShowVerdict(true);
    scrollToBottom();
  };

  const handleNewReflection = () => {
    if (verdict && state.mindDump) {
      const reflectionId = Date.now().toString();
      const cached = {
        id: reflectionId,
        date: new Date().toISOString(),
        category: state.mindDump.category,
        rootConflict: verdict.rootConflict,
        overthinkingLevel: state.mindDump.overthinkingLevel,
        clarityScores: verdict.clarityScores,
      };
      addReflection(cached);
    }
    resetSession();
  };

  // Empty state
  if (!state.mindDump) {
    return (
      <div className="min-h-screen bg-opera-chat-bg flex items-center justify-center px-6">
        <div className="text-center">
          <Users className="w-12 h-12 text-opera-sage mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">Belum ada curhatan</h2>
          <p className="text-opera-muted text-sm mb-6">Tulis dulu apa yang lagi kepikiran.</p>
          <button onClick={() => navigate('mind-dump')} className="btn-mint">Ke Curhat Dulu</button>
        </div>
      </div>
    );
  }

  // Filter messages based on mode
  const displayMessages = chatMode === 'group'
    ? messages
    : messages.filter(m => m.personaId === privatePersona || m.personaId === 'user');

  const activePersonas = chatMode === 'group'
    ? responses
    : responses.filter(r => r.id === privatePersona);

  return (
    <div className="min-h-screen bg-opera-chat-bg flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-0 z-40 bg-opera-chat-header border-b border-opera-border/30">
        <div className="max-w-2xl mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between h-14">
            <button onClick={() => navigate('mind-dump')} className="flex items-center gap-2 text-opera-muted hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                {activePersonas.map(p => {
                  const meta = PERSONA_META[p.id];
                  return (
                    <div key={p.id} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-opera-chat-header" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
                      {meta.avatar}
                    </div>
                  );
                })}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-tight">
                  {chatMode === 'group' ? 'Dewan OPERA' : PERSONA_META[privatePersona]?.name}
                </h3>
                <p className="text-[10px] text-opera-sage">
                  {phase === 'chatting' ? (
                    typingPersona ? `${PERSONA_META[typingPersona]?.name} lagi ngetik...` : 'online'
                  ) : phase === 'done' ? 'selesai' : 'online'}
                </p>
              </div>
            </div>
            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-opera-surface rounded-lg p-0.5">
              <button
                onClick={() => setChatMode('group')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${chatMode === 'group' ? 'bg-opera-chat-bubble text-white shadow-sm' : 'text-opera-muted hover:text-white'}`}
              >
                <Users className="w-3 h-3" />Grup
              </button>
              <button
                onClick={() => setChatMode('private')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${chatMode === 'private' ? 'bg-opera-chat-bubble text-white shadow-sm' : 'text-opera-muted hover:text-white'}`}
              >
                <UserCheck className="w-3 h-3" />1-on-1
              </button>
            </div>
          </div>

          {/* Private mode persona selector */}
          {chatMode === 'private' && (
            <div className="flex gap-2 pb-3">
              {responses.map(p => {
                const meta = PERSONA_META[p.id];
                const isActive = privatePersona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPrivatePersona(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${isActive ? 'bg-opera-chat-bubble text-white' : 'bg-opera-surface text-opera-muted hover:text-white'}`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>{meta.avatar}</div>
                    {meta.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* User's thoughts as quoted message */}
          <div className="pb-3">
            <div className="rounded-xl bg-opera-surface/60 border-l-2 border-opera-sage pl-3 pr-4 py-2">
              <p className="text-[10px] text-opera-sage font-semibold mb-0.5">Curhatan kamu</p>
              <p className="text-xs text-opera-muted line-clamp-2">{state.mindDump.thoughts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Date divider */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-[10px] text-opera-muted/50 bg-opera-surface/40 px-3 py-1 rounded-full">
              Hari Ini
            </span>
          </div>

          {/* Loading state */}
          {phase === 'loading' && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <motion.div
                  className="w-12 h-12 rounded-full bg-opera-sage/10 flex items-center justify-center mx-auto mb-4"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                >
                  <MessageCircle className="w-6 h-6 text-opera-sage" />
                </motion.div>
                <p className="text-white font-medium">Dewan lagi berkumpul...</p>
                <p className="text-xs text-opera-muted mt-1">Bentar ya, lagi siap-siap</p>
              </div>
            </div>
          )}

          {/* Messages */}
          {displayMessages.map((msg, i) => (
            <ChatBubble key={msg.id} msg={msg} animate={i >= displayMessages.length - 1} />
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {typingPersona && (chatMode === 'group' || typingPersona === privatePersona) && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <TypingIndicator name={PERSONA_META[typingPersona]?.name || ''} color={PERSONA_META[typingPersona]?.color || '#6366F1'} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verdict section */}
          {showVerdict && verdict && (
            <VerdictInline
              verdict={verdict}
              onNewReflection={handleNewReflection}
              onBackHome={() => navigate('landing')}
              screenshotRef={screenshotRef}
            />
          )}

          {/* Show verdict button */}
          {phase === 'done' && !showVerdict && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <button onClick={handleShowVerdict} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-opera-mint/10 hover:bg-opera-mint/20 text-opera-mint font-medium text-sm transition-colors">
                <Sparkles className="w-4 h-4" />Lihat Kesimpulan<ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}
