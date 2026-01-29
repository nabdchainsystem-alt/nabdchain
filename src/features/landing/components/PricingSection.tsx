import React, { useState, useRef, memo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Crown, Lightning, Rocket, Star, Buildings, Users, Database, Headset, ChartLineUp } from 'phosphor-react';

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

const FeatureItem: React.FC<{ feature: string; highlighted?: boolean }> = memo(({ feature, highlighted }) => (
    <li className="flex items-start gap-2 sm:gap-3">
        <div className={`mt-0.5 p-0.5 sm:p-1 rounded-full shrink-0 ${highlighted ? 'bg-white/20' : 'bg-zinc-800'}`}>
            <Check size={10} weight="bold" className={highlighted ? 'text-white' : 'text-zinc-400'} />
        </div>
        <span className={`text-xs sm:text-sm ${highlighted ? 'text-zinc-300' : 'text-zinc-400'}`}>{feature}</span>
    </li>
));

interface PricingCardProps {
    tier: PricingTier;
    isYearly: boolean;
    onGetStarted: () => void;
    index: number;
}

// Pricing card with smooth hover animations
const PricingCard: React.FC<PricingCardProps> = memo(({ tier, isYearly, onGetStarted, index }) => {
    const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
    const Icon = tier.icon;

    return (
        <div
            className={`group relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 opacity-0 animate-fade-in-up
                transition-all duration-500 ease-out hover:-translate-y-2
                ${tier.highlighted
                ? 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white shadow-xl shadow-violet-500/20 sm:scale-[1.02] z-10 border border-zinc-600 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/30'
                : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/30'
                }`}
            style={{ animationDelay: `${0.1 + index * 0.1}s`, animationFillMode: 'forwards' }}
        >
            {/* Badge */}
            {tier.badge && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] sm:text-xs font-bold shadow-lg">
                        <Star size={12} weight="fill" />
                        {tier.badge}
                    </div>
                </div>
            )}

            <div className="mb-4 sm:mb-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 ${tier.highlighted ? 'bg-white/10' : 'bg-zinc-800'
                    }`}>
                    <Icon size={20} weight="duotone" className={tier.highlighted ? 'text-white' : 'text-zinc-400'} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 text-white">
                    {tier.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                    {tier.description}
                </p>
            </div>

            {/* Price */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                        {price}
                    </span>
                    <span className="text-base sm:text-lg text-zinc-500">SAR</span>
                    <span className="text-xs sm:text-sm text-zinc-500">/month</span>
                </div>
                {isYearly && (
                    <div className={`mt-1.5 sm:mt-2 text-xs sm:text-sm ${tier.highlighted ? 'text-emerald-300' : 'text-emerald-400'}`}>
                        Save {Math.round((1 - tier.yearlyPrice / tier.monthlyPrice) * 100)}% yearly
                    </div>
                )}
            </div>

            {/* CTA Button */}
            <button
                onClick={onGetStarted}
                className={`w-full py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-colors duration-200 mb-5 sm:mb-8 ${tier.highlighted
                    ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                    }`}
            >
                {tier.cta}
            </button>

            {/* Features */}
            <ul className="space-y-2 sm:space-y-3">
                {tier.features.map((feature, idx) => (
                    <FeatureItem key={idx} feature={feature} highlighted={tier.highlighted} />
                ))}
            </ul>
        </div>
    );
});

interface PricingSectionProps {
    onGetStarted?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
    const [isYearly, setIsYearly] = useState(false);
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

    const handleGetStarted = () => {
        if (onGetStarted) {
            onGetStarted();
        }
    };

    return (
        <section ref={sectionRef} id="pricing" className="py-20 sm:py-28 md:py-36 bg-black relative overflow-hidden">
            {/* Animated background decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'pricingOrb 12s ease-in-out infinite' }} />
            <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'pricingOrb 15s ease-in-out infinite', animationDelay: '-5s' }} />
            <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'pricingOrb 10s ease-in-out infinite', animationDelay: '-8s' }} />
            <style>{`
                @keyframes pricingOrb {
                    0%, 100% { opacity: 0.5; transform: translate(0, 0) scale(1) translateZ(0); }
                    33% { opacity: 0.8; transform: translate(30px, -20px) scale(1.1) translateZ(0); }
                    66% { opacity: 0.6; transform: translate(-20px, 30px) scale(0.95) translateZ(0); }
                }
            `}</style>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Header */}
                {isInView && (
                    <div className="text-center mb-12 sm:mb-16 opacity-0 animate-fade-in-up"
                         style={{ animationFillMode: 'forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-purple-400 text-sm font-medium mb-6 sm:mb-8">
                            <Lightning size={16} weight="fill" />
                            Simple, Transparent Pricing
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 tracking-tight leading-[1.1]">
                            Choose Your Perfect Plan
                        </h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                            Start free for 14 days. No credit card required. Upgrade anytime as your team grows.
                        </p>
                    </div>
                )}

                {/* Billing Toggle */}
                {isInView && (
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 opacity-0 animate-fade-in-up"
                         style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                        <span className={`text-xs sm:text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-zinc-500'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-14 sm:w-16 h-7 sm:h-8 rounded-full bg-zinc-800 transition-colors"
                        >
                            <motion.div
                                animate={{ x: isYearly ? 28 : 4 }}
                                transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
                                className="absolute top-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md"
                            />
                        </button>
                        <span className={`text-xs sm:text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-zinc-500'}`}>
                            Yearly
                        </span>
                        {isYearly && (
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-[10px] sm:text-xs font-bold">
                                Save up to 55%
                            </span>
                        )}
                    </div>
                )}

                {/* Pricing Cards */}
                {isInView && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
                        {PRICING_TIERS.map((tier, index) => (
                            <PricingCard
                                key={tier.id}
                                tier={tier}
                                isYearly={isYearly}
                                onGetStarted={handleGetStarted}
                                index={index}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom Note */}
                {isInView && (
                    <div className="mt-10 sm:mt-16 text-center opacity-0 animate-fade-in-up"
                         style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                        <p className="text-xs sm:text-sm text-zinc-400 mb-2">
                            All plans include a 14-day free trial. Need a custom solution?{' '}
                            <a href="mailto:info@nabdchain.com" className="text-white font-medium hover:underline">
                                Contact our sales team
                            </a>
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-600">
                            info@nabdchain.com
                        </p>
                    </div>
                )}

                {/* Trust Badges */}
                {isInView && (
                    <div className="mt-10 sm:mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-0 animate-fade-in-up"
                         style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        {[
                            { icon: Users, label: '10,000+ Users' },
                            { icon: Database, label: '99.9% Uptime' },
                            { icon: Headset, label: '24/7 Support' },
                            { icon: ChartLineUp, label: '50+ Dashboards' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5 sm:gap-2 text-zinc-500">
                                <Icon size={16} />
                                <span className="text-xs sm:text-sm font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
