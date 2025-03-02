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
    
    // 从插件设置获取 API key
    const apiKey = this.app.plugins.plugins['agentic-flow'].settings.apiKey;
    this.chatContainer = new ChatContainer(apiKey);
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
    console.log('Initializing view with data:', this.data);
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('agentic-flow-chat');

    try {
        const mainContainer = container.createDiv({
            cls: 'agentic-flow-container'
        });

        // 创建消息列表容器
        const chatArea = mainContainer.createDiv({
            cls: 'chat-area'
        });

        // 创建消息列表容器，确保它存在
        const messagesContainer = chatArea.createDiv({
            cls: 'chat-messages'
        });

        // 确保消息列表容器可被找到
        messagesContainer.id = 'chat-messages-container';

        this.createChatInputArea(chatArea);
        this.createSidebar(mainContainer);

        // 监听 ChatContainer 的变化
        this.chatContainer.on('change', (cards) => {
            console.log('ChatContainer change event:', cards);
            this.refreshChatMessages();
        });

        await this.refresh();
        
        // 记录初始化完成
        console.log('View initialization completed');

    } catch (error) {
        console.error('Error initializing view:', error);
    }
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
    if (!this.currentFile) {
        console.log('No current file to refresh');
        return;
    }

    try {
        const content = await this.app.vault.read(this.currentFile);
        console.log('File content loaded:', content.substring(0, 100) + '...');
        
        this.data = this.parser.parse(content);
        console.log('Parsed data:', this.data);
        
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

    if (this.data?.chat?.sections?.ChatHistory) {
      this.refreshChatMessages();
    }
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
    if (!this.currentFile) {
        console.warn('No current file selected');
        return;
    }

    try {
        console.log('Sending message:', content);
        const userCard = await this.chatContainer.addUserMessage(content);
        
        // 保存用户消息到文件
        await this.syncMessageToFile(userCard);

        // ChatContainer 会自动触发 AI 回复
        // AI 回复会通过 change 事件更新视图
    } catch (error) {
        console.error('Error handling send message:', error);
    }
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
    const msgEl = container.createDiv({ 
      cls: `message message-${message.role} draggable-card`,
      attr: {
        'draggable': 'true',
        'data-message-id': message.id
      }
    });

    // 添加拖拽事件监听
    msgEl.addEventListener('dragstart', (e) => this.handleDragStart(e, message));
    msgEl.addEventListener('dragend', this.handleDragEnd);
    msgEl.addEventListener('dragover', this.handleDragOver);
    msgEl.addEventListener('drop', (e) => this.handleDrop(e, message));

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

  private handleDragStart(e: DragEvent, message: ChatMessage) {
    if (!e.dataTransfer) return;
    
    e.dataTransfer.setData('text/plain', message.id);
    e.dataTransfer.effectAllowed = 'move';
    
    const target = e.target as HTMLElement;
    target.addClass('dragging');
    
    // 存储原始位置信息
    this.dragSource = {
      element: target,
      message: message
    };
  }

  private handleDragEnd(e: DragEvent) {
    const target = e.target as HTMLElement;
    target.removeClass('dragging');
    this.dragSource = null;
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.target as HTMLElement;
    const messageCard = target.closest('.draggable-card');
    
    if (messageCard && this.dragSource?.element !== messageCard) {
      const rect = messageCard.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      
      // 添加放置指示器
      messageCard.addClass(e.clientY < midY ? 'drop-above' : 'drop-below');
    }
  }

  private handleDrop(e: DragEvent, targetMessage: ChatMessage) {
    e.preventDefault();
    
    if (!this.dragSource) return;
    
    const sourceMessage = this.dragSource.message;
    const sourceIndex = this.findMessageIndex(sourceMessage);
    const targetIndex = this.findMessageIndex(targetMessage);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    // 更新消息顺序
    this.updateMessageOrder(sourceIndex, targetIndex);
    
    // 清理拖拽状态
    document.querySelectorAll('.drop-above, .drop-below').forEach(el => {
      el.removeClass('drop-above');
      el.removeClass('drop-below');
    });
  }

  private findMessageIndex(message: ChatMessage): number {
    return this.data.chat.sections.ChatHistory.messages.findIndex(
      (m: ChatMessage) => m.id === message.id
    );
  }

  private updateMessageOrder(sourceIndex: number, targetIndex: number) {
    const messages = this.data.chat.sections.ChatHistory.messages;
    const [movedMessage] = messages.splice(sourceIndex, 1);
    messages.splice(targetIndex, 0, movedMessage);
    
    // 更新状态并保存
    this.setState({
      ...this.data,
      chat: {
        ...this.data.chat,
        sections: {
          ...this.data.chat.sections,
          ChatHistory: {
            ...this.data.chat.sections.ChatHistory,
            messages
          }
        }
      }
    });
    
    this.saveChanges();
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

  private renderMessages(messages: ChatMessage[]) {
    const messagesContainer = this.containerEl.querySelector('.chat-messages');
    if (!messagesContainer) return;

    messagesContainer.empty();
    
    messages.forEach(msg => {
      const messageEl = this.createMessageElement(msg);
      messagesContainer.appendChild(messageEl);
    });

    // 滚动到最新消息
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    if (!message || !message.role) {
      console.warn('Invalid message object:', message);
      return createDiv({ cls: 'message message-error' });
    }

    const messageEl = createDiv({
      cls: `message message-${message.role}`
    });

    // 添加角色标签
    messageEl.createDiv({
      cls: 'message-role',
      text: message.role.toUpperCase()
    });

    // 添加内容容器
    const contentEl = messageEl.createDiv({
      cls: 'message-content'
    });

    // 处理系统消息的特殊格式
    if (message.role === 'system' && message.metadata?.actions) {
      message.metadata.actions.forEach(action => {
        contentEl.createDiv({
          cls: 'message-action',
          text: action
        });
      });
    }

    // 添加主要内容
    contentEl.createDiv({
      cls: 'message-text',
      text: message.content || ''
    });

    // 添加引用链接
    if (message.metadata?.references?.length) {
      const refsEl = messageEl.createDiv({
        cls: 'message-refs'
      });

      message.metadata.references.forEach(ref => {
        const refLink = refsEl.createEl('a', {
          cls: 'message-ref',
          text: `[[${ref}]]`
        });

        refLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(ref, '', true);
        });
      });
    }

    // 添加时间戳
    if (message.timestamp) {
      messageEl.createDiv({
        cls: 'message-timestamp',
        text: new Date(message.timestamp).toLocaleTimeString()
      });
    }

    return messageEl;
  }

  private refreshChatMessages() {
    const messagesContainer = this.containerEl.querySelector('#chat-messages-container');
    if (!messagesContainer) {
      console.error('Messages container not found');
      return;
    }

    try {
      messagesContainer.empty();
      const messages = this.chatContainer.getMessages();
      console.log('Messages to render:', messages);

      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          if (msg && typeof msg === 'object') {
            const messageEl = this.createMessageElement(msg);
            messagesContainer.appendChild(messageEl);
          } else {
            console.warn('Invalid message object:', msg);
          }
        });
      } else {
        console.warn('Messages is not an array:', messages);
      }

      // 滚动到底部
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  }
}
