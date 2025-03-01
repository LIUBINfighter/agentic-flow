import { App, PluginSettingTab, Setting } from 'obsidian';
import AgenticFlowPlugin from '../main';

export class AgenticFlowSettingTab extends PluginSettingTab {
    plugin: AgenticFlowPlugin;

    constructor(app: App, plugin: AgenticFlowPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('显示日期')
            .setDesc('在卡片上显示修改日期')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.defaultShowDates)
                .onChange(async (value) => {
                    this.plugin.settings.defaultShowDates = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('显示标签')
            .setDesc('在卡片上显示标签')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.defaultShowTags)
                .onChange(async (value) => {
                    this.plugin.settings.defaultShowTags = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('排序方式')
            .setDesc('选择卡片的默认排序方式')
            .addDropdown(dropdown => dropdown
                .addOption('created', '创建时间')
                .addOption('modified', '修改时间')
                .addOption('custom', '自定义')
                .setValue(this.plugin.settings.defaultSortBy)
                .onChange(async (value: 'created' | 'modified' | 'custom') => {
                    this.plugin.settings.defaultSortBy = value;
                    await this.plugin.saveSettings();
                }));
    }
}