// src/app/models/chat-message.model.ts
export interface ChatMessage {
  id: number;
  senderId: string;
  content: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
}

export interface Conversation {
  userId: string;
  username: string;
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount: number;
}
