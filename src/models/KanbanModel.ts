import { TFile } from 'obsidian';

interface AgenticFlowCard {
    id: string;
    content: string;
    tags?: string[];
    created: number;
    modified: number;
}

interface AgenticFlowList {
    id: string;
    title: string;
    cards: AgenticFlowCard[];
}

interface AgenticFlowData {
    lists: AgenticFlowList[];
    settings: AgenticFlowSettings;
}

interface AgenticFlowSettings {
    showDates: boolean;
    showTags: boolean;
    sortBy: 'created' | 'modified' | 'custom';
}

export class AgenticFlowModel {
    private data: AgenticFlowData;
    private file: TFile;
    private observers: Set<() => void>;

    constructor(file: TFile) {
        this.file = file;
        this.observers = new Set();
        this.data = {
            lists: [],
            settings: {
                showDates: true,
                showTags: true,
                sortBy: 'modified'
            }
        };
    }

    // 数据加载和解析
    async loadFromMarkdown(content: string): Promise<void> {
        // TODO: 实现Markdown解析逻辑
        this.notifyObservers();
    }

    // 数据序列化
    toMarkdown(): string {
        // TODO: 实现序列化逻辑
        return '';
    }

    // 观察者模式实现
    addObserver(callback: () => void): void {
        this.observers.add(callback);
    }

    removeObserver(callback: () => void): void {
        this.observers.delete(callback);
    }

    private notifyObservers(): void {
        this.observers.forEach(callback => callback());
    }

    // 数据操作方法
    addList(title: string): void {
        const newList: AgenticFlowList = {
            id: Date.now().toString(),
            title,
            cards: []
        };
        this.data.lists.push(newList);
        this.notifyObservers();
    }

    addCard(listId: string, content: string): void {
        const list = this.data.lists.find(l => l.id === listId);
        if (list) {
            const newCard: AgenticFlowCard = {
                id: Date.now().toString(),
                content,
                created: Date.now(),
                modified: Date.now()
            };
            list.cards.push(newCard);
            this.notifyObservers();
        }
    }

    moveCard(cardId: string, fromListId: string, toListId: string, newIndex: number): void {
        const fromList = this.data.lists.find(l => l.id === fromListId);
        const toList = this.data.lists.find(l => l.id === toListId);
        
        if (fromList && toList) {
            const cardIndex = fromList.cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                const [card] = fromList.cards.splice(cardIndex, 1);
                toList.cards.splice(newIndex, 0, card);
                this.notifyObservers();
            }
        }
    }

    updateCard(cardId: string, content: string): void {
        for (const list of this.data.lists) {
            const card = list.cards.find(c => c.id === cardId);
            if (card) {
                card.content = content;
                card.modified = Date.now();
                this.notifyObservers();
                break;
            }
        }
    }

    // 获取数据
    getData(): AgenticFlowData {
        return this.data;
    }

    getFile(): TFile {
        return this.file;
    }

    // 设置更新
    updateSettings(settings: Partial<AgenticFlowSettings>): void {
        this.data.settings = { ...this.data.settings, ...settings };
        this.notifyObservers();
    }
}
