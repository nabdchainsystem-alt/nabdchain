import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EnvelopeSimple,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  GoogleLogo,
  MicrosoftTeamsLogo,
  SpinnerGap,
  ChartLineUp,
  Users,
  Buildings,
  Lightning,
  ArrowLeft,
} from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

interface SignInPageProps {
  onNavigateToSignUp: () => void;
  onNavigateToLanding: () => void;
  onSignIn: () => void;
}

// Animated background slides
const FEATURE_SLIDES = [
  {
    icon: ChartLineUp,
    title: 'Real-time Analytics',
    desc: '50+ dashboards for instant business insights',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Work together seamlessly across departments',
  },
  {
    icon: Buildings,
    title: 'Mini Company Suite',
    desc: 'Finance, Sales, Inventory & Supplier management',
  },
  {
    icon: Lightning,
    title: 'Automation Rules',
    desc: 'Automate workflows and save hours every week',
  },
];

export const SignInPage: React.FC<SignInPageProps> = ({ onNavigateToSignUp, onNavigateToLanding, onSignIn }) => {
  const { _t } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURE_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSignIn();
    } catch (_err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = (_provider: string) => {
    // Trigger social sign in
    onSignIn();
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-black">
      {/* Left Panel - Feature Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-lg font-bold">
              N
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Nabd</span>
          </div>

          {/* Feature Carousel */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl mb-8">
                    {React.createElement(FEATURE_SLIDES[currentSlide].icon, {
                      size: 40,
                      weight: 'duotone',
                      className: 'text-white',
                    })}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">{FEATURE_SLIDES[currentSlide].title}</h2>
                  <p className="text-lg text-zinc-400">{FEATURE_SLIDES[currentSlide].desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Slide indicators */}
              <div className="flex justify-center gap-2 mt-12">
                {FEATURE_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? 'w-8 bg-white' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-zinc-500 text-sm">© 2026 Nabd Chain System. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Back Button */}
          <button
            onClick={onNavigateToLanding}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to home</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Welcome back</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Sign in to your account to continue</p>
          </div>

          {/* Social Sign In */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleSocialSignIn('google')}
              className="flex items-center justify-center gap-2 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <GoogleLogo size={20} weight="bold" className="text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Google</span>
            </button>
            <button
              onClick={() => handleSocialSignIn('microsoft')}
              className="flex items-center justify-center gap-2 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <MicrosoftTeamsLogo size={20} weight="bold" className="text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-sm text-zinc-400">or continue with email</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Email address</label>
              <div className="relative">
                <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <button type="button" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <SpinnerGap size={20} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToSignUp}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Create one now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
