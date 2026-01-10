import React from 'react';

export const StatsSection: React.FC = () => {
    // Ideally use real SVGs for these brands. Using text placeholders for now styled as logos.
    const companies = [
        { name: "inngest", font: "font-bold", tracking: "tracking-tight" },
        { name: "durable", font: "font-serif", tracking: "tracking-normal" },
        { name: "upstash", font: "font-mono", tracking: "tracking-tighter" },
        { name: "Careshub", font: "font-sans", tracking: "tracking-wide" },
        { name: "Hypermode", font: "font-bold", tracking: "-tracking-widest" }
    ];

    return (
        <section className="py-12 bg-[#FAFAFA] border-b border-zinc-200">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm font-medium text-zinc-500 mb-8">
                    Trusted by fast-growing companies around the world
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Mock Logos */}
                    {companies.map((c) => (
                        <div key={c.name} className={`text-xl md:text-2xl text-zinc-900 ${c.font} ${c.tracking}`}>
                            {c.name}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
