import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { AgentFlowParser } from './parser/AgentFlowParser';
import { ChatContainer } from './components/ChatContainer';
import { Sidebar } from './components/Sidebar';

export const VIEW_TYPE_CHAT = 'agentic-flow-chat';

export class ChatView extends ItemView {
  private parser: AgentFlowParser;
  private chatContainer: ChatContainer;
  private sidebar: Sidebar;
  private currentFile: TFile | null = null;
  private data: any = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.parser = new AgentFlowParser();
    this.chatContainer = new ChatContainer();
    this.sidebar = new Sidebar();
  }

  getViewType(): string {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText(): string {
    return 'Agent Flow Chat';
  }

  // 添加状态管理方法
  getState(): ViewState {
    return {
      file: this.currentFile?.path
    };
  }

  // 添加状态更新方法
  async setState(state: ViewState, result: any) {
    if (state.file) {
      const file = this.app.vault.getAbstractFileByPath(state.file);
      if (file instanceof TFile) {
        this.currentFile = file;
        await this.refresh();
      }
    }
  }

  async onOpen() {
    await this.initializeView();
  }

  private async initializeView() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('agentic-flow-chat');

    const mainContainer = container.createDiv({
      cls: 'agentic-flow-container'
    });

    // 创建主聊天区域
    const chatArea = mainContainer.createDiv({
      cls: 'chat-area'
    });

    // 创建聊天头部
    const chatHeader = chatArea.createDiv({
      cls: 'chat-header'
    });
    chatHeader.createEl('h2', { text: 'Chat History' });

    // 创建消息列表区域
    const messagesContainer = chatArea.createDiv({
      cls: 'chat-messages'
    });

    // 创建输入区域
    this.createChatInputArea(chatArea);

    // 创建侧边栏
    this.createSidebar(mainContainer);

    // 注册文件监听
    this.registerEvent(
      this.app.vault.on('modify', this.handleFileChange.bind(this))
    );

    await this.refresh();
  }

  private createChatInputArea(container: HTMLElement) {
    const inputArea = container.createDiv({ cls: 'chat-input-area' });
    const textarea = inputArea.createEl('textarea', {
      cls: 'chat-input',
      attr: { 
        placeholder: '输入消息...',
        rows: '3'
      }
    });
    
    const buttonContainer = inputArea.createDiv({ cls: 'chat-input-buttons' });
    const sendButton = buttonContainer.createEl('button', {
      cls: 'chat-send-button',
      text: '发送'
    });

    this.setupChatInput(textarea, sendButton);
  }

  private createBasicStructure(container: HTMLElement) {
    // Inbox 区域
    const inboxSection = container.createDiv({ cls: 'inbox-section' });
    inboxSection.createEl('h2', { text: 'Inbox' });
    const inboxInput = inboxSection.createDiv({ cls: 'inbox-input-container' });
    inboxInput.createEl('input', {
      cls: 'inbox-input',
      attr: { type: 'text', placeholder: '添加新的 Inbox 项目...' }
    });
    inboxSection.createDiv({ cls: 'inbox-cards' });

    // Chat History 区域
    const chatSection = container.createDiv({ cls: 'chat-history' });
    chatSection.createEl('h2', { text: 'Chat History' });
    chatSection.createDiv({ cls: 'messages' });

    // Chat Input 区域
    const inputArea = container.createDiv({ cls: 'chat-input-area' });
    const textarea = inputArea.createEl('textarea', {
      cls: 'chat-input',
      attr: { placeholder: '输入消息...' }
    });
    const sendButton = inputArea.createEl('button', {
      cls: 'chat-send-button',
      text: '发送'
    });

    this.setupChatInput(textarea, sendButton);
  }

  private createSidebar(container: HTMLElement) {
    // 先创建主容器
    const sidebarContainer = container.createDiv();
    sidebarContainer.addClass('sidebar-container');

    // 创建并插入切换按钮
    const toggleButton = createDiv('sidebar-toggle');
    toggleButton.setText('>');
    sidebarContainer.appendChild(toggleButton);

    // 直接绑定事件处理
    toggleButton.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 切换侧边栏状态
        const isCurrentlyHidden = sidebarContainer.hasClass('hidden');
        if (isCurrentlyHidden) {
            sidebarContainer.removeClass('hidden');
            toggleButton.setText('>');
        } else {
            sidebarContainer.addClass('hidden');
            toggleButton.setText('<');
        }
        
        // 调试日志
        console.log('Sidebar toggle clicked', { isCurrentlyHidden });
    });

    // 创建其他内容
    const tabsContainer = sidebarContainer.createDiv('sidebar-tabs');
    const contentContainer = sidebarContainer.createDiv('sidebar-content');

    // 设置标签页
    this.setupSidebarTabs(tabsContainer, contentContainer);

    return sidebarContainer;
  }

  private setupSidebarTabs(tabsContainer: HTMLElement, contentContainer: HTMLElement) {
    // 创建标签页
    ['Inbox', 'Workspace'].forEach((tabName, index) => {
      const tab = tabsContainer.createDiv({
        cls: `sidebar-tab ${index === 0 ? 'active' : ''}`,
        text: tabName
      });

      tab.addEventListener('click', () => {
        // 更新标签页状态
        tabsContainer.findAll('.sidebar-tab').forEach(t => t.removeClass('active'));
        tab.addClass('active');

        // 更新内容
        this.updateSidebarContent(contentContainer, tabName.toLowerCase());
      });
    });
  }

  private setupChatInput(textarea: HTMLTextAreaElement, sendButton: HTMLButtonElement) {
    const handleSend = async () => {
      const content = textarea.value.trim();
      if (content) {
        await this.handleSendMessage(content);
        textarea.value = '';
      }
    };

    sendButton.addEventListener('click', handleSend);
    textarea.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await handleSend();
      }
    });
  }

  async onClose() {
    // 清理工作
  }

  private async handleFileChange(file: TFile) {
    if (file?.path === this.currentFile?.path) {
      await this.refresh();
    }
  }

  async setFile(file: TFile) {
    this.currentFile = file;
    await this.refresh();
  }

  private async refresh() {
    if (!this.currentFile) return;

    try {
      const content = await this.app.vault.read(this.currentFile);
      this.data = this.parser.parse(content);
      await this.updateView();
    } catch (error) {
      console.error('Failed to refresh view:', error);
    }
  }

  private async updateView() {
    if (!this.data?.chat?.sections) return;

    const sections = this.data.chat.sections;
    
    // 更新 Inbox 卡片
    this.updateInboxCards(sections.Inbox?.cards || []);
    
    // 更新聊天记录
    this.updateChatMessages(sections.ChatHistory?.messages || []);
    
    // 更新工作区引用
    this.updateWorkspaceRefs(sections.Workspace?.references || []);
  }

  private updateInboxCards(cards: any[]) {
    const cardsContainer = this.containerEl.querySelector('.inbox-cards');
    if (!cardsContainer) return;

    cardsContainer.empty();
    cards.forEach(card => {
      const cardEl = cardsContainer.createDiv({ cls: 'inbox-card' });
      cardEl.createDiv({ text: card.content });
    });
  }

  private updateChatMessages(messages: any[]) {
    const messagesContainer = this.containerEl.querySelector('.chat-messages');
    if (!messagesContainer) return;

    messagesContainer.empty();
    messages.forEach(msg => {
      const cardEl = messagesContainer.createDiv({ 
        cls: `chat-message-card ${msg.role}`
      });

      // 添加角色标签
      cardEl.createDiv({ 
        cls: 'message-role',
        text: msg.role.toUpperCase()
      });

      // 添加内容
      const contentEl = cardEl.createDiv({ cls: 'message-content' });
      
      // 处理系统消息的特殊格式
      if (msg.role === 'system' && msg.metadata?.actions) {
        msg.metadata.actions.forEach((action: string) => {
          contentEl.createDiv({
            cls: 'message-action',
            text: action
          });
        });
      }

      contentEl.createDiv({
        cls: 'message-text',
        text: msg.content
      });

      // 添加引用
      if (msg.metadata?.references?.length) {
        const refsEl = cardEl.createDiv({ cls: 'message-refs' });
        msg.metadata.references.forEach((ref: string) => {
          const refEl = refsEl.createEl('a', {
            cls: 'message-ref',
            text: `[[${ref}]]`
          });
          // 添加点击事件处理引用跳转
          refEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleReferenceClick(ref);
          });
        });
      }
    });

    // 滚动到底部
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private handleReferenceClick(ref: string) {
    // 处理文件引用点击
    const file = this.app.metadataCache.getFirstLinkpathDest(ref, '');
    if (file) {
      this.app.workspace.openLinkText(ref, '', true);
    }
  }

  private updateWorkspaceRefs(refs: string[]) {
    const refsContainer = this.containerEl.querySelector('.workspace-refs');
    if (!refsContainer) return;

    refsContainer.empty();
    refs.forEach(ref => {
      refsContainer.createDiv({
        cls: 'workspace-ref',
        text: `[[${ref}]]`
      });
    });
  }

  private async handleSendMessage(content: string) {
    if (!this.currentFile) return;

    // 1. 更新内存中的数据
    const userCard = await this.chatContainer.addUserMessage(content);

    // 2. 更新视图
    this.refreshChatMessages();

    // 3. 同步到文件
    await this.syncMessageToFile(userCard);
  }

  private async syncMessageToFile(card: any) {
    if (!this.currentFile) return;

    try {
      const content = await this.app.vault.read(this.currentFile);
      const updatedContent = this.insertMessage(content, card);
      await this.app.vault.modify(this.currentFile, updatedContent);
    } catch (error) {
      console.error('Failed to sync message:', error);
    }
  }

  private insertMessage(content: string, card: any): string {
    const sections = content.split(/^## /m);
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].startsWith('ChatHistory')) {
        const messageContent = `\n### ${card.type.charAt(0).toUpperCase() + card.type.slice(1)}\n\n${card.content}\n`;
        sections[i] = sections[i].trimEnd() + messageContent;
        break;
      }
    }
    return sections.join('## ');
  }

  private updateSidebarContent() {
    const contentContainer = this.containerEl.querySelector('.sidebar-content');
    if (!contentContainer) return;

    contentContainer.empty();
    const activeList = this.sidebar.getActiveList();

    // 渲染当前活动列表的内容
    activeList.getCards().forEach(card => {
      const cardEl = contentContainer.createDiv({
        cls: 'sidebar-card'
      });
      cardEl.setText(card.content);
    });
  }

  private renderInbox(container: HTMLElement, section: ChatSection) {
    const inboxEl = container.createDiv({ cls: 'inbox-section' });
    inboxEl.createEl('h2', { text: 'Inbox' });

    // 添加输入框容器
    const inputContainer = inboxEl.createDiv({ cls: 'inbox-input-container' });
    const input = inputContainer.createEl('input', {
      cls: 'inbox-input',
      attr: {
        type: 'text',
        placeholder: '添加新的 Inbox 项目...'
      }
    });

    // 添加输入处理
    input.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.isComposing) {
        const content = input.value.trim();
        if (content) {
          await this.addInboxItem(content);
          input.value = '';
        }
      }
    });

    const cardsEl = inboxEl.createDiv({ cls: 'inbox-cards' });
    section.cards?.forEach(card => this.renderCard(cardsEl, card));
  }

  // 添加新方法处理 Inbox 项目添加
  private async addInboxItem(content: string) {
    if (!this.currentFile) return;

    try {
      // 读取当前文件内容
      const fileContent = await this.app.vault.read(this.currentFile);

      // 构建新的卡片内容
      const newCard = `\n### Card ${Date.now()}\n\n${content}`;

      // 在 ## Inbox 部分添加新卡片
      const updatedContent = this.insertIntoInboxSection(fileContent, newCard);

      // 保存文件
      await this.app.vault.modify(this.currentFile, updatedContent);

      // 视图会通过文件变化事件自动更新
    } catch (error) {
      console.error('Failed to add inbox item:', error);
    }
  }

  // 添加新方法在正确的位置插入内容
  private insertIntoInboxSection(content: string, newCard: string): string {
    const sections = content.split(/^## /m);

    for (let i = 0; i < sections.length; i++) {
      if (sections[i].startsWith('Inbox')) {
        // 在 Inbox 部分末尾添加新卡片
        sections[i] = sections[i].trimEnd() + newCard + '\n';
        break;
      }
    }

    return sections.join('## ');
  }

  private renderCard(container: HTMLElement, card: InboxCard) {
    const cardEl = container.createDiv({ cls: `inbox-card card-${card.type}` });
    cardEl.createDiv({ text: card.content, cls: 'card-content' });
  }

  private renderChatHistory(container: HTMLElement, section: ChatSection) {
    const chatEl = container.createDiv({ cls: 'chat-history' });
    chatEl.createEl('h2', { text: 'Chat History' });

    const messagesEl = chatEl.createDiv({ cls: 'messages' });
    section.messages?.forEach(msg => this.renderMessage(messagesEl, msg));
  }

  private renderMessage(container: HTMLElement, message: ChatMessage) {
    const msgEl = container.createDiv({ cls: `message message-${message.role}` });

    // 角色标签
    msgEl.createEl('div', { text: message.role.toUpperCase(), cls: 'message-role' });

    // 内容
    const contentEl = msgEl.createDiv({ cls: 'message-content' });

    // 处理操作指令
    message.metadata?.actions?.forEach(action => {
      contentEl.createEl('div', {
        text: action,
        cls: 'message-action'
      });
    });

    // 处理普通内容
    contentEl.createDiv({
      text: message.content,
      cls: 'message-text'
    });

    // 处理引用
    if (message.metadata?.references?.length) {
      const refsEl = msgEl.createDiv({ cls: 'message-refs' });
      message.metadata.references.forEach(ref => {
        refsEl.createEl('span', {
          text: `[[${ref}]]`,
          cls: 'message-ref'
        });
      });
    }
  }

  private renderWorkspace(container: HTMLElement, section: ChatSection) {
    const workspaceEl = container.createDiv({ cls: 'workspace-section' });
    workspaceEl.createEl('h2', { text: 'Workspace' });

    const refsEl = workspaceEl.createDiv({ cls: 'workspace-refs' });
    section.references?.forEach(ref => {
      refsEl.createEl('div', {
        text: `[[${ref}]]`,
        cls: 'workspace-ref'
      });
    });
  }

  private setupSidebar(
    sidebarContainer: HTMLElement, 
    toggleButton: HTMLElement,
    tabsContainer: HTMLElement,
    contentContainer: HTMLElement
  ) {
    // 绑定折叠按钮点击事件
    toggleButton.addEventListener('click', () => {
      sidebarContainer.toggleClass('hidden');
      toggleButton.setText(sidebarContainer.hasClass('hidden') ? '<' : '>');
    });

    // 创建并绑定标签页
    ['Inbox', 'Workspace'].forEach(tabName => {
      const tab = tabsContainer.createDiv({
        cls: 'sidebar-tab',
        text: tabName
      });

      tab.addEventListener('click', () => {
        // 移除其他标签页的激活状态
        tabsContainer.findAll('.sidebar-tab').forEach(t => 
          t.removeClass('active')
        );
        
        // 激活当前标签页
        tab.addClass('active');
        
        // 更新内容区域
        this.updateSidebarContent(contentContainer, tabName.toLowerCase());
      });
    });

    // 默认激活第一个标签页
    tabsContainer.firstChild?.addClass('active');
    this.updateSidebarContent(contentContainer, 'inbox');
  }

  private updateSidebarContent(container: HTMLElement, tab: string) {
    container.empty();
    
    if (tab === 'inbox') {
      // 渲染 Inbox 内容
      const inboxSection = this.data?.chat?.sections?.Inbox;
      if (inboxSection) {
        this.renderInboxContent(container, inboxSection);
      }
    } else {
      // 渲染 Workspace 内容
      const workspaceSection = this.data?.chat?.sections?.Workspace;
      if (workspaceSection) {
        this.renderWorkspaceContent(container, workspaceSection);
      }
    }
  }

  private renderInboxContent(container: HTMLElement, section: any) {
    // 创建输入框
    const inputContainer = container.createDiv({ cls: 'inbox-input-container' });
    const input = inputContainer.createEl('input', {
      cls: 'inbox-input',
      attr: { 
        type: 'text',
        placeholder: '添加新的 Inbox 项目...'
      }
    });

    // 创建卡片容器
    const cardsContainer = container.createDiv({ cls: 'inbox-cards' });
    
    // 渲染现有卡片
    section.cards?.forEach((card: any) => {
      const cardEl = cardsContainer.createDiv({ cls: 'inbox-card' });
      cardEl.createDiv({ text: card.content });
    });

    // 绑定输入事件
    input.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.isComposing) {
        const content = input.value.trim();
        if (content) {
          await this.addInboxItem(content);
          input.value = '';
        }
      }
    });
  }

  private renderWorkspaceContent(container: HTMLElement, section: any) {
    section.references?.forEach((ref: string) => {
      container.createDiv({
        cls: 'workspace-ref',
        text: `[[${ref}]]`
      });
    });
  }
}
