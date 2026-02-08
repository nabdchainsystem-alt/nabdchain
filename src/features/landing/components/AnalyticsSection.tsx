import React from 'react';

export const AnalyticsSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#FAFAFA] dark:bg-monday-dark-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-20 items-center">
          <div className="flex-1">
            <span className="text-blue-600 font-semibold text-sm mb-2 block uppercase tracking-wide">Ecosystem</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-monday-dark-text mb-6">
              Unified Analytics, <br />
              Processing in real-time
            </h2>
            <p className="text-zinc-600 dark:text-monday-dark-text-secondary text-lg mb-8 leading-relaxed">
              A complete suite of tools to manage your data, procurement, and collaboration. Integrate your entire
              workflow into one seamless dashboard.
            </p>
            <div className="space-y-4">
              {['Live Collaboration', 'Procurement', 'Warehouse'].map((feature, i) => (
                <div
                  key={feature}
                  className="border-l-2 border-zinc-200 dark:border-monday-dark-border pl-4 py-2 cursor-pointer hover:border-[#2563EB] transition-colors"
                >
                  <h4
                    className={`text-sm font-bold ${i === 0 ? 'text-[#2563EB]' : 'text-zinc-400 dark:text-monday-dark-text-secondary'}`}
                  >
                    {feature}
                  </h4>
                  {i === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-monday-dark-text-secondary mt-1">
                      Real-time multiplayer editing, task assignment, and live notifications...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-monday-dark-surface rounded-2xl shadow-xl border border-zinc-100 dark:border-monday-dark-border p-12 flex items-center justify-center min-h-[500px]">
            {/* Mock Dashboard Component */}
            <div className="w-full max-w-sm bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-zinc-500">Live View</span>
              </div>

              <div className="space-y-4">
                <div className="h-24 rounded-lg bg-zinc-800 border border-zinc-700 p-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10" />
                  <div className="h-2 w-1/3 bg-blue-500 rounded mb-2" />
                  <div className="h-2 w-2/3 bg-zinc-700 rounded" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 h-32 rounded-lg bg-zinc-800 border border-zinc-700 p-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 mb-2" />
                    <div className="h-2 w-1/2 bg-zinc-600 rounded" />
                  </div>
                  <div className="flex-1 h-32 rounded-lg bg-zinc-800 border border-zinc-700 p-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 mb-2" />
                    <div className="h-2 w-1/2 bg-zinc-600 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
