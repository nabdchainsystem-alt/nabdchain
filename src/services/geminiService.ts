import { GoogleGenerativeAI } from "@google/generative-ai";
import { appLogger } from '../utils/logger';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the API if the key exists
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
    timestamp: Date;
}

/**
 * Sends a message to the Gemini Pro model and returns the response stream.
 * @param message User message
 * @param history Previous chat history
 * @returns AsyncGenerator yielding chunks of text
 */
export async function* chatWithGemini(message: string, history: { role: string, parts: string }[]) {
    if (!genAI) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert history to Gemini format if needed (simple role/parts mapping)
    // The history param passed here is expected to be simple objects
    const chat = model.startChat({
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.parts }]
        })),
        generationConfig: {
            maxOutputTokens: 1000,
        },
    });

    const result = await chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
            yield chunkText;
        }
    }
}

/**
 * Simple single-shot response generation for the AI command bar.
 * @param prompt User prompt
 * @returns Generated response text
 */
export async function generateResponse(prompt: string): Promise<string> {
    if (!genAI) {
        return "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: "You are a helpful, concise, and futuristic AI assistant for NABD - a business management platform. Keep responses brief and elegant.",
        });
        return result.response.text() || "I processed that, but have no words.";
    } catch (error) {
        appLogger.error("Gemini API Error:", error);
        return "I encountered a disturbance in the data stream.";
    }
}

/**
 * Generates subtasks for a given task title using Gemini.
 * @param taskTitle The title of the main task
 * @returns Array of subtask strings
 */
export async function generateSubtasks(taskTitle: string): Promise<string[]> {
    if (!genAI) {
        appLogger.warn("Gemini API not configured, returning mock subtasks to avoid crash.");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Generate 3-5 concise, actionable subtasks for the task: "${taskTitle}". Return ONLY the subtasks as a JSON array of strings. Example: ["Research competitors", "Draft outline"]. Do not include markdown formatting like \`\`\`json.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean up potential markdown code blocks if the model ignores instruction
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        appLogger.error("Failed to generate subtasks:", error);
        return ["Failed to generate subtasks. Check API limits."];
    }
}
