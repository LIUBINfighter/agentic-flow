import { EventEmitter } from 'events';
import { ChatContainer } from '../components/ChatContainer';
import { AgentFlowParser } from '../parser/AgentFlowParser';
import { BaseCard } from '../components/BaseCard';

export class ChatManager extends EventEmitter {
  private chatContainer: ChatContainer;
  private parser: AgentFlowParser;

  constructor() {
    super();
    this.chatContainer = new ChatContainer();
    this.parser = new AgentFlowParser();

    // 监听聊天容器的变化
    this.chatContainer.on('change', (cards: BaseCard[]) => {
      this.emit('change', cards);
      this.syncToMarkdown(cards);
    });
  }

  // 处理用户消息
  async handleUserMessage(content: string) {
    // 添加用户消息
    await this.chatContainer.addUserMessage(content);
    
    // 模拟AI回复（固定回复）
    await this.chatContainer.addAgentMessage(content);
    
    // 模拟系统消息（固定回复）
    await this.chatContainer.addSystemMessage(content);
  }

  // 同步到Markdown
  private syncToMarkdown(cards: BaseCard[]) {
    let markdown = '## Chat History\n\n';
    
    cards.forEach(card => {
      const title = card.type.charAt(0).toUpperCase() + card.type.slice(1);
      markdown += `### ${title}\n\n${card.content}\n\n`;
    });

    this.emit('markdown-sync', markdown);
  }

  // 从Markdown同步
  async syncFromMarkdown(markdown: string) {
    // TODO: 实现从Markdown解析并更新聊天内容的逻辑
    // 这部分将在后续实现
  }
}
