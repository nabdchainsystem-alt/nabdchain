
export type AnalysisResult = {
    type: 'empty' | 'quick_thought' | 'action' | 'brain_dump' | 'reflection' | 'question';
    suggestion: string;
    systemId: string;
    confidence: number;
};

const ACTION_VERBS = [
    'buy', 'call', 'email', 'contact', 'send', 'schedule', 'book', 'pay', 'order', 'write', 'draft',
    'review', 'check', 'verify', 'update', 'fix', 'finish', 'complete', 'prepare', 'create', 'make', 'build'
];

const REFLECTION_KEYWORDS = [
    'feel', 'feeling', 'why', 'confused', 'stuck', 'tired', 'overwhelmed', 'anxious', 'happy', 'sad', 'thinking', 'wondering'
];

export const analyzeInput = (text: string): AnalysisResult => {
    const trimmed = text.trim();

    // 1. Empty State
    if (!trimmed) {
        return { type: 'empty', suggestion: '', systemId: '', confidence: 0 };
    }

    const words = trimmed.split(/\s+/);
    const lowerText = trimmed.toLowerCase();

    // 2. Brain Dump (Long text, multiple lines, or > 15 words)
    if (text.includes('\n') || words.length > 15) {
        return {
            type: 'brain_dump',
            suggestion: 'This looks like a lot on your mind.',
            systemId: 'capture',
            confidence: 0.9
        };
    }

    // 3. Question
    if (trimmed.endsWith('?') || lowerText.startsWith('how') || lowerText.startsWith('what') || lowerText.startsWith('why')) {
        // If "why" is used in an emotional context, it might be reflection.
        if (REFLECTION_KEYWORDS.some(k => lowerText.includes(k))) {
            return {
                type: 'reflection',
                suggestion: 'This sounds like something to explore.',
                systemId: 'reflect',
                confidence: 0.8
            };
        }
        return {
            type: 'question',
            suggestion: 'This sounds like a question to resolve.',
            systemId: 'clarify', // Changed default to Clarify for questions
            confidence: 0.7
        };
    }

    // 4. Action Detection
    const hasVerb = ACTION_VERBS.some(v => lowerText.startsWith(v) || lowerText.includes(` ${v} `));
    // Check for time/date indicators (simple heuristic)
    const hasTime = ['today', 'tomorrow', 'next week', 'monday', 'tuesday', 'friday', 'at ', 'pm', 'am'].some(t => lowerText.includes(t));

    if (hasVerb || (hasTime && words.length > 2)) {
        return {
            type: 'action',
            suggestion: 'This looks like something actionable.',
            systemId: 'clarify',
            confidence: 0.85
        };
    }

    // 5. Reflection / Emotion
    if (REFLECTION_KEYWORDS.some(k => lowerText.includes(k))) {
        return {
            type: 'reflection',
            suggestion: 'This feels like a thought or feeling.',
            systemId: 'reflect',
            confidence: 0.8
        };
    }

    // 6. Default / Vague
    if (words.length < 4) {
        return {
            type: 'quick_thought',
            suggestion: 'Capture this quick thought?',
            systemId: 'capture',
            confidence: 0.6
        };
    }

    // Fallback
    return {
        type: 'empty', // Fallback to neutral if unsure, or maybe capture
        suggestion: 'What do you want to do with this?',
        systemId: 'organize',
        confidence: 0.5
    };
};

export const getSuggestionBasedOnTime = (): string => {
    const hour = new Date().getHours();
    if (hour < 11) return 'plan'; // Morning -> Plan
    if (hour < 18) return 'focus'; // Mid-day -> Focus
    return 'reflect'; // Evening -> Reflect
};

export const getPlaceholders = (systemId: string | null): string => {
    if (!systemId) {
        const timeSuggestion = getSuggestionBasedOnTime();
        if (timeSuggestion === 'plan') return "What is your main focus for today?";
        if (timeSuggestion === 'reflect') return "How did the day go?";
        return "What are you working on?";
    }
    switch (systemId) {
        case 'capture': return "Write freely. No structure needed.";
        case 'focus': return "What requires your deep attention?";
        case 'plan': return "What are you trying to plan?";
        case 'organize': return "What needs to be sorted?";
        case 'clarify': return "What is confusing you?";
        case 'reflect': return "How are you feeling about your progress?";
        case 'idea': return "What's the core concept?";
        case 'reset': return "What's blocking you right now?";
        default: return "Type a thought...";
    }
};
