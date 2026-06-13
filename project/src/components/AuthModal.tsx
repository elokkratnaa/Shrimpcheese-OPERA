import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, Brain } from 'lucide-react';

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

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) await signUp(email, password);
      else await signIn(email, password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal masuk');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal masuk dengan Google');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative w-full max-w-md glass-card p-8">
            <button onClick={onClose} className="absolute top-4 right-4 text-opera-muted hover:text-white"><X className="w-5 h-5" /></button>

            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-6 h-6 text-opera-indigo" />
              <span className="text-xl font-bold text-white">{isSignUp ? 'Buat Akun' : 'Selamat Datang'}</span>
            </div>
            <p className="text-sm text-opera-muted mb-6">{isSignUp ? 'Simpan refleksi kamu dan lacak perkembanganmu.' : 'Masuk buat akses riwayat refleksi kamu.'}</p>

            <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
              <GoogleIcon />
              <span>{isSignUp ? 'Daftar pakai Google' : 'Masuk pakai Google'}</span>
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-opera-border" />
              <span className="text-xs text-opera-muted uppercase">atau pakai email</span>
              <div className="flex-1 h-px bg-opera-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-opera-muted mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-opera-muted" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kamu@email.com" className="input-field pl-10" required />
                </div>
              </div>
              <div>
                <label className="text-sm text-opera-muted mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-opera-muted" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 karakter" className="input-field pl-10" required minLength={6} />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">{loading ? 'Bentar ya...' : isSignUp ? 'Buat Akun' : 'Masuk'}</button>
            </form>

            <p className="text-sm text-opera-muted text-center mt-4">
              {isSignUp ? 'Udah punya akun?' : 'Belum punya akun?'}{' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-opera-mint hover:underline">{isSignUp ? 'Masuk aja' : 'Daftar dulu'}</button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
