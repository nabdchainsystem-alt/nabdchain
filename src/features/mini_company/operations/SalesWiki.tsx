import React from 'react';
import { Book, Target, TrendingUp, Users, Truck, Settings, DollarSign, ArrowRight } from 'lucide-react';

const SalesWiki: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-monday-dark-surface p-8">
            <div className="max-w-5xl mx-auto bg-white dark:bg-monday-dark-bg rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-screen">

                {/* Header */}
                <div className="border-b border-gray-100 dark:border-gray-700 p-8 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-[#1f2937]">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-600 text-white p-2 rounded-lg">
                            <Book size={24} />
                        </span>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">NABD Chain System: Sales Module Wiki</h1>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                        A comprehensive guide and technical specification for the NABD Sales Module, designed for small business owners in Saudi Arabia.
                    </p>
                    <div className="flex gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400">
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Version 1.0</span>
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">React + ECharts</span>
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Target: SME & Retail</span>
                    </div>
                </div>

                <div className="p-8 space-y-12">

                    {/* Introduction */}
                    <section>
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            <span>🧭 Introduction</span>
                        </h2>
                        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                            <p className="mb-4">
                                This document serves as both the <strong>User Guide (Wiki)</strong> and the <strong>Technical Specification</strong> for the Sales Module of the NABD Chain System.
                                Our goal is to provide small business owners in Saudi Arabia with actionable insights similar to enterprise ERPs but with the simplicity of modern SaaS tools.
                            </p>
                        </div>
                    </section>

                    {/* Dashboard 1 */}
                    <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                <Target className="text-blue-500" />
                                📊 Dashboard 1: The Executive Command
                            </h2>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">The Pulse of Your Business</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Goal & Benefit</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    The landing page for business owners answering: <em>"Did I make money today?"</em>
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                                    <li><strong>Strategic Value:</strong> Spot daily anomalies instantly.</li>
                                    <li><strong>For Who:</strong> Owners, General Managers.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Key Metrics (Row A)</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">1. Total Revenue (SAR)</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">2. Net Profit</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">3. Total Orders</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">4. Avg Basket Size</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Dashboard 2 */}
                    <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                <Settings className="text-purple-500" />
                                📦 Dashboard 2: Product & Inventory Intelligence
                            </h2>
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">The Stock Optimizer</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Goal & Benefit</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    Helps owners optimize their shelves by identifying "Dead Stock" vs "Best Sellers".
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                                    <li><strong>Strategic Value:</strong> Improves cash flow, prevents stockouts.</li>
                                    <li><strong>For Who:</strong> Procurement, Store Managers.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Key Metrics (Row A)</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">1. Top/Worst Selling SKU</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">2. Dead Stock Value</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">3. Inventory Turnover</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">4. GMROI</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Dashboard 3 */}
                    <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                <Users className="text-green-500" />
                                👥 Dashboard 3: Customer Insights & Loyalty
                            </h2>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">The Relationship Builder</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Goal & Benefit</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    Understanding who buys is key. Differentiates "One-time" vs "Loyal".
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                                    <li><strong>Strategic Value:</strong> Cheaper to retain than acquire.</li>
                                    <li><strong>For Who:</strong> Marketing, CRM Users.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Key Metrics (Row A)</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">1. Retention Rate %</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">2. Avg Lifetime Value</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">3. Churn Rate</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">4. CAC</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Dashboard 4 */}
                    <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                <TrendingUp className="text-orange-500" />
                                📈 Dashboard 4: Sales Forecasting & Trends
                            </h2>
                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">The Future Outlook</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Goal & Benefit</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    Moves business from "Reactive" to "Proactive". Predicts next month's demand.
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                                    <li><strong>Strategic Value:</strong> Better staff scheduling and cash flow planning.</li>
                                    <li><strong>For Who:</strong> Planners, Analysts.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Key Metrics (Row A)</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">1. Predicted Revenue</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">2. Growth Rate (MoM)</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">3. Cash Flow Forecast</div>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">4. Opportunity Loss</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Dashboard 5 - Regional */}
                    <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                <ArrowRight className="text-cyan-500" />
                                🌍 Dashboard 5: Regional & Branch Performance
                            </h2>
                            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1 rounded-full">The Expansion Manager</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Compares performance "Apples to Apples" across different branches.</p>
                    </section>

                    {/* Dashboard 6 - Operations */}
                    <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                <Truck className="text-indigo-500" />
                                ⚙️ Dashboard 6: Sales Operations
                            </h2>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">The Engine Room</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Focuses on the process: Open Orders, Late Orders, Processing Time.</p>
                    </section>


                    {/* Dashboard 7 - Profitability */}
                    <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                <DollarSign className="text-emerald-500" />
                                💰 Dashboard 7: Profitability & Finance
                            </h2>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">The Bottom Line</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Revenue is vanity, profit is sanity. Tracks COGS, Tax, Net Profit %.</p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default SalesWiki;
