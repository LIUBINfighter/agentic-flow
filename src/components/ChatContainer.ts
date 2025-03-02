import { BaseCard, createCard } from './cards/BaseCard';
import { CardList } from './lists/CardList';
import { EventEmitter } from 'events';

export class ChatContainer extends EventEmitter {
  private chatList: CardList;
  
  constructor() {
    super();
    this.chatList = new CardList('chat');
    
    // 监听列表变化
    this.chatList.on('change', (cards: BaseCard[]) => {
      this.emit('change', cards);
    });
  }

  async addUserMessage(content: string) {
    const card = createCard('user', content);
    this.chatList.addCard(card);
    return card;
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
    return this.chatList.getCards();
  }
}
