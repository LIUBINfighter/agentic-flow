export interface ChatDocument {
  id: string;
  metadata: DocumentMetadata;
  inbox: InboxSection;
  chatHistory: ChatHistory;
  workspace: WorkspaceSection;
}

export interface DocumentMetadata {
  title: string;
  type: 'chat' | 'flow';
  timestamp: number;
  tags?: string[];
}

export interface InboxSection {
  cards: Card[];
}

export interface Card {
  id: string;
  type: 'text' | 'url' | 'image';
  content: string;
  metadata?: {
    created: number;
    source?: string;
    preview?: URLPreview;
  };
}

export interface URLPreview {
  title: string;
  description: string;
  thumbnail?: string;
}

export interface ChatHistory {
  messages: Message[];
}

export interface Message {
  id: string;
  type: 'user' | 'system' | 'agent';
  content: string;
  timestamp: number;
  actions?: IAction[];
  references?: IReference[];
}

export interface IAction {
  type: 'get' | 'search' | 'fileRead' | 'think';
  params: Record<string, any>;
  result?: any;
}

export interface IReference {
  type: 'file' | 'link';
  path: string;
  excerpt?: string;
}

export interface WorkspaceSection {
  references: WorkspaceReference[];
}

export interface WorkspaceReference {
  type: 'file' | 'image' | 'pdf';
  path: string;
  metadata?: {
    lastAccessed: number;
    excerpts?: string[];
  };
}
