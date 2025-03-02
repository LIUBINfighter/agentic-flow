export interface BaseCard {
  id: string;
  type: CardType;
  content: string;
  metadata?: CardMetadata;
}

export type CardType = 'user' | 'agent' | 'system' | 'text' | 'file';

export interface CardMetadata {
  timestamp: number;
  references?: string[];
  actions?: string[];
  position?: number; // 用于DND排序
}

// 卡片工厂函数
export function createCard(type: CardType, content: string): BaseCard {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    metadata: {
      timestamp: Date.now()
    }
  };
}
