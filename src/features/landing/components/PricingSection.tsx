import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';

export const PricingSection = () => {
    const [isYearly, setIsYearly] = useState(true);

    const plans = [
        {
            name: "Pro",
            price: isYearly ? "2,000" : "200",
            period: isYearly ? "SAR/yr" : "SAR/mo",
            description: "Essential tools for small teams.",
            features: ["Up to 5 Users", "Basic Analytics", "10GB Storage", "Community Support"],
            highlight: false
        },
        {
            name: "Pro+",
            price: isYearly ? "5,000" : "500",
            period: isYearly ? "SAR/yr" : "SAR/mo",
            description: "Perfect for growing businesses.",
            features: ["Up to 20 Users", "Advanced Analytics", "100GB Storage", "Priority Support", "API Access"],
            highlight: true,
            popular: true
        },
        {
            name: "Enterprise",
            price: "10,000",
            period: "SAR/yr",
            description: "For large-scale operations.",
            features: ["Unlimited Users", "Custom Solutions", "Unlimited Storage", "24/7 Dedicated Support", "SSO & Audit Logs"],
            highlight: false
        },
        {
            name: "Custom",
            price: "Custom",
            period: "Contact Us",
            description: "Tailored infrastructure.",
            features: ["Unlimited Everything", "Dedicated Infra", "White Labeling", "On-premise Option", "SLA Guarantee"],
            highlight: false
        }
    ];

    return (
        <section className="py-32 bg-[#050505] relative z-10 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-blue-300 mb-6"
                    >
                        <Sparkles className="w-3 h-3" />
                        <span>FLEXIBLE PLANS</span>
                    </motion.div>

                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">
                        Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Pricing</span>
                    </h2>

                    <div className="flex items-center justify-center gap-6">
                        <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-white' : 'text-gray-500'}`}>Monthly</span>

                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="w-16 h-8 bg-[#1A1A1A] rounded-full p-1 relative border border-white/10 cursor-pointer shadow-inner transition-colors hover:border-white/20"
                        >
                            <motion.div
                                className="w-6 h-6 bg-white rounded-full shadow-lg"
                                animate={{ x: isYearly ? 32 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>

                        <span className={`text-sm font-bold transition-colors ${isYearly ? 'text-white' : 'text-gray-500'}`}>
                            Yearly <span className="text-green-400 text-xs ml-1 font-normal bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">-20%</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, i) => (
                        <PricingCard key={i} plan={plan} index={i} isYearly={isYearly} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const PricingCard = ({ plan, index, isYearly }: { plan: any, index: number, isYearly: boolean }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`
                relative p-1 rounded-[2rem] h-full
                ${plan.highlight ? 'bg-gradient-to-b from-blue-500/50 to-purple-500/50' : 'bg-white/5 hover:bg-white/10 transition-colors'}
            `}
        >
            {/* Inner Card Content */}
            <div className={`
                relative h-full rounded-[1.9rem] p-8 flex flex-col
                ${plan.highlight ? 'bg-[#080808]' : 'bg-[#0A0A0A]'}
            `}>
                {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-xl border border-white/10">
                        Most Popular
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-500 h-10">{plan.description}</p>
                </div>

                <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-baseline gap-1">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={plan.price}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-3xl font-black text-white"
                            >
                                {plan.price}
                            </motion.span>
                        </AnimatePresence>
                        {plan.price !== "Custom" && (
                            <span className="text-xs text-gray-500">{plan.period.replace('SAR', '')}</span>
                        )}
                    </div>
                    {plan.price === "Custom" && <span className="text-xs text-gray-500 h-4 block">Let's talk</span>}
                </div>

                <button className={`
                    w-full py-4 rounded-xl font-bold text-sm mb-8 transition-all duration-300 transform active:scale-95
                    ${plan.highlight
                        ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30'
                    }
                `}>
                    Choose {plan.name}
                </button>

                <div className="flex-1 space-y-4">
                    {plan.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-gray-400 group">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white transition-colors'}`}>
                                <Check className="w-2.5 h-2.5" />
                            </div>
                            <span className="group-hover:text-gray-300 transition-colors">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
