import { GoogleGenerativeAI } from "@google/generative-ai";

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
 * Generates subtasks for a given task title using Gemini.
 * @param taskTitle The title of the main task
 * @returns Array of subtask strings
 */
export async function generateSubtasks(taskTitle: string): Promise<string[]> {
    if (!genAI) {
        console.warn("Gemini API not configured, returning mock subtasks to avoid crash.");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Generate 3-5 concise, actionable subtasks for the task: "${taskTitle}". Return ONLY the subtasks as a JSON array of strings. Example: ["Research competitors", "Draft outline"]. Do not include markdown formatting like \`\`\`json.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up potential markdown code blocks if the model ignores instruction
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Failed to generate subtasks:", error);
        return ["Failed to generate subtasks. Check API limits."];
    }
}
