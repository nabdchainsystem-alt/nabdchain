import React from 'react';


export const MarketplaceSection: React.FC = () => {
    const items = [
        {
            quote: "The Neural Network module reduced our processing time by 40% immediately upon integration.",
            author: "System Core",
            role: "Module v2.4"
        },
        {
            quote: "Marketplace resources allowed us to scale our supply chain operations globally without friction.",
            author: "Logistics",
            role: "Unit 42A"
        },
        {
            quote: "The Dashboard provides a unified view of all active procurement contracts and negotiations.",
            author: "Finance",
            role: "Department Head"
        },
        {
            quote: "Automated issue tracking and resolution has streamlined our entire development pipeline.",
            author: "DevOps",
            role: "Team Lead"
        },
        {
            quote: "Real-time communication tools have improved inter-departmental collaboration significantly.",
            author: "HR",
            role: "Operations"
        },
        {
            quote: "The complete ecosystem we needed to modernize our legacy infrastructure.",
            author: "CTO Office",
            role: "Strategic Planning",
            bg: "bg-[#2563EB]",
            text: "text-white"
        }
    ];

    return (
        <section className="py-32 bg-[#FAFAFA] dark:bg-monday-dark-bg">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <p className="text-blue-600 font-medium mb-4">Global Marketplace</p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-monday-dark-text">
                        Accelerating innovation across <br /> every department
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((t, i) => (
                        <div key={i} className={`p-8 rounded-2xl flex flex-col justify-between h-full ${t.bg ? t.bg : 'bg-white dark:bg-monday-dark-surface shadow-[0_2px_10px_rgba(0,0,0,0.04)]'} border ${t.bg ? 'border-transparent' : 'border-zinc-100 dark:border-monday-dark-border'}`}>
                            <p className={`text-lg mb-8 leading-relaxed ${t.text ? t.text : 'text-zinc-700 dark:text-monday-dark-text-secondary'}`}>
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${t.bg ? 'bg-white/20' : 'bg-zinc-100 dark:bg-monday-dark-hover'} flex items-center justify-center font-bold ${t.bg ? 'text-white' : 'text-zinc-500 dark:text-monday-dark-text-secondary'}`}>
                                    {t.author[0]}
                                </div>
                                <div className="text-sm">
                                    <div className={`font-bold ${t.text ? t.text : 'text-zinc-900 dark:text-monday-dark-text'}`}>{t.author}</div>
                                    <div className={`${t.text ? 'text-white/80' : 'text-zinc-500 dark:text-monday-dark-text-secondary'}`}>{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
