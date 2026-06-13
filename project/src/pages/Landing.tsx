import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Brain, ArrowRight, Sparkles, Heart, Lightbulb, Flame, X, Mail, Lock, User, Briefcase, ChevronRight, ChevronLeft } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const PERSONAS = [
  { name: 'Luna', role: 'Si Empati', color: '#F472B6', Icon: Heart, desc: 'Merasakan apa yang kamu rasakan — selalu dengarkan hati dulu' },
  { name: 'Sage', role: 'Si Analis', color: '#6366F1', Icon: Lightbulb, desc: 'Urai pelannya satu per satu — cari pola di balik kegamangan' },
  { name: 'Baz', role: 'Si Penantang', color: '#F59E0B', Icon: Flame, desc: 'Pertanyakan asumsi kamu — kadang kita butuh ditampar sadar' },
];

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { setUserProfile, navigate } = useApp();
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const [step, setStep] = useState(0);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setError('');
    try { await signInWithGoogle(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Gagal masuk dengan Google'); }
  };

  const handleAuth = async () => {
    setError(''); setLoading(true);
    try {
      if (isLogin) await signIn(email, password); else await signUp(email, password);
      setStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal masuk');
    } finally { setLoading(false); }
  };

  const handleProfile = async () => {
    if (!age.trim() || !profession.trim()) { setError('Isi dulu ya, biar kami bisa ngasih perspektif yang pas'); return; }
    setUserProfile({ email, age, profession });
    if (user) await supabase.from('profiles').upsert({ id: user.id, email, age, profession });
    onClose(); navigate('mind-dump');
  };

  const canProceed = step === 0 ? email.trim().length > 0 && password.length >= 6 : age.trim().length > 0 && profession.trim().length > 0;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative w-full max-w-md glass-card p-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-opera-muted hover:text-white"><X className="w-5 h-5" /></button>
          <div className="flex gap-2 mb-8">
            {[0, 1].map(s => (<div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-gradient-to-r from-opera-indigo to-opera-mint' : 'bg-opera-border'}`} />))}
          </div>
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="auth" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-2 mb-1"><Brain className="w-5 h-5 text-opera-indigo" /><span className="text-xs text-opera-muted uppercase tracking-wider">Langkah 1</span></div>
                <h2 className="text-2xl font-bold text-white mb-1">{isLogin ? 'Selamat datang lagi' : 'Buat akun dulu yuk'}</h2>
                <p className="text-sm text-opera-muted mb-6">{isLogin ? 'Masuk buat lanjutin refleksi kamu.' : 'Mulai perjalanan memahami isi kepala kamu.'}</p>

                <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] mb-4">
                  <GoogleIcon />
                  <span>{isLogin ? 'Masuk pakai Google' : 'Daftar pakai Google'}</span>
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-opera-border" />
                  <span className="text-xs text-opera-muted uppercase">atau</span>
                  <div className="flex-1 h-px bg-opera-border" />
                </div>

                <div className="space-y-4">
                  <div><label className="text-sm text-opera-muted mb-1 block">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-opera-muted" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kamu@email.com" className="input-field pl-10" /></div></div>
                  <div><label className="text-sm text-opera-muted mb-1 block">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-opera-muted" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 karakter" className="input-field pl-10" minLength={6} /></div></div>
                </div>
                {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
                <button onClick={handleAuth} disabled={loading || !canProceed} className="btn-mint w-full justify-center mt-6 disabled:opacity-40">{loading ? 'Bentar ya...' : isLogin ? 'Masuk' : 'Buat Akun'}<ChevronRight className="w-4 h-4" /></button>
                <p className="text-sm text-opera-muted text-center mt-4">{isLogin ? 'Belum punya akun?' : 'Udah punya akun?'} <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-opera-mint hover:underline">{isLogin ? 'Daftar dulu' : 'Masuk aja'}</button></p>
              </motion.div>
            ) : (
              <motion.div key="profile" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-2 mb-1"><User className="w-5 h-5 text-opera-mint" /><span className="text-xs text-opera-muted uppercase tracking-wider">Langkah 2</span></div>
                <h2 className="text-2xl font-bold text-white mb-1">Kenalin, siapa kamu?</h2>
                <p className="text-sm text-opera-muted mb-6">Biar perspektif yang kami kasih makin pas buat situasi kamu.</p>
                <div className="space-y-4">
                  <div><label className="text-sm text-opera-muted mb-1 block">Umur</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-opera-muted" /><input type="text" value={age} onChange={e => setAge(e.target.value)} placeholder="cth. 24" className="input-field pl-10" /></div></div>
                  <div><label className="text-sm text-opera-muted mb-1 block">Pekerjaan</label><div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-opera-muted" /><input type="text" value={profession} onChange={e => setProfession(e.target.value)} placeholder="cth. Software Engineer, Mahasiswa..." className="input-field pl-10" /></div></div>
                </div>
                {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(0)} className="btn-ghost"><ChevronLeft className="w-4 h-4" />Kembali</button>
                  <button onClick={handleProfile} disabled={!canProceed} className="btn-mint flex-1 justify-center disabled:opacity-40">Mulai Refleksi<ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Landing() {
  const { navigate } = useApp();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const handleStart = () => { if (user) navigate('mind-dump'); else setModalOpen(true); };

  return (
    <div className="min-h-screen bg-opera-bg">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-opera-indigo/8 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-opera-mint/6 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-opera-indigo/4 rounded-full blur-[200px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-opera-mint font-medium"><Sparkles className="w-4 h-4" />Peta Konflik dalam Dirimu</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              <span className="text-white">Kepalamu nggak</span><br />
              <span className="text-white">bingung. Kepalamu</span> <span className="gradient-text">buntu.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-opera-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              OPERA bantu peta konflik di dalam kepala kamu lewat tiga suara yang saling berdebat — biar kamu ngerti kenapa kamu gamang, bukan nyuruh kamu milih apa.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleStart} className="btn-mint text-lg px-8 py-4">Mulai Refleksi<ArrowRight className="w-5 h-5" /></button>
              <button onClick={() => document.getElementById('personas')?.scrollIntoView({ behavior: 'smooth' })} className="btn-ghost text-lg px-8 py-4">Kenali Dewan</button>
            </motion.div>
          </motion.div>
        </div>
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="w-6 h-10 rounded-full border-2 border-opera-border flex justify-center pt-2"><div className="w-1 h-2 bg-opera-muted rounded-full" /></div>
        </motion.div>
      </section>

      {/* Personas */}
      <section id="personas" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white mb-4">Kenali <span className="gradient-text">Dewan</span></motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-opera-muted text-lg max-w-xl mx-auto">Tiga suara yang bakal ngasih perspektif beda-beda soal masalah kamu</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERSONAS.map((p, i) => (
              <motion.div key={p.name} variants={fadeUp} custom={i} className="glass-card p-8 text-center group">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${p.color}12` }}>
                  <p.Icon className="w-8 h-8" style={{ color: p.color }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                <p className="text-sm font-medium mb-3" style={{ color: p.color }}>{p.role}</p>
                <p className="text-sm text-opera-muted leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="glass-card p-8 border-red-500/15">
            <h3 className="text-2xl font-bold text-white mb-5">Masalahnya</h3>
            <ul className="space-y-3 text-opera-muted">
              {['Overthinking bikin kamu makin buntu, bukan makin jelas', 'Konflik di dalam diri nggak kelihatan — kamu cuma ngerasa gamang tapi nggak tahu kenapa', 'Nanya ke orang lain malah nambah suara yang bikin makin bingung', 'Kebanyakan tools ngasih jawaban, bukan pemahaman'].map(t => (
                <li key={t} className="flex items-start gap-3"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />{t}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="glass-card p-8 border-opera-mint/15">
            <h3 className="text-2xl font-bold text-white mb-5">Cara OPERA</h3>
            <ul className="space-y-3 text-opera-muted">
              {['Peta konflik yang nggak kelihatan — jadi kelihatan', 'Tiga suara mewakili bagian-bagian dirimu yang saling tarik-menarik', 'Ngrti kenapa kamu gamang, bukan nyuruh kamu milih apa', 'Lacak perkembanganmu dari waktu ke waktu lewat riwayat refleksi'].map(t => (
                <li key={t} className="flex items-start gap-3"><span className="w-1.5 h-1.5 rounded-full bg-opera-mint mt-2 shrink-0" />{t}</li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white mb-6">Siap ngerti isi kepalamu?</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-opera-muted text-lg mb-8">Mulai refleksi pertama kamu, biar dewan bisa bantu terangi apa yang sebenernya terjadi.</motion.p>
          <motion.div variants={fadeUp} custom={2}><button onClick={handleStart} className="btn-mint text-lg px-8 py-4">Mulai Refleksi<ArrowRight className="w-5 h-5" /></button></motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-opera-border/20 py-8 px-6 text-center text-sm text-opera-muted">
        <div className="flex items-center justify-center gap-2 mb-2"><Brain className="w-5 h-5 text-opera-indigo" /><span className="font-bold tracking-wider text-white">OPERA</span></div>
        <p>Overthinking Perspective & Emotional Response Assistant</p>
      </footer>

      <OnboardingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
