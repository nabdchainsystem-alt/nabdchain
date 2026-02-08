import React from 'react';

export const ProcessSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16">
          {/* Feature 1 */}
          <div className="flex-1 text-center md:text-left">
            <span className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-4 block">Intelligence</span>
            <h3 className="text-3xl font-bold mb-4 tracking-tight">
              Advanced Neural <br /> Network Integration
            </h3>
            <p className="text-zinc-400 mb-10 max-w-sm mx-auto md:mx-0">
              Leverage the power of our proprietary L-4 Neural Engine for predictive analytics and automated decision
              making.
            </p>
            <a
              href="#"
              className="text-sm font-medium hover:text-white text-zinc-500 flex items-center justify-center md:justify-start gap-1 mb-10"
            >
              View Models <span className="text-xs">→</span>
            </a>

            <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden max-w-sm mx-auto md:mx-0">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-[#0A0A0A] flex items-center justify-center hover:bg-[#111] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full border border-white/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/50 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex-1 text-center md:text-left">
            <span className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-4 block">Operations</span>
            <h3 className="text-3xl font-bold mb-4 tracking-tight">
              Real-time Data <br /> Command Center
            </h3>
            <p className="text-zinc-400 mb-10 max-w-sm mx-auto md:mx-0">
              Monitor your entire centralized supply chain and urgent tasks with millisecond-latency updates across all
              nodes.
            </p>
            <a
              href="#"
              className="text-sm font-medium hover:text-white text-zinc-500 flex items-center justify-center md:justify-start gap-1 mb-10"
            >
              View Dashboard <span className="text-xs">→</span>
            </a>

            <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden max-w-sm mx-auto md:mx-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-[#0A0A0A] flex items-center justify-center hover:bg-[#111] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-md rotate-45 border border-white/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/50 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
