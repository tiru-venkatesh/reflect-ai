export type ReflectionMode =
  | "reflection"
  | "brainstorming"
  | "summary"
  | "gratitude";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface Interaction {
  id: string;
  userId: string;
  title: string;
  type: ReflectionMode;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  summary?: string;
  keyTakeaways?: string[];
  tags?: string[];
  mood?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
