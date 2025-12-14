import React, { useState } from 'react';
import { Sparkles, Briefcase, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getGeminiModel } from '../../../services/gemini';

interface GeminiTestMenuProps {
    onClose: () => void;
}

export const GeminiTestMenu: React.FC<GeminiTestMenuProps> = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");

    const handleListModels = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            // Access key directly from env to verify it's loaded
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key is missing in env!");

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || response.statusText);
            }

            const modelNames = data.models?.map((m: any) => m.name.replace('models/', '')) || [];
            setResult("Available Models:\n" + modelNames.join(", "));
        } catch (err: any) {
            setError("List failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async (type: 'Personal' | 'Work') => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const model = getGeminiModel(selectedModel);
            const prompt = `I am creating a ${type} task board. Suggest 3 concise columns I should add. Format as a comma-separated list.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            setResult(text);
        } catch (err: any) {
            console.error("Gemini Error:", err);
            setError(err.message || "Failed to connect to Gemini.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center gap-2">
                <Sparkles className="text-white fill-white/20" size={18} />
                <span className="font-semibold text-white tracking-wide text-sm">Gemini AI Assistant</span>
            </div>

            <div className="p-4 flex flex-col gap-4">
                {!result && !error && (
                    <>
                        <div className="text-sm text-stone-600 dark:text-stone-300">
                            What is the purpose of this board?
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] uppercase font-bold text-stone-400">Select Model</label>
                            <button onClick={handleListModels} className="text-[10px] text-indigo-500 hover:underline">
                                Debug: List Available
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 mb-2">
                            <select
                                className="w-full text-xs p-2 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 outline-none focus:border-indigo-500"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Latest)</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleTest('Personal')}
                                disabled={loading}
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all hover:border-indigo-500/50 hover:shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <User size={16} />
                                </div>
                                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">Personal</span>
                            </button>

                            <button
                                onClick={() => handleTest('Work')}
                                disabled={loading}
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all hover:border-purple-500/50 hover:shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Briefcase size={16} />
                                </div>
                                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">Work</span>
                            </button>
                        </div>
                    </>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center py-4 gap-3 text-stone-500">
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                        <span className="text-xs">Consulting the oracle...</span>
                    </div>
                )}

                {result && (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <CheckCircle size={16} />
                            <span>API Connected!</span>
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                            Suggestion:
                        </div>
                        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded border border-stone-100 dark:border-stone-800 text-sm text-stone-700 dark:text-stone-300 italic">
                            "{result}"
                        </div>
                        <button
                            onClick={() => setResult(null)}
                            className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline self-end"
                        >
                            Try another
                        </button>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                            <AlertCircle size={16} />
                            <span>Connection Failed</span>
                        </div>

                        <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20 text-xs text-red-600 dark:text-red-300 break-words">
                            {error}
                        </div>

                        {error.includes('404') && (
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-100 dark:border-amber-900/20 text-xs text-amber-600 dark:text-amber-400">
                                <span className="font-bold">Diagnosis:</span> The API Key works, but the AI service is turned off.
                                <br />
                                <a href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" target="_blank" rel="noreferrer" className="underline font-bold">
                                    Click here to enable the Generative Language API
                                </a>
                            </div>
                        )}

                        <button
                            onClick={() => setError(null)}
                            className="mt-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 self-end"
                        >
                            Try again
                        </button>

                        <div className="mt-2 pt-2 border-t border-red-100 dark:border-red-900/20">
                            <p className="text-[10px] text-stone-500">
                                <b>Tip:</b> If you just added the .env file, you must <b>restart your dev server</b>.
                            </p>
                            <p className="text-[10px] text-stone-500 mt-1">
                                Ensure your API key has <b>Generative Language API</b> enabled in Google Cloud Console.
                            </p>
                            <p className="text-[10px] text-stone-500 mt-1">
                                Default Model: <code>gemini-1.5-flash</code>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
