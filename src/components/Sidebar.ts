import { CardList } from './lists/CardList';
import { EventEmitter } from 'events';

export class Sidebar extends EventEmitter {
  private visible = true;
  private activeTab: 'inbox' | 'workspace' = 'inbox';
  private inboxList: CardList;
  private workspaceList: CardList;

  constructor() {
    super();
    this.inboxList = new CardList('inbox');
    this.workspaceList = new CardList('workspace');

    // 监听列表变化
    this.inboxList.on('change', () => this.emit('change', 'inbox'));
    this.workspaceList.on('change', () => this.emit('change', 'workspace'));
  }

  toggle() {
    this.visible = !this.visible;
    this.emit('visibilityChange', this.visible);
  }

  switchTab(tab: 'inbox' | 'workspace') {
    this.activeTab = tab;
    this.emit('tabChange', tab);
  }

  getActiveList(): CardList {
    return this.activeTab === 'inbox' ? this.inboxList : this.workspaceList;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getActiveTab(): 'inbox' | 'workspace' {
    return this.activeTab;
  }
}
