import { TFile, Vault } from 'obsidian';
import { readFileSync } from 'fs';
import { join } from 'path';

export class AgenticFlowParser {
    constructor(private vault: Vault) {}

    /**
     * 从模板创建新的看板文件
     * @param title 看板标题
     * @param targetPath 目标文件路径
     */
    async createFromTemplate(title: string, targetPath: string): Promise<TFile> {
        // 读取模板文件
        const templatePath = join(__dirname, '..', 'templates', 'chat-view-template.md');
        const template = readFileSync(templatePath, 'utf-8');

        // 替换模板中的变量
        const content = template
            .replace(/^title:.*$/m, `title: ${title}`)
            .replace(/^time-stamp:.*$/m, `time-stamp: ${new Date().toISOString()}`);

        // 创建新文件
        const file = await this.vault.create(targetPath, content);
        return file;
    }

    /**
     * 解析看板文件内容
     * @param content 文件内容
     */
    parseContent(content: string): {
        title: string;
        timestamp: string;
        sections: {
            inbox: string[];
            chatHistory: string[];
            workspace: string[];
        };
    } {
        const sections = {
            inbox: [],
            chatHistory: [],
            workspace: []
        };

        // 解析YAML前置元数据
        const frontMatterMatch = content.match(/---\n([\s\S]*?)\n---/);
        const frontMatter = frontMatterMatch ? frontMatterMatch[1] : '';
        const title = frontMatter.match(/title:\s*(.*)$/m)?.[1] || '';
        const timestamp = frontMatter.match(/time-stamp:\s*(.*)$/m)?.[1] || '';

        // 解析各个部分的内容
        const lines = content.split('\n');
        let currentSection = '';

        for (const line of lines) {
            if (line.startsWith('## Inbox')) {
                currentSection = 'inbox';
            } else if (line.startsWith('## ChatHistory')) {
                currentSection = 'chatHistory';
            } else if (line.startsWith('## Workspace')) {
                currentSection = 'workspace';
            } else if (currentSection && line.trim()) {
                sections[currentSection].push(line);
            }
        }

        return {
            title,
            timestamp,
            sections
        };
    }
}
