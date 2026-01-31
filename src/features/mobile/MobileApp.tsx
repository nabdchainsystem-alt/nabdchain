import React, { useState, Suspense } from 'react';
import { SignedIn, SignedOut, useUser, useAuth } from '../../auth-adapter';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { NotePencil, CheckSquare, Gear, SignOut, Eye, EyeSlash, ArrowLeft, GameController } from 'phosphor-react';
import { MobileNotes } from './MobileNotes';
import { MobileTasks } from './MobileTasks';
import { MobileSettings } from './MobileSettings';
import { useClerk } from '@clerk/clerk-react';
import { useUserPreferences } from '../../hooks/useUserPreferences';

// Lazy load arcade
const ArcadePage = React.lazy(() => import('../arcade/ArcadePage'));

type MobileView = 'notes' | 'tasks' | 'settings' | 'arcade';
type AuthView = 'landing' | 'signin' | 'signup';

// ============ MOBILE CONTENT (After Sign In) ============
const MobileContent: React.FC = () => {
  const [activeView, setActiveView] = useState<MobileView>('tasks');
  const { user } = useUser();
  const { signOut } = useClerk();

  // Sync user preferences (display name) with server
  useUserPreferences();

  const navItems: { id: MobileView; icon: React.ReactNode; label: string }[] = [
    { id: 'tasks', icon: <CheckSquare size={24} weight="fill" />, label: 'Tasks' },
    { id: 'notes', icon: <NotePencil size={24} weight="fill" />, label: 'Notes' },
    { id: 'arcade', icon: <GameController size={24} weight="fill" />, label: 'Arcade' },
    { id: 'settings', icon: <Gear size={24} weight="fill" />, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-gray-800">NABD Mobile</span>
        </div>
        <button
          onClick={() => signOut(() => window.location.reload())}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Sign out"
        >
          <SignOut size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-auto">
        {activeView === 'notes' && <MobileNotes />}
        {activeView === 'tasks' && <MobileTasks />}
        {activeView === 'arcade' && (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ArcadePage />
          </Suspense>
        )}
        {activeView === 'settings' && <MobileSettings />}
      </main>

      <nav className="bg-white border-t border-gray-200 flex-shrink-0 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                activeView === item.id
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// ============ MOBILE LANDING PAGE ============
const MobileLanding: React.FC<{ onSignIn: () => void; onSignUp: () => void }> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-3xl">N</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">NABD Mobile</h1>
        <p className="text-white/80 text-lg max-w-xs">
          Quick access to your tasks and notes on the go
        </p>

        {/* Features */}
        <div className="mt-8 space-y-3 text-left">
          <div className="flex items-center gap-3 text-white/90">
            <CheckSquare size={24} weight="fill" />
            <span>Simple task management</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <NotePencil size={24} weight="fill" />
            <span>Quick notes with copy</span>
          </div>
        </div>
      </div>

      {/* Auth Buttons */}
      <div className="p-6 space-y-3 safe-area-bottom">
        <button
          onClick={onSignIn}
          className="w-full py-4 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          Sign In
        </button>
        <button
          onClick={onSignUp}
          className="w-full py-4 bg-white/20 text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/30 active:scale-[0.98] transition-all"
        >
          Create Account
        </button>
        <p className="text-center text-white/60 text-sm mt-4">
          Lightweight version for mobile
        </p>
      </div>
    </div>
  );
};

// ============ MOBILE SIGN IN PAGE ============
const MobileSignInPage: React.FC<{ onBack: () => void; onSignUp: () => void }> = ({ onBack, onSignUp }) => {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Redirect to mobile.nabdchain.com
        window.location.href = window.location.origin;
      } else {
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800 pr-10">Sign In</h1>
      </header>

      {/* Form */}
      <div className="flex-1 p-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">N</span>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account?{' '}
          <button onClick={onSignUp} className="text-blue-600 font-medium">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

// ============ MOBILE SIGN UP PAGE ============
const MobileSignUpPage: React.FC<{ onBack: () => void; onSignIn: () => void }> = ({ onBack, onSignIn }) => {
  const { signUp, isLoaded, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password: password,
        firstName: firstName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        window.location.href = window.location.origin;
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center font-semibold text-gray-800 pr-10">
          {pendingVerification ? 'Verify Email' : 'Create Account'}
        </h1>
      </header>

      {/* Form */}
      <div className="flex-1 p-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">N</span>
        </div>

        {!pendingVerification ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-center text-gray-600 mb-4">
              We sent a verification code to <strong>{email}</strong>
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest"
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        {!pendingVerification && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <button onClick={onSignIn} className="text-blue-600 font-medium">
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

// ============ MOBILE AUTH FLOW ============
const MobileAuth: React.FC = () => {
  const [view, setView] = useState<AuthView>('landing');

  if (view === 'signin') {
    return <MobileSignInPage onBack={() => setView('landing')} onSignUp={() => setView('signup')} />;
  }

  if (view === 'signup') {
    return <MobileSignUpPage onBack={() => setView('landing')} onSignIn={() => setView('signin')} />;
  }

  return <MobileLanding onSignIn={() => setView('signin')} onSignUp={() => setView('signup')} />;
};

// ============ MAIN MOBILE APP ============
export const MobileApp: React.FC = () => {
  return (
    <>
      <SignedOut>
        <MobileAuth />
      </SignedOut>
      <SignedIn>
        <MobileContent />
      </SignedIn>
    </>
  );
};

export default MobileApp;
