export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface LocalStorageChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string; // ISO string format for localStorage
}
