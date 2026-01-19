import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quotes } from 'phosphor-react';

interface Testimonial {
    quote: string;
    author: string;
    role: string;
    company: string;
    rating: number;
    avatar: string;
    featured?: boolean;
}

const testimonials: Testimonial[] = [
    {
        quote: "NABD transformed how we manage our entire supply chain. The real-time analytics alone saved us countless hours of manual reporting.",
        author: "Sarah Chen",
        role: "VP of Operations",
        company: "TechFlow Inc.",
        rating: 5,
        avatar: "SC",
        featured: true
    },
    {
        quote: "The dashboard customization is incredible. Every team member can see exactly what matters to them.",
        author: "Marcus Rodriguez",
        role: "Project Manager",
        company: "BuildRight Co.",
        rating: 5,
        avatar: "MR"
    },
    {
        quote: "We've reduced project delivery time by 40% since switching to NABD. The team collaboration features are a game-changer.",
        author: "Emily Watson",
        role: "CTO",
        company: "InnovateLab",
        rating: 5,
        avatar: "EW"
    },
    {
        quote: "Finally, a platform that understands what modern businesses need. The procurement module alone is worth the investment.",
        author: "David Park",
        role: "Finance Director",
        company: "Global Solutions",
        rating: 5,
        avatar: "DP"
    },
    {
        quote: "Our team productivity increased significantly. NABD's intuitive interface means minimal training time.",
        author: "Lisa Thompson",
        role: "HR Manager",
        company: "PeopleFirst",
        rating: 5,
        avatar: "LT"
    },
    {
        quote: "The best decision we made this year. NABD brings all our business operations under one roof.",
        author: "James Miller",
        role: "CEO",
        company: "Nexus Corp",
        rating: 5,
        avatar: "JM"
    }
];

const TestimonialCard: React.FC<{ testimonial: Testimonial; delay: number }> = ({ testimonial, delay }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay }}
            className={`group relative ${testimonial.featured ? 'md:col-span-2 md:row-span-2' : ''}`}
        >
            <div className={`h-full p-8 rounded-2xl transition-all duration-300
                ${testimonial.featured
                    ? 'bg-black text-white'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-[#06C167]/30 dark:hover:border-[#06C167]/30 hover:shadow-xl'
                }`}
            >
                {/* Quote Icon */}
                <div className={`mb-6 ${testimonial.featured ? 'opacity-20' : 'opacity-10'}`}>
                    <Quotes size={48} weight="fill" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                            key={i}
                            size={18}
                            weight="fill"
                            className={testimonial.featured ? 'text-[#06C167]' : 'text-[#06C167]'}
                        />
                    ))}
                </div>

                {/* Quote */}
                <p className={`mb-8 leading-relaxed ${testimonial.featured
                    ? 'text-xl md:text-2xl text-white/90'
                    : 'text-lg text-zinc-700 dark:text-zinc-300'
                    }`}>
                    "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                        ${testimonial.featured
                            ? 'bg-[#06C167] text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}>
                        {testimonial.avatar}
                    </div>
                    <div>
                        <div className={`font-semibold ${testimonial.featured ? 'text-white' : 'text-black dark:text-white'}`}>
                            {testimonial.author}
                        </div>
                        <div className={`text-sm ${testimonial.featured ? 'text-white/60' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            {testimonial.role}, {testimonial.company}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const TestimonialsSection: React.FC = () => {
    const headerRef = useRef(null);
    const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

    return (
        <section className="py-32 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#06C167]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#06C167]/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-[#06C167]/10 text-[#06C167] text-sm font-semibold mb-6">
                        Testimonials
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white tracking-tight mb-6">
                        Loved by teams
                        <br />
                        <span className="text-[#06C167]">
                            worldwide
                        </span>
                    </h2>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        See what our customers have to say about transforming their
                        business operations with NABD.
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard
                            key={testimonial.author}
                            testimonial={testimonial}
                            delay={index * 0.1}
                        />
                    ))}
                </div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isHeaderInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mt-20 text-center"
                >
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                        Trusted by innovative companies worldwide
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
                        {['TechFlow', 'BuildRight', 'InnovateLab', 'GlobalSol', 'Nexus'].map((company) => (
                            <div key={company} className="text-xl font-bold text-zinc-500 dark:text-zinc-500">
                                {company}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
