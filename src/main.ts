import { Plugin, TFile, Modal, App, PluginSettingTab, Setting } from 'obsidian';
import { ChatView, VIEW_TYPE_CHAT } from './ChatView';

export default class AgenticFlowPlugin extends Plugin {
  private generateNewChatTemplate(): string {
    const timestamp = Date.now();
    return `---
title: New Chat
agenticflow: chat
timestamp: ${timestamp}
---

## Inbox

## Chat History

AI: 你好!我是你的AI助手。我可以帮你完成各种任务,包括:
- 回答问题
- 分析文档
- 总结内容
- 提供建议
请告诉我你需要什么帮助?

## WorkSpace

> [!agenticflow-setttings]
>

`;  // 移除了有问题的代码块标记
  }

  async onload() {
    // 注册聊天视图
    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) => new ChatView(leaf)
    );

    // 监听文件打开事件
    this.registerEvent(
      this.app.workspace.on('file-open', async (file: TFile) => {
        if (file && file.extension === 'md') {
          const content = await this.app.vault.read(file);
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            if (frontmatter.includes('agenticflow: chat')) {
              // 如果是聊天文档，打开ChatView
              const leaf = this.app.workspace.getLeaf();
              await leaf.setViewState({
                type: VIEW_TYPE_CHAT,
                state: { file: file.path }
              });

              const view = leaf.view as ChatView;
              if (view) {
                await view.loadDocument(content);
              }
            }
          }
        }
      })
    );

    // 添加创建新对话的命令
    this.addCommand({
      id: 'create-chat',
      name: '创建新对话',
      callback: async () => {
        // 确保 chats 目录存在
        const chatsDir = 'chats';
        if (!(await this.app.vault.adapter.exists(chatsDir))) {
          await this.app.vault.createFolder(chatsDir);
        }

        const file = await this.app.vault.create(
          `${chatsDir}/${Date.now()}.md`,
          this.generateNewChatTemplate()
        );

        const leaf = this.app.workspace.getLeaf();
        await leaf.setViewState({
          type: VIEW_TYPE_CHAT,
          state: { file: file.path }
        });
      }
    });
  }

  onunload() {
    // 清理视图
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CHAT);
  }
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: AgenticFlowPlugin;

	constructor(app: App, plugin: AgenticFlowPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
