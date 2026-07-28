export interface User {
    id: string;
    email: string;
    name: string | null;
  }
  
  export interface GroqModel {
    id: string;
    label: string;
  }
  
  export interface ImageModel {
    id: string;
    label: string;
  }
  
  export interface Attachment {
    name: string;
    size: number;
    mimetype: string;
    content?: string;
  }
  
  export interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
    model?: string;
    image_url?: string;
    created_at?: string;
  }
  
  export interface Conversation {
    id: string;
    title: string;
    model: string;
    created_at: string;
    updated_at: string;
    messages?: Message[];
  }
  
  export interface ChatRequest {
    conversationId?: string;
    model: string;
    messages: { role: string; content: string }[];
    useWeb: boolean;
    useEntData: boolean;
    attachments?: Attachment[];
  }
  