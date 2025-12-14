import { Message } from "../src/features/discussion/types";

// Re-defining types here to avoid complex imports if types are not shared easily
export interface Chat {
  sendMessageStream: (params: { message: string }) => AsyncGenerator<{ text: string }, void, unknown>;
}

export interface GenerateContentResponse {
  text: () => string;
}

export const createChatSession = (): Chat => {
  return {
    sendMessageStream: async function* ({ message }) {
      const response = `Echo: ${message} (Mock AI)`;
      yield { text: response };
    }
  };
};

export const sendMessageStream = (
  chat: Chat,
  message: string,
  history: any[]
): AsyncGenerator<{ text: string }, void, unknown> => {
  return chat.sendMessageStream({ message });
};

export const generateBoardFromPrompt = async (prompt: string): Promise<any> => {
  // Mock implementation to fix build error
  console.log("Generating board from prompt:", prompt);
  return {
    name: "Generated Board",
    description: `Board generated from: ${prompt}`,
    columns: [
      { id: 'c1', title: 'Owner', type: 'person' },
      { id: 'c2', title: 'Status', type: 'status' },
      { id: 'c3', title: 'Date', type: 'date' }
    ],
    tasks: []
  };
};