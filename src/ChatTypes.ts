export interface ChatCard {
    id: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        references?: string[];
        actions?: string[];
    };
}

export interface ChatSection {
    id: string;
    type: string;
    cards: ChatCard[];
}

export interface ChatState {
    sections: ChatSection[];
}
