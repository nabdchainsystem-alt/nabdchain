import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing VITE_GEMINI_API_KEY in environment variables. Gemini AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "mock-key");

export const getGeminiModel = (modelName: string = "gemini-2.5-flash") => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing provided. Please set VITE_GEMINI_API_KEY in your .env file.");
    }
    return genAI.getGenerativeModel({ model: modelName });
};

export const listRemoteModels = async () => {
    if (!API_KEY) return [];
    // The SDK doesn't expose listModels on the instance directly in all versions, 
    // but we can try to access the model manager if available, or just rely on a simple check.
    // Actually, for the web SDK, listing models requires a direct fetch if not exposed.
    // Newer SDKs might support it. Let's try basic validation.
    // Since we can't easily list models in the browser-side SDK without extra permissions/setup sometimes,
    // let's just make a simple test call to a known 'safe' model.
    return [];
};
