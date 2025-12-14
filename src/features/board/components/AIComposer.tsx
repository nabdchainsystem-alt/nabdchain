import React, { useState } from 'react';
import { Sparkles, Send, Loader2, LayoutDashboard, RefreshCcw } from 'lucide-react';
import { getGeminiModel } from '../../../services/gemini';
import { DashboardConfig } from './dashboard/DashboardHeader';
import { KPIConfig, ChartConfig } from './dashboard/DashboardHeader'; // Types

interface AIComposerProps {
    onClose: () => void;
    onGenerate: (config: DashboardConfig) => void;
}

export const AIComposer: React.FC<AIComposerProps> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const model = getGeminiModel("gemini-2.5-flash"); // Use the working model

            // System prompt to enforce JSON structure
            const systemPrompt = `
                You are a Dashboard Generator. 
                User input: "${prompt}".
                
                Generate a JSON configuration for a business dashboard.
                Return ONLY valid JSON. No markdown formatting.
                Structure:
                {
                    "kpis": [
                        { "id": "1", "label": "Metric Name", "value": "$123", "change": "+10%", "trend": "up" }
                    ],
                    "charts": [
                        { 
                            "id": "c1", 
                            "title": "Chart Title", 
                            "type": "bar",
                            "data": { 
                                "tooltip": {}, 
                                "xAxis": { "data": ["Mon", "Tue", "Wed"] }, 
                                "yAxis": {}, 
                                "series": [{ "name": "Sales", "type": "bar", "data": [10, 20, 30] }] 
                            } 
                        }
                    ]
                }
                Make data realistic and relevant to the user's request.
                Generate 3-4 KPIs and 1-2 Charts.
            `;

            const result = await model.generateContent(systemPrompt);
            const text = result.response.text();

            // Clean markdown code blocks if present
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const config = JSON.parse(jsonText);

            onGenerate(config);
            onClose(); // Close menu on success
        } catch (err: any) {
            console.error("AI Generation Failed:", err);
            setError("Failed to generate dashboard. Try a simpler prompt.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-white fill-white/20" size={18} />
                    <span className="font-semibold text-white tracking-wide text-sm">Dashboard Composer</span>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <LayoutDashboard size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                            Describe your dashboard
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                            e.g. "Sales overview for Q4", "HR recruitment stats", "Project tracking metrics"
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        className="w-full h-24 p-3 pr-10 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:border-indigo-500 resize-none transition-all placeholder:text-stone-400 text-stone-700 dark:text-stone-200"
                        placeholder="What KPIs do you need?"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                        autoFocus
                    />
                    <div className="absolute right-2 bottom-2 text-xs text-stone-400">
                        {prompt.length}/200
                    </div>
                </div>

                {error && (
                    <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="flex justify-center items-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loading ? 'Generating...' : 'Generate Dashboard'}
                </button>
            </div>
        </div>
    );
};
