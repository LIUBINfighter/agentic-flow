import { BaseCard } from '../cards/BaseCard';
import { EventEmitter } from 'events';

export type ListType = 'inbox' | 'chat' | 'workspace';

export class CardList extends EventEmitter {
  private cards: BaseCard[] = [];

  constructor(
    public readonly type: ListType,
    public readonly id: string = `list-${type}-${Date.now()}`
  ) {
    super();
  }

  addCard(card: BaseCard, index?: number) {
    if (typeof index === 'number') {
      this.cards.splice(index, 0, card);
    } else {
      this.cards.push(card);
    }
    this.emit('change', this.cards);
    return card;
  }

  removeCard(cardId: string) {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index > -1) {
      const card = this.cards.splice(index, 1)[0];
      this.emit('change', this.cards);
      return card;
    }
    return null;
  }

  moveCard(fromIndex: number, toIndex: number) {
    const card = this.cards.splice(fromIndex, 1)[0];
    this.cards.splice(toIndex, 0, card);
    this.emit('change', this.cards);
  }

  getCards(): BaseCard[] {
    return [...this.cards];
  }

  findCard(cardId: string): BaseCard | undefined {
    return this.cards.find(c => c.id === cardId);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      cards: this.cards
    };
  }
}
