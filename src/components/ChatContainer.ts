import { CardList } from './CardList';
import { EventEmitter } from 'events';
import { AIService } from '../services/AIService';

// 添加 createCard 函数的实现
function createCard(role: 'user' | 'system' | 'agent', content: string): ChatMessage {
  return {
    id: `msg-${Date.now()}`,
    role: role,
    content: content,
    timestamp: Date.now(),
    metadata: {}
  };
}

export class ChatContainer extends EventEmitter {
  private chatList: CardList;
  private aiService: AIService;
  
  constructor(apiKey: string) {
    super();
    this.chatList = new CardList('chat');
    this.aiService = new AIService(apiKey);
    
    // 监听列表变化
    this.chatList.on('change', (cards: BaseCard[]) => {
      this.emit('change', cards);
    });
  }

  async addUserMessage(content: string) {
    console.log('Adding user message:', content);
    try {
      const userCard = createCard('user', content);
      this.chatList.addCard(userCard);
      
      // 自动触发 AI 回复
      await this.generateAIResponse();
      
      return userCard;
    } catch (error) {
      console.error('Error adding user message:', error);
      throw error;
    }
  }

  async addAgentMessage(content: string, metadata?: any) {
    const card = createCard('agent', content);
    if (metadata) {
      card.metadata = { ...card.metadata, ...metadata };
    }
    this.chatList.addCard(card);
    return card;
  }

  async addSystemMessage(content: string, actions?: string[]) {
    const card = createCard('system', content);
    if (actions) {
      card.metadata = { ...card.metadata, actions };
    }
    this.chatList.addCard(card);
    return card;
  }

  getMessages(): BaseCard[] {
    const messages = this.chatList.getCards();
    console.log('Getting messages:', messages);
    return messages;
  }

  private async generateAIResponse() {
    try {
      // 获取聊天历史
      const messages = this.chatList.getCards();
      
      // 生成 AI 回复
      const response = await this.aiService.generateResponse(messages);
      
      // 添加 AI 回复到聊天
      const agentCard = createCard('agent', response);
      this.chatList.addCard(agentCard);
      
      return agentCard;
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      // 添加错误消息
      const errorCard = createCard('system', 'AI response generation failed. Please try again.');
      this.chatList.addCard(errorCard);
    }
  }
}
