import { 
  IChatDocument,
  IDocumentMetadata,
  IInboxSection,
  IChatHistory,
  IWorkspaceSection,
  IMessage
} from './types/IChatDocument';

// 核心数据模型
export interface ChatDocument {
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

// 收件箱部分
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

// 对话历史部分
export interface ChatHistory {
  messages: Message[];
}

export interface Message {
  id: string;
  type: 'user' | 'system' | 'agent';
  content: string;
  timestamp: number;
  actions?: Action[];
  references?: Reference[];
}

export interface Action {
  type: 'get' | 'search' | 'fileRead' | 'think';
  params: Record<string, any>;
  result?: any;
}

export interface Reference {
  type: 'file' | 'link';
  path: string;
  excerpt?: string;
}

// 工作区部分
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

// 解析器类
export class ChatDocumentParser {
  private messageIdCounter: number = 0;

  private generateMessageId(): string {
    this.messageIdCounter += 1;
    return `msg-${Date.now()}-${this.messageIdCounter}`;
  }

  async parse(content: string): Promise<IChatDocument> {
    const sections = this.splitSections(content);
    
    return {
      id: Date.now().toString(), // 添加id字段
      metadata: this.parseMetadata(sections.frontmatter),
      inbox: this.parseInbox(sections.inbox),
      chatHistory: this.parseChatHistory(sections.chat),
      workspace: this.parseWorkspace(sections.workspace)
    };
  }

  private splitSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    // 提取frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    sections.frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    
    // 提取其他部分
    const parts = content.split('# ');
    parts.forEach(part => {
      if (part.startsWith('Inbox\n')) {
        sections.inbox = part.slice(4);
      } else if (part.startsWith('Chat History\n')) {
        sections.chat = part.slice(5);
      } else if (part.startsWith('WorkSpace\n')) {
        sections.workspace = part.slice(4);
      }
    });
    
    return sections;
  }

  private parseMetadata(content: string): DocumentMetadata {
    const metadata: DocumentMetadata = {
      title: 'New Chat',
      type: 'chat',
      timestamp: Date.now()
    };

    const lines = content.split('\n');
    lines.forEach(line => {
      const [key, value] = line.split(': ').map(s => s.trim());
      if (key === 'title') metadata.title = value;
      if (key === 'type') metadata.type = value as 'chat' | 'flow';
      if (key === 'timestamp') metadata.timestamp = parseInt(value);
      if (key === 'tags') metadata.tags = value.split(',').map(t => t.trim());
    });

    return metadata;
  }

  private parseInbox(content: string): InboxSection {
    const cards: Card[] = [];
    if (!content) {
      return { cards };
    }
    
    const cardBlocks = content.split('\n\n').filter(Boolean);

    cardBlocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length > 0) {
        const card: Card = {
          id: Date.now().toString(),
          type: 'text',
          content: lines[0]
        };
        cards.push(card);
      }
    });

    return { cards };
  }

  private parseChatHistory(content: string): ChatHistory {
    const messages: Message[] = [];
    const messageBlocks = content.split('\n\n').filter(Boolean);

    messageBlocks.forEach(block => {
      const lines = block.split('\n');
      const idMatch = lines[0].match(/\[id:(.*?)\]/);
      
      const message: Message = {
        id: idMatch ? idMatch[1] : this.generateMessageId(),
        type: lines[0].includes('用户:') ? 'user' : 'agent',
        content: lines.slice(1).join('\n'),
        timestamp: Date.now()
      };
      messages.push(message);
    });

    return { messages };
  }

  private parseWorkspace(content: string): WorkspaceSection {
    const references: WorkspaceReference[] = [];
    
    // 添加空值检查
    if (!content) {
      return { references };
    }

    try {
      const refBlocks = content.split('\n\n').filter(Boolean);

      refBlocks.forEach(block => {
        const lines = block.split('\n').filter(Boolean);
        if (lines.length > 0) {
          const reference: WorkspaceReference = {
            type: 'file',
            path: lines[0],
            metadata: {
              lastAccessed: Date.now(),
              excerpts: lines.slice(1)
            }
          };
          references.push(reference);
        }
      });
    } catch (error) {
      console.error('Error parsing workspace:', error);
    }

    return { references };
  }
}

// 序列化器类
export class ChatDocumentSerializer {
  serialize(document: IChatDocument): string {
    const parts: string[] = [];

    // 添加frontmatter
    parts.push('---');
    parts.push(`title: ${document.metadata.title}`);
    parts.push(`type: ${document.metadata.type}`);
    parts.push(`timestamp: ${document.metadata.timestamp}`);
    if (document.metadata.tags) {
      parts.push(`tags: ${document.metadata.tags.join(', ')}`);
    }
    parts.push('---\n');

    // 序列化收件箱
    parts.push('## Inbox');
    document.inbox.cards.forEach(card => {
      parts.push(card.content);
      if (card.metadata?.preview) {
        parts.push(`标题: ${card.metadata.preview.title}`);
        parts.push(`描述: ${card.metadata.preview.description}`);
      }
      parts.push('');
    });

    // 序列化对话历史
    parts.push('# 对话历史');
    document.chatHistory.messages.forEach(message => {
      parts.push(`${message.type === 'user' ? '用户:' : 'AI:'} [id:${message.id}]`);
      parts.push(message.content);
      if (message.references) {
        message.references.forEach(ref => {
          parts.push(`引用: ${ref.path}`);
          if (ref.excerpt) parts.push(ref.excerpt);
        });
      }
      parts.push('');
    });

    // 序列化工作区
    parts.push('## WorkSpace');
    document.workspace.references.forEach(ref => {
      parts.push(ref.path);
      if (ref.metadata?.excerpts) {
        ref.metadata.excerpts.forEach(excerpt => parts.push(excerpt));
      }
      parts.push('');
    });

    return parts.join('\n');
  }
}
