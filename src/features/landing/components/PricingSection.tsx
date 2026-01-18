import React from 'react';
import { motion } from 'framer-motion';

export const PricingSection: React.FC = () => {
    return (
        <section className="py-24 px-6 bg-[#FAFAFA] dark:bg-monday-dark-bg">
            <div className="max-w-6xl mx-auto">
                <div className="relative rounded-[2.5rem] bg-white dark:bg-monday-dark-surface border border-zinc-100 dark:border-monday-dark-border shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden p-16 md:p-24 text-center">
                    {/* Background Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#2563EB]/5 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#2563EB]/10 to-transparent rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-monday-dark-text mb-6">
                            Start now, <br />
                            no strings attached
                        </h2>
                        <p className="text-lg text-zinc-500 dark:text-monday-dark-text-secondary max-w-lg mx-auto mb-10">
                            Integrate complete user management in minutes. Free for your first 10,000 monthly active users and 100 monthly active orgs. No credit card required.
                        </p>

                        <button className="px-8 py-3.5 rounded-lg bg-[#2563EB] text-white font-medium hover:bg-[#1d4ed8] transition-shadow shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]">
                            Start building &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
