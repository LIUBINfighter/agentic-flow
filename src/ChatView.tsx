import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ChatDocumentParser, ChatDocumentSerializer } from './prasar';
import { IChatDocument, IMessage } from './types/IChatDocument';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DraggableMessage } from './components/DraggableMessage';

export const VIEW_TYPE_CHAT = 'chat-view';

interface ChatViewProps {
  document: IChatDocument;
  onUpdate: (doc: IChatDocument) => void;
}

const ChatViewComponent: React.FC<ChatViewProps> = ({ document, onUpdate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [draggedMessage, setDraggedMessage] = React.useState<IMessage | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dropTarget, setDropTarget] = React.useState<'workspace' | null>(null);

  const renderInbox = () => (
    <div className="chat-inbox">
      {document.inbox.cards.map(card => (
        <div key={card.id} className="chat-card">
          <div className="card-content">{card.content}</div>
          {card.metadata?.preview && (
            <div className="card-preview">
              <h3>{card.metadata.preview.title}</h3>
              <p>{card.metadata.preview.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // 移除重复的renderChat函数，使用return部分的实现

  const renderWorkspace = () => (
    <div className="chat-workspace">
      {document.workspace.references.map((ref, idx) => (
        <div key={idx} className={`workspace-item ${ref.type}`}>
          <span className="item-type">{ref.type}</span>
          <span className="item-path">{ref.path}</span>
          {ref.metadata?.excerpts && (
            <div className="item-excerpts">
              {ref.metadata.excerpts.map((excerpt, i) => (
                <p key={i} className="excerpt">{excerpt}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  
  const [inputMessage, setInputMessage] = React.useState('');

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 创建新消息
    const newMessage: IMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user', 
      content: inputMessage,
      timestamp: Date.now()
    };

    // 更新文档状态 - 修复这里的结构
    const updatedDocument: IChatDocument = {
      ...document,
      chatHistory: {
        ...document.chatHistory, // 保留原有的 chatHistory 属性
        messages: [...document.chatHistory.messages, newMessage]
      }
    };

    // 调用onUpdate触发文件保存
    await onUpdate(updatedDocument);
    
    // 清空输入框
    setInputMessage('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const messageData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // 创建新的工作区引用
      const newReference: WorkspaceReference = {
        type: 'file',
        path: `Message-${messageData.id}`,
        metadata: {
          lastAccessed: Date.now(),
          excerpts: [messageData.content]
        }
      };

      // 更新文档
      const updatedDocument = {
        ...document,
        workspace: {
          ...document.workspace,
          references: [...document.workspace.references, newReference]
        }
      };

      onUpdate(updatedDocument);
    } catch (error) {
      console.error('Failed to handle drop:', error);
    }
  };

  const handleMessageDragStart = (e: React.DragEvent, message: IMessage) => {
    setDraggedMessage(message);
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify(message));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleMessageDragEnd = () => {
    setIsDragging(false);
    setDraggedMessage(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropTarget('workspace');
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleMessageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedMessage) return;

    try {
      const messageData = draggedMessage;
      
      // 创建新的工作区引用
      const newReference: WorkspaceReference = {
        type: 'file',
        path: `Message-${messageData.id}`,
        metadata: {
          lastAccessed: Date.now(),
          excerpts: [messageData.content]
        }
      };

      // 更新文档
      const updatedDocument = {
        ...document,
        workspace: {
          ...document.workspace,
          references: [...document.workspace.references, newReference]
        }
      };

      onUpdate(updatedDocument);
    } finally {
      handleMessageDragEnd();
    }
  };

  return (
    <div className="chat-view">
      <div className={`chat-main ${isSidebarOpen ? 'sidebar-open' : ''} ${isDragging ? 'dragging' : ''}`}>
        <div className="chat-history">
          {document.chatHistory.messages.map(message => (
            <DraggableMessage 
              key={message.id} 
              message={message}
              onDragStart={handleMessageDragStart}
              onDragEnd={handleMessageDragEnd}
              isDragging={isDragging && draggedMessage?.id === message.id}
            />
          ))}
        </div>
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="输入消息..."
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                await handleSendMessage();
              }
            }}
          />
          <button
            className="send-button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
          >
            发送
          </button>
        </div>
      </div>
      <div 
        className={`workspace-sidebar ${isSidebarOpen ? 'open' : ''} ${dropTarget === 'workspace' ? 'droppable' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleMessageDrop}
      >
        <button
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? '›' : '‹'}
        </button>
        <div className="workspace-content">
          {document.workspace.references.map((ref, idx) => (
            <div key={idx} className="workspace-item">
              <div className="item-content">{ref.metadata?.excerpts?.[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export class ChatView extends ItemView {
  private parser: ChatDocumentParser;
  private serializer: ChatDocumentSerializer;
  private document: IChatDocument | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.parser = new ChatDocumentParser();
    this.serializer = new ChatDocumentSerializer();
  }

  getViewType(): string {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText(): string {
    return this.document?.metadata.title || 'Chat View';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { cls: 'chat-view-container' });

    // 初始化空文档
    if (!this.document) {
      const welcomeMessage: IMessage = {
        id: `msg-${Date.now()}-welcome`,
        type: 'assistant',
        content: `你好!我是你的AI助手。我可以帮你完成各种任务,包括:
- 回答问题
- 分析文档
- 总结内容
- 提供建议
请告诉我你需要什么帮助?`,
        timestamp: Date.now()
      };

      this.document = {
        id: Date.now().toString(),
        metadata: {
          title: 'New Chat',
          type: 'chat',
          timestamp: Date.now()
        },
        inbox: { cards: [] },
        chatHistory: { 
          messages: [welcomeMessage] 
        },
        workspace: { references: [] }
      };
    }

    // 注册文件变更监听器
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file === this.app.workspace.getActiveFile()) {
          this.app.vault.read(file).then((content) => {
            this.loadDocument(content);
          });
        }
      })
    );

    this.render();
  }

  async onClose() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  private root: ReactDOM.Root | null = null;

  private render() {
    if (!this.document) return;

    const container = this.containerEl.querySelector('.chat-view-container');
    if (!container) return;

    if (!this.root) {
      this.root = ReactDOM.createRoot(container);
    }

    this.root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ChatViewComponent
            document={this.document}
            onUpdate={this.handleDocumentUpdate}
          />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }

  private handleDocumentUpdate = async (doc: IChatDocument) => {
    // 更新内存中的文档
    this.document = doc;
    
    // 获取当前活动文件
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      try {
        // 序列化文档内容
        const content = this.serializer.serialize(doc);
        // 写入文件
        await this.app.vault.modify(activeFile, content);
        // 重新渲染视图
        this.render();
      } catch (error) {
        console.error('Failed to save document:', error);
      }
    }
  };

  async loadDocument(content: string) {
    try {
      this.document = await this.parser.parse(content);
      this.render();
    } catch (error) {
      console.error('Error loading document:', error);
      // 初始化一个基础文档
      this.document = {
        id: Date.now().toString(),
        metadata: {
          title: 'New Chat',
          type: 'chat',
          timestamp: Date.now()
        },
        inbox: { cards: [] },
        chatHistory: { messages: [] },
        workspace: { references: [] }
      };
      this.render();
    }
  }
}
