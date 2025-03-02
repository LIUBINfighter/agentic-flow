import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import { ChatView, VIEW_TYPE_CHAT } from './ChatView';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class AgentFlowPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		// 注册视图
		this.registerView(
			VIEW_TYPE_CHAT,
			(leaf: WorkspaceLeaf) => new ChatView(leaf)
		);

		// 添加创建聊天文件的命令
		this.addCommand({
			id: 'create-chat-file',
			name: '创建代理流程聊天',
			callback: async () => {
				const fileName = `chat-${Date.now()}.md`;
				const template = this.getTemplateContent();
				
				const file = await this.app.vault.create(fileName, template);
				
				// 打开文件并激活视图
				const leaf = this.app.workspace.getUnpinnedLeaf();
				await leaf.setViewState({
					type: VIEW_TYPE_CHAT,
					state: { file: file.path }
				});
				
				this.app.workspace.revealLeaf(leaf);
			}
		});

		// 注册文件处理器
		this.registerMarkdownCodeBlockProcessor('agentic-flow', (source, el, ctx) => {
			// 处理代码块
		});

		// 注册事件处理器，检测文件打开
		this.registerEvent(
			this.app.workspace.on('file-open', (file: TFile) => {
				if (this.isAgentFlowFile(file)) {
					this.handleAgentFlowFile(file);
				}
			})
		);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private getTemplateContent(): string {
		const timestamp = new Date().toISOString();
		
		return [
			'---',
			'title: New Chat',
			'agentic-flow: chat',
			`time-stamp: ${timestamp}`,
			'---',
			'',
			'## Inbox',
			'',
			'### Card 1',
			'',
			'text 这里是inbox card示例',
			'',
			'### Card 2',
			'',
			'url preview 这里是inbox card示例',
			'',
			'## ChatHistory',
			'',
			'### User',
			'',
			'%%用户输入%%',
			'',
			'### System',
			'',
			'> [get]: [weather]',
			'> [Search]: [keywords]',
			'> [File Read]: [[arvix10086.pdf]]',
			'> [think & evaluate]',
			'',
			'%%调用工具的系统消息%%',
			'',
			'### Agent',
			'',
			'ok,let\'s check [[dairy.md]]',
			'',
			'%%ai回答%%',
			'',
			'## Workspace',
			'',
			'[[arvix10086.pdf]]',
			'[[example.png]]',
			'',
			'%%这里是ai参考的阅读内容双链%%'
		].join('\n');
	}

	private isAgentFlowFile(file: TFile): boolean {
		if (!file || file.extension !== 'md') return false;
		
		const cache = this.app.metadataCache.getFileCache(file);
		return cache?.frontmatter?.['agentic-flow'] === 'chat';
	}

	private async handleAgentFlowFile(file: TFile) {
		// 获取或创建视图
		let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHAT)[0];
		if (!leaf) {
			leaf = this.app.workspace.getLeaf('split');
		}

		// 设置视图类型和状态
		await leaf.setViewState({
			type: VIEW_TYPE_CHAT,
			state: { file: file.path }
		});

		// 激活视图
		this.app.workspace.revealLeaf(leaf);
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
