import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Lightning, Rocket, Star, Buildings, Users, Database, Headset, ChartLineUp, Gear, Code, Infinity } from 'phosphor-react';

interface PricingTier {
    id: string;
    name: string;
    icon: React.ElementType;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
    cta: string;
}

const PRICING_TIERS: PricingTier[] = [
    {
        id: 'starter',
        name: 'Starter',
        icon: Rocket,
        monthlyPrice: 32,
        yearlyPrice: 16,
        description: 'Perfect for small teams getting started',
        features: [
            'Up to 5 team members',
            'Board, Table & Kanban views',
            '10 GB storage',
            'Email support',
            'Basic dashboards',
            '5 automation rules',
        ],
        cta: 'Start Free Trial',
    },
    {
        id: 'professional',
        name: 'Professional',
        icon: Crown,
        monthlyPrice: 56,
        yearlyPrice: 25,
        description: 'For growing teams that need more power',
        features: [
            'Up to 25 team members',
            'All board views (Gantt, Timeline, Calendar)',
            '50 GB storage',
            'Priority support',
            'Mini Company: Sales & Inventory',
            'Advanced automation rules',
            'Time tracking',
            '24 column types',
        ],
        highlighted: true,
        badge: 'Most Popular',
        cta: 'Start Free Trial',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        icon: Buildings,
        monthlyPrice: 73,
        yearlyPrice: 35,
        description: 'Full power for large organizations',
        features: [
            'Unlimited team members',
            'Full Mini Company suite',
            '500 GB storage',
            'Dedicated support manager',
            'Custom integrations',
            'Advanced analytics & formulas',
            'White-label options',
            'API access',
            '50+ ready dashboards',
        ],
        cta: 'Contact Sales',
    },
];

const FeatureItem: React.FC<{ feature: string; highlighted?: boolean }> = ({ feature, highlighted }) => (
    <li className="flex items-start gap-3">
        <div className={`mt-0.5 p-1 rounded-full shrink-0 ${highlighted ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
            <Check size={12} weight="bold" className={highlighted ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'} />
        </div>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{feature}</span>
    </li>
);

interface PricingCardProps {
    tier: PricingTier;
    isYearly: boolean;
    onGetStarted: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ tier, isYearly, onGetStarted }) => {
    const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
    const Icon = tier.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`relative rounded-3xl p-8 ${tier.highlighted
                    ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl shadow-blue-500/25 scale-[1.02] z-10'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                }`}
        >
            {/* Badge */}
            {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-lg">
                        <Star size={14} weight="fill" />
                        {tier.badge}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${tier.highlighted ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}>
                    <Icon size={24} weight="duotone" className={tier.highlighted ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${tier.highlighted ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                    {tier.name}
                </h3>
                <p className={`text-sm ${tier.highlighted ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-500'}`}>
                    {tier.description}
                </p>
            </div>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${tier.highlighted ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                        {price}
                    </span>
                    <span className={`text-lg ${tier.highlighted ? 'text-blue-100' : 'text-zinc-500'}`}>SAR</span>
                    <span className={`text-sm ${tier.highlighted ? 'text-blue-200' : 'text-zinc-400'}`}>/month</span>
                </div>
                {isYearly && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-2 text-sm ${tier.highlighted ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`}
                    >
                        Save {Math.round((1 - tier.yearlyPrice / tier.monthlyPrice) * 100)}% with yearly billing
                    </motion.div>
                )}
            </div>

            {/* CTA Button */}
            <button
                onClick={onGetStarted}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mb-8 ${tier.highlighted
                        ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                        : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100'
                    }`}
            >
                {tier.cta}
            </button>

            {/* Features */}
            <ul className="space-y-3">
                {tier.features.map((feature, idx) => (
                    <FeatureItem key={idx} feature={feature} highlighted={tier.highlighted} />
                ))}
            </ul>
        </motion.div>
    );
};

interface PricingSectionProps {
    onGetStarted?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
    const [isYearly, setIsYearly] = useState(false);

    const handleGetStarted = () => {
        if (onGetStarted) {
            onGetStarted();
        }
    };

    return (
        <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                        <Lightning size={16} weight="fill" />
                        Simple, Transparent Pricing
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        Choose Your Perfect Plan
                    </h2>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                        Start free for 14 days. No credit card required. Upgrade anytime as your team grows.
                    </p>
                </motion.div>

                {/* Billing Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-center gap-4 mb-16"
                >
                    <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setIsYearly(!isYearly)}
                        className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isYearly ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                    >
                        <motion.div
                            animate={{ x: isYearly ? 32 : 4 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
                        />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                        Yearly
                    </span>
                    <AnimatePresence>
                        {isYearly && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                            >
                                Save up to 55%
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {PRICING_TIERS.map((tier) => (
                        <PricingCard
                            key={tier.id}
                            tier={tier}
                            isYearly={isYearly}
                            onGetStarted={handleGetStarted}
                        />
                    ))}
                </div>

                {/* Bottom Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        All plans include a 14-day free trial. Need a custom solution?{' '}
                        <button onClick={handleGetStarted} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            Contact our sales team
                        </button>
                    </p>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 flex flex-wrap items-center justify-center gap-8"
                >
                    {[
                        { icon: Users, label: '10,000+ Users' },
                        { icon: Database, label: '99.9% Uptime' },
                        { icon: Headset, label: '24/7 Support' },
                        { icon: ChartLineUp, label: '50+ Dashboards' },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 text-zinc-400 dark:text-zinc-600">
                            <Icon size={20} />
                            <span className="text-sm font-medium">{label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
