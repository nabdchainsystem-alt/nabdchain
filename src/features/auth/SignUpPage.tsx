import React, { useState, useEffect } from 'react';
import { useSignUp } from '../../auth-adapter';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../../components/Logo';
import {
    CheckCircle, Users, ArrowRight, Shield, Lightning as Zap, Sparkle as Sparkles, CircleNotch as Loader2, User, Buildings as Building, Envelope as Mail, Lock, Phone,
    ShoppingCart, FileText, ChartBar as BarChart, Chat as MessageSquare, CheckSquare, Layout,
    ListChecks as ListTodo, Clock, BookOpen, PenNib as PenTool, Brain, MapTrifold as Map, GridFour as Grid, Cube as Box, Globe, CaretRight as ChevronRight, ArrowLeft
} from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

interface SignUpPageProps {
    onNavigateToLogin: () => void;
}

// Wizard Steps
type Step = 'discovery' | 'personal' | 'account' | 'verification';

// --- Externalize static components and variants to prevent re-renders ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

// Extracted wrapper component
const StepWrapper = ({ children, stepKey }: { children: React.ReactNode, stepKey: string }) => (
    <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
    >
        {children}
    </motion.div>
);

// --- Slides Data with Theme Colors ---
const FEATURE_SLIDES = [
    {
        id: 'supply',
        icon: Globe,
        title: "The Future of Supply Chain",
        highlight: "Supply Chain",
        desc: "Join thousands of teams streamlining their logistics with our AI-driven platform.",
        features: [
            { icon: Users, title: "Global Tracking", desc: "Real-time visibility across 150+ countries" },
            { icon: Zap, title: "AI Automation", desc: "Predictive analytics that save 20+ hours/week" },
            { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption for all your data" }
        ],
        // Blue / Cyan Theme
        theme: {
            primary: "from-blue-500 to-cyan-400",
            textGradient: "from-blue-400 to-cyan-300",
            orb1: "bg-blue-600/20",
            orb2: "bg-cyan-500/20",
            orb3: "bg-indigo-500/20",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-400"
        }
    },
    {
        id: 'procurement',
        icon: ShoppingCart,
        title: "Intelligent Procurement",
        highlight: "Procurement",
        desc: "Automate your purchasing workflows and optimize supplier relationships instantly.",
        features: [
            { icon: FileText, title: "Smart RFQs", desc: "Generate and send RFQs in seconds" },
            { icon: Layout, title: "Vendor Matching", desc: "AI-suggested suppliers for your needs" },
            { icon: BarChart, title: "Cost Analysis", desc: "Real-time spending insights & forecasts" }
        ],
        // Purple / Pink Theme
        theme: {
            primary: "from-purple-500 to-pink-400",
            textGradient: "from-purple-400 to-pink-300",
            orb1: "bg-purple-600/20",
            orb2: "bg-pink-500/20",
            orb3: "bg-fuchsia-500/20",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-400"
        }
    },
    {
        id: 'collaboration',
        icon: MessageSquare,
        title: "Seamless Collaboration",
        highlight: "Collaboration",
        desc: "Unify your team communication and documentation in one secure workspace.",
        features: [
            { icon: Users, title: "Contextual Chat", desc: "Discuss orders directly in context" },
            { icon: Mail, title: "Email Integration", desc: "Sync your inbox with your workflow" },
            { icon: CheckSquare, title: "Task Management", desc: "Track assignments and deadlines" }
        ],
        // Emerald / Teal Theme
        theme: {
            primary: "from-emerald-500 to-teal-400",
            textGradient: "from-emerald-400 to-teal-300",
            orb1: "bg-emerald-600/20",
            orb2: "bg-teal-500/20",
            orb3: "bg-green-500/20",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-400"
        }
    },
    {
        id: 'gtd',
        icon: CheckCircle,
        title: "Master Your Productivity",
        highlight: "Getting Things Done",
        desc: "A built-in GTD system to capture, clarify, and organize your work life.",
        features: [
            { icon: ListTodo, title: "Next Actions", desc: "Clear, organized task lists for every context" },
            { icon: Clock, title: "Weekly Review", desc: "Guided workflows to keep you on track" },
            { icon: CheckSquare, title: "Inbox Zero", desc: "Capture ideas instantly, process them later" }
        ],
        // Amber / Orange Theme
        theme: {
            primary: "from-amber-500 to-orange-400",
            textGradient: "from-amber-400 to-orange-300",
            orb1: "bg-amber-600/20",
            orb2: "bg-orange-500/20",
            orb3: "bg-yellow-500/20",
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-400"
        }
    },
    {
        id: 'cornell',
        icon: BookOpen,
        title: "Structured Knowledge",
        highlight: "Cornell Notes",
        desc: "Advanced note-taking designed for better retention and clear summaries.",
        features: [
            { icon: PenTool, title: "Smart Layout", desc: "Split layout for cues, notes, and summaries" },
            { icon: Brain, title: "Active Recall", desc: "Tools designed to boost your memory" },
            { icon: FileText, title: "Digital Notebooks", desc: "Organize research by project or topic" }
        ],
        // Indigo / Violet Theme
        theme: {
            primary: "from-indigo-500 to-violet-400",
            textGradient: "from-indigo-400 to-violet-300",
            orb1: "bg-indigo-600/20",
            orb2: "bg-violet-500/20",
            orb3: "bg-blue-500/20",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-400"
        }
    },
    {
        id: 'warehouse',
        icon: Map,
        title: "Warehouse Intelligence",
        highlight: "Capacity Maps",
        desc: "Visualize storage utilization and optimize your warehouse layout in real-time.",
        features: [
            { icon: Grid, title: "Heatmap View", desc: "Instantly spot bottlenecks and empty space" },
            { icon: Box, title: "Space Optimization", desc: "AI suggestions for better shelving" },
            { icon: BarChart, title: "Inventory Tracking", desc: "Visual location tracking for all SKUs" }
        ],
        // Rose / Red Theme
        theme: {
            primary: "from-rose-500 to-red-400",
            textGradient: "from-rose-400 to-red-300",
            orb1: "bg-rose-600/20",
            orb2: "bg-red-500/20",
            orb3: "bg-orange-500/20",
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-400"
        }
    }
];

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigateToLogin }) => {
    const { t } = useAppContext();
    const { isLoaded, signUp, setActive } = useSignUp();
    const [step, setStep] = useState<Step>('discovery');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carousel State
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Auto-loop slides
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlideIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
        }, 8000); // Change every 8 seconds
        return () => clearInterval(interval);
    }, []);

    const currentSlide = FEATURE_SLIDES[currentSlideIndex];

    // Form State
    const [formData, setFormData] = useState({
        industry: '',
        teamSize: '',
        role: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        code: ''
    });

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);

        try {
            await signUp.create({
                emailAddress: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                unsafeMetadata: {
                    industry: formData.industry,
                    teamSize: formData.teamSize,
                    role: formData.role,
                    phone: formData.phone
                }
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setStep('verification');
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || t('something_went_wrong_retry'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: formData.code,
            });

            if (completeSignUp.status !== 'complete') {
                setError(t('verification_not_completed'));
            } else {
                await setActive({ session: completeSignUp.createdSessionId });
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors?.[0]?.message || t('invalid_code'));
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'discovery':
                return (
                    <StepWrapper stepKey="discovery">
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('industry')}</label>
                                <div className="relative group">
                                    <Building className="absolute start-3 top-3 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                                    <select
                                        className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                        value={formData.industry}
                                        onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                    >
                                        <option value="">{t('select_your_industry')}</option>
                                        <option value="logistics">{t('logistics_supply_chain')}</option>
                                        <option value="manufacturing">{t('manufacturing')}</option>
                                        <option value="retail">{t('retail_ecommerce')}</option>
                                        <option value="healthcare">{t('healthcare')}</option>
                                        <option value="technology">{t('technology')}</option>
                                        <option value="other">{t('other')}</option>
                                    </select>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('company_size')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['1-10', '11-50', '51-200', '201+'].map(size => (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            key={size}
                                            onClick={() => setFormData({ ...formData, teamSize: size })}
                                            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${formData.teamSize === size
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                }`}
                                        >
                                            {size} {t('employees')}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.button
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                    if (formData.industry && formData.teamSize) setStep('personal');
                                    else setError(t('please_complete_fields'));
                                }}
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-black/5 dark:shadow-white/5"
                            >
                                {t('next_step')} <ChevronRight size={18} />
                            </motion.button>
                        </motion.div>
                    </StepWrapper>
                );

            case 'personal':
                return (
                    <StepWrapper stepKey="personal">
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('first_name')}</label>
                                    <div className="relative group">
                                        <User className="absolute start-3 top-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="John"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                </motion.div>
                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('last_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </motion.div>
                            </div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('phone_number')}</label>
                                <div className="relative group">
                                    <Phone className="absolute start-3 top-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="tel"
                                        className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep('discovery')}
                                    className="w-1/3 py-4 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    {t('back')}
                                </button>
                                <button
                                    onClick={() => {
                                        if (formData.firstName && formData.lastName) setStep('account');
                                        else setError(t('name_required'));
                                    }}
                                    className="w-2/3 bg-black dark:bg-white text-white dark:text-black font-semibold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/5"
                                >
                                    {t('next_step')} <ChevronRight size={18} />
                                </button>
                            </motion.div>
                        </motion.div>
                    </StepWrapper>
                );

            case 'account':
                return (
                    <StepWrapper stepKey="account">
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                            <form onSubmit={handleCreateAccount} className="space-y-4">
                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('work_email')}</label>
                                    <div className="relative group">
                                        <Mail className="absolute start-3 top-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="name@company.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('password')}</label>
                                    <div className="relative group">
                                        <Lock className="absolute start-3 top-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            required
                                            className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep('personal')}
                                        className="w-1/3 py-4 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                    >
                                        {t('back')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-2/3 bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : t('create_account')}
                                    </button>
                                </motion.div>
                            </form>
                        </motion.div>
                    </StepWrapper>
                );

            case 'verification':
                return (
                    <StepWrapper stepKey="verification">
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 text-center">
                            <motion.div variants={itemVariants} className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="text-blue-600 dark:text-blue-400" size={32} />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <h3 className="text-xl font-bold mb-2">{t('check_your_email')}</h3>
                                <p className="text-gray-500 text-sm">{t('sent_verification_code')} <span className="font-semibold text-gray-800 dark:text-gray-200">{formData.email}</span></p>
                            </motion.div>

                            <form onSubmit={handleVerify} className="space-y-6">
                                <motion.input
                                    variants={itemVariants}
                                    type="text"
                                    maxLength={6}
                                    className="w-full text-center text-3xl font-mono tracking-widest py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all bg-transparent"
                                    placeholder="000000"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                                />
                                <motion.button
                                    variants={itemVariants}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : t('verify_launch')}
                                </motion.button>
                            </form>
                        </motion.div>
                    </StepWrapper>
                );
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden">
            {/* LEFT SIDE - Wizard Form */}
            <div className="w-full lg:w-1/2 flex flex-col px-8 lg:px-24 py-12 relative z-10 bg-white dark:bg-black">

                {/* Back Button */}
                <button
                    onClick={() => window.location.href = '/'}
                    className="absolute top-8 left-8 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>

                <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center pt-12">

                    {/* Logo */}
                    <div className="mb-8 flex justify-center">
                        <Logo className="h-20 w-auto" showText={true} textClassName="scale-125 ml-3" />
                    </div>

                    {/* Progress Indicator */}
                    {step !== 'verification' && (
                        <div className="flex items-center gap-2 mb-10">
                            {['discovery', 'personal', 'account'].map((s, i) => {
                                const stepIndex = ['discovery', 'personal', 'account'].indexOf(step);
                                const isCurrent = stepIndex === i;
                                const isCompleted = stepIndex > i;

                                return (
                                    <motion.div
                                        key={s}
                                        className={`h-1.5 rounded-full transition-colors duration-300 ${isCurrent ? 'bg-blue-600' : isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`}
                                        animate={{ width: isCurrent ? 40 : 12 }}
                                    />
                                )
                            })}
                        </div>
                    )}

                    <div className="mb-8">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
                            {step === 'discovery' ? t('tell_us_about_team') :
                                step === 'personal' ? t('who_are_you') :
                                    step === 'account' ? t('secure_your_account') : t('verify_email')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            {step === 'discovery' ? t('customize_workspace_industry') :
                                step === 'personal' ? t('enter_details_personalize') :
                                    step === 'account' ? t('choose_strong_password') : t('enter_code_inbox')}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2"
                        >
                            <Shield className="shrink-0" size={16} />
                            {error}
                        </motion.div>
                    )}

                    {step === 'discovery' && (
                        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
                            {t('already_have_account')}{' '}
                            <button
                                onClick={onNavigateToLogin}
                                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                                type="button"
                            >
                                {t('sign_in')}
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex justify-between">
                    <span>© 2025 NABD Chain System</span>
                    <div className="space-x-4 rtl:space-x-reverse">
                        <a href="#" className="hover:text-gray-600">{t('privacy')}</a>
                        <a href="#" className="hover:text-gray-600">{t('terms')}</a>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Loopable Slides */}
            <div className="hidden lg:flex w-1/2 bg-black relative items-center justify-center overflow-hidden">

                {/* Angled Separator */}
                <div
                    className="absolute top-0 bottom-0 left-0 w-[80px] z-20 bg-white dark:bg-black"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                />

                {/* Optimized Static Background with Dynamic Colored Orbs */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentSlide.id + "-bg"}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 z-0 bg-[#020617] overflow-hidden"
                    >
                        {/* Static gradient meshes */}
                        <div className="absolute inset-0 opacity-40"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #020617 100%)'
                            }}
                        />

                        {/* Orb 1 */}
                        <motion.div
                            className={`absolute w-[500px] h-[500px] ${currentSlide.theme.orb1} rounded-full blur-[100px]`}
                            style={{ top: '20%', left: '20%', willChange: 'transform' }}
                            transition={{
                                duration: 18,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Content Overlay - Carousel */}
                <div className="relative z-10 text-center px-12 w-full max-w-2xl h-full flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="w-full"
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className={`w-20 h-20 bg-gradient-to-br ${currentSlide.theme.primary} rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg ring-1 ring-white/20`}
                            >
                                <currentSlide.icon className="text-white fill-white/20" size={40} />
                            </motion.div>

                            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                                {currentSlide.title.split(currentSlide.highlight)[0]}
                                <br />
                                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${currentSlide.theme.textGradient}`}>
                                    {currentSlide.highlight}
                                </span>
                            </h2>

                            <p className="text-gray-300/80 mb-12 text-lg leading-relaxed max-w-lg mx-auto">
                                {currentSlide.desc}
                            </p>

                            <div className="flex flex-col gap-6 items-center">
                                {currentSlide.features.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (i * 0.1) }}
                                        className="flex items-start gap-4 text-left w-full max-w-md p-4 rounded-xl hover:bg-white/5 transition-colors cursor-default"
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${currentSlide.theme.iconBg} flex items-center justify-center shrink-0`}>
                                            <item.icon size={20} className={currentSlide.theme.iconColor} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white text-lg">{item.title}</h3>
                                            <p className="text-gray-400 text-sm">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3">
                        {FEATURE_SLIDES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlideIndex(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlideIndex
                                    ? `w-8 bg-gradient-to-r ${currentSlide.theme.primary}`
                                    : 'w-2 bg-gray-700 hover:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
