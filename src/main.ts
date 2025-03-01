import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import { KANBAN_VIEW_TYPE, AgenticFlowView } from './views/AgenticFlowView';
import { AgenticFlowSettingTab } from './settings/SettingTab';

interface AgenticFlowPluginSettings {
    defaultShowDates: boolean;
    defaultShowTags: boolean;
    defaultSortBy: 'created' | 'modified' | 'custom';
}

const DEFAULT_SETTINGS: AgenticFlowPluginSettings = {
    defaultShowDates: true,
    defaultShowTags: true,
    defaultSortBy: 'modified'
}

export default class AgenticFlowPlugin extends Plugin {
    settings: AgenticFlowPluginSettings;

    async onload() {
        await this.loadSettings();

        // 注册看板视图类型
        this.registerView(
            KANBAN_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => {
                const file = this.app.workspace.getActiveFile();
                return new AgenticFlowView(leaf, file);
            }
        );

        // 添加打开看板视图的命令
        this.addCommand({
            id: 'open-as-chat-view',
            name: '打开为看板视图',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file && file.extension === 'md') {
                    if (!checking) {
                        this.activateAgenticFlowView(file);
                    }
                    return true;
                }
                return false;
            }
        });

        // 添加创建新看板的命令
        this.addCommand({
            id: 'create-new-chat-view',
            name: '创建新看板',
            callback: () => {
                // 创建输入标题的模态框
                const modal = new NewAgenticFlowModal(this.app, async (title: string) => {
                    try {
                        // 创建解析器实例
                        const parser = new AgenticFlowParser(this.app.vault);
                        
                        // 生成目标文件路径
                        const targetPath = `${title}.md`;
                        
                        // 从模板创建新文件
                        const file = await parser.createFromTemplate(title, targetPath);
                        
                        // 打开新创建的文件
                        await this.activateAgenticFlowView(file);
                        
                        new Notice(`看板 ${title} 创建成功`);
                    } catch (error) {
                        new Notice(`创建看板失败: ${error.message}`);
                    }
                });
                modal.open();
            }
        });

        // 添加设置选项卡
        this.addSettingTab(new AgenticFlowSettingTab(this.app, this));

        // 添加看板图标到左侧栏
        this.addRibbonIcon('layout-grid', '看板视图', () => {
            const file = this.app.workspace.getActiveFile();
            if (file && file.extension === 'md') {
                this.activateAgenticFlowView(file);
            } else {
                new Notice('请先打开一个 Markdown 文件');
            }
        });
    }

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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
