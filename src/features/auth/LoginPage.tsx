import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout, Mail, Lock, ArrowRight, AlertCircle, BarChart2, PieChart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginPage: React.FC = () => {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            const success = await login(email, password);
            if (!success) {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

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
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F9FB] overflow-hidden relative font-sans text-gray-800">

            {/* Visual Decoration Container - Left Side */}
            <div className="absolute left-[10%] top-[20%] hidden lg:block opacity-60">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 w-64"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><BarChart2 size={18} /></div>
                        <span className="font-semibold text-sm">Monthly Revenue</span>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                        {[40, 70, 50, 90, 60, 80].map((h, i) => (
                            <motion.div
                                key={i}
                                className="w-full bg-blue-600 rounded-t-sm opacity-80"
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 1.5, delay: 0.5 + (i * 0.1), type: 'spring' }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Visual Decoration Container - Right Side */}
            <div className="absolute right-[10%] bottom-[20%] hidden lg:block opacity-60">
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 w-72"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Activity size={18} /></div>
                        <span className="font-semibold text-sm">System Activity</span>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.2 + (i * 0.2) }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-2 w-3/4 bg-gray-200 rounded-full" />
                                    <div className="h-2 w-1/2 bg-gray-100 rounded-full" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>


            {/* Background Shapes */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/50 blur-[80px]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/50 blur-[80px]"
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md p-6 relative z-10"
            >
                <div className="bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-10 border border-white/50 backdrop-blur-sm">

                    <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
                        <motion.div
                            whileHover={{ rotate: 180, scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                            className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6"
                        >
                            <Layout className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-gray-500 text-center font-medium">Please enter your details to sign in</p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <motion.div variants={itemVariants} className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className={`h-5 w-5 transition-colors duration-200 ${focusedInput === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onFocus={() => setFocusedInput('email')}
                                    onBlur={() => setFocusedInput(null)}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className={`h-5 w-5 transition-colors duration-200 ${focusedInput === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="flex items-center p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl"
                                >
                                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-xl shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isLoading ? (
                                <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
