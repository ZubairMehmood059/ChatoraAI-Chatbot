import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle, Sparkles, KeyRound, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export type AuthModalView = 'signin' | 'signup' | 'forgot' | 'recovery' | 'verification_pending';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthModalView;
  onSuccess?: () => void;
  backendConfigured?: boolean | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'signin',
  onSuccess,
  backendConfigured = null,
}) => {
  const {
    user,
    isConfigured,
    isRecoveryMode,
    signIn,
    signUp,
    resendConfirmation,
    resetPassword,
    updatePassword,
    clearRecoveryMode,
  } = useAuth();

  const [view, setView] = useState<AuthModalView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);

  // Switch to recovery view automatically if recovery mode is active
  useEffect(() => {
    if (isRecoveryMode) {
      setView('recovery');
    } else if (isOpen) {
      setView(initialView);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanResendConfirmation(false);
  }, [isOpen, initialView, isRecoveryMode]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanResendConfirmation(false);
    if (view === 'recovery') {
      clearRecoveryMode();
    }
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please check your credentials.');
      setCanResendConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanResendConfirmation(false);

    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!agreedTerms) {
      setErrorMessage('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, displayName.trim());
      if (result.needsEmailVerification) {
        setView('verification_pending');
      } else {
        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanResendConfirmation(false);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccessMessage('If an account exists for this address, password reset instructions will arrive by email. Check your inbox and spam folder.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setCanResendConfirmation(false);

    if (!password || password.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccessMessage('Password updated successfully! You can now sign in.');
      setTimeout(() => {
        clearRecoveryMode();
        setView('signin');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email.trim()) {
      setErrorMessage('Enter your email address first, then request a confirmation link.');
      return;
    }

    setLoading(true);
    try {
      await resendConfirmation(email.trim());
      setSuccessMessage('If this address has an unconfirmed account, a confirmation email has been sent. Check your inbox and spam folder.');
      setCanResendConfirmation(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'The confirmation email could not be sent. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl z-10 overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
            boxShadow: 'var(--shadow-modal)',
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>

          {/* Config Status Pill if Supabase URL not yet set */}
          {(!isConfigured || backendConfigured === false) && (
            <div
              className="mb-4 p-2.5 rounded-xl border flex items-start gap-2.5 text-xs"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <Sparkles size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-wider text-amber-500">
                  Supabase Live Connection
                </p>
                <p className="text-[12px] opacity-80 mt-0.5">
                  {!isConfigured
                    ? <>Configure <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px]">VITE_SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px]">VITE_SUPABASE_ANON_KEY</code> to enable Supabase Auth in this browser.</>
                    : <>The backend cannot verify Supabase sessions yet. Configure <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px]">SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> (or <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px]">SB_SECRET_KEY</code>) on the server. Keep server secrets out of <code>VITE_</code> variables.</>}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs"
              style={{
                backgroundColor: 'var(--error-surface)',
                borderColor: 'var(--error)',
                color: 'var(--error)',
              }}
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              className="mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
              }}
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* VIEW: SIGN IN */}
          {view === 'signin' && (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={20} style={{ color: 'var(--primary)' }} />
                  <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Sign in to your Chatora AI account to access your private conversations.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs hover:underline cursor-pointer transition-colors"
                      style={{ color: 'var(--primary)' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-fg)',
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight size={16} />
                </button>
              </form>

              {canResendConfirmation && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading}
                  className="mt-3 w-full text-xs font-medium hover:underline disabled:opacity-50"
                  style={{ color: 'var(--primary)' }}
                >
                  {loading ? 'Sending confirmation…' : 'Resend signup confirmation email'}
                </button>
              )}

              <div className="mt-4 pt-4 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
                <p className="text-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Don’t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: 'var(--primary)' }}
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW: SIGN UP */}
          {view === 'signup' && (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                  <h2 className="text-xl font-bold tracking-tight">Create your account</h2>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Start private conversations backed by Supabase Auth security.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={agreedTerms}
                    onChange={e => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="terms-check" className="text-[11px] leading-tight select-none cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                    I agree to the Terms of Service and acknowledge the Privacy Policy.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50 mt-2"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-fg)',
                  }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="font-semibold hover:underline cursor-pointer"
                  style={{ color: 'var(--primary)' }}
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={20} style={{ color: 'var(--primary)' }} />
                  <h2 className="text-xl font-bold tracking-tight">Reset Password</h2>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Enter your email address and we'll send a secure password recovery link.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-fg)',
                  }}
                >
                  {loading ? 'Sending link...' : 'Send Recovery Email'}
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="font-semibold hover:underline cursor-pointer"
                  style={{ color: 'var(--primary)' }}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* VIEW: RECOVERY (RESET PASSWORD CONFIRMATION) */}
          {view === 'recovery' && (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={20} style={{ color: 'var(--primary)' }} />
                  <h2 className="text-xl font-bold tracking-tight">Set New Password</h2>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  You have accessed a secure password recovery session. Choose a strong new password.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                    New Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-fg)',
                  }}
                >
                  {loading ? 'Updating password...' : 'Update Password'}
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}

          {/* VIEW: VERIFICATION PENDING */}
          {view === 'verification_pending' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-500">
                <Mail size={24} />
              </div>
              <h2 className="text-lg font-bold mb-1.5">Verify your email</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                If Supabase created a new account for <span className="font-semibold text-[var(--text)]">{email}</span>, check your inbox and spam folder for a confirmation link. Existing accounts can sign in or use password recovery.
              </p>

              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}
              >
                {loading ? 'Sending confirmation…' : 'Resend confirmation email'}
              </button>

              <button
                type="button"
                onClick={() => setView('signin')}
                className="w-full mt-2 py-2 px-4 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                Return to Sign In
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
