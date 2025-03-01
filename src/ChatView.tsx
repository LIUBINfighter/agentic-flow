import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ChatDocument, ChatDocumentParser, ChatDocumentSerializer } from './prasar';

export const VIEW_TYPE_CHAT = 'chat-view';

interface ChatViewProps {
  document: ChatDocument;
  onUpdate: (doc: ChatDocument) => void;
}

const ChatViewComponent: React.FC<ChatViewProps> = ({ document, onUpdate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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

  const renderChat = () => (
    <div className="chat-history">
      {document.chatHistory.messages.map(message => (
        <div key={message.id} className={`chat-message ${message.type}`}>
          <div className="message-header">
            <span className="message-type">{message.type}</span>
            <span className="message-time">
              {new Date(message.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="message-content">{message.content}</div>
          {message.references && (
            <div className="message-references">
              {message.references.map((ref, idx) => (
                <div key={idx} className="reference">
                  <span className="reference-type">{ref.type}</span>
                  <span className="reference-path">{ref.path}</span>
                  {ref.excerpt && <p className="reference-excerpt">{ref.excerpt}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

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

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    const updatedDocument = {
      ...document,
      chatHistory: {
        ...document.chatHistory,
        messages: [...document.chatHistory.messages, newMessage]
      }
    };

    onUpdate(updatedDocument);
    setInputMessage('');
  };

  return (
    <div className="chat-view">
      <div className={`chat-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="chat-history">
          {document.chatHistory.messages.map(message => (
            <div key={message.id} className={`chat-message ${message.type}`}>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
        </div>
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="输入消息..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
          >
            发送
          </button>
        </div>
      </div>
      <div className={`workspace-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? '›' : '‹'}
        </button>
        <div className="workspace-content">
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
      </div>
    </div>
  );
};

export class ChatView extends ItemView {
  private parser: ChatDocumentParser;
  private serializer: ChatDocumentSerializer;
  private document: ChatDocument | null = null;

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
      this.document = {
        metadata: {
          title: 'New Chat',
          type: 'chat',
          timestamp: Date.now()
        },
        inbox: { cards: [] },
        chatHistory: { messages: [] },
        workspace: { references: [] }
      };
    }

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
        <ChatViewComponent
          document={this.document}
          onUpdate={this.handleDocumentUpdate}
        />
      </React.StrictMode>
    );
  }

  private handleDocumentUpdate = async (doc: ChatDocument) => {
    this.document = doc;
    // 将更新后的文档序列化并保存到文件
    const content = this.serializer.serialize(doc);
    await this.app.vault.modify(this.app.workspace.getActiveFile(), content);
  };

  async loadDocument(content: string) {
    this.document = await this.parser.parse(content);
    this.render();
  }
}
