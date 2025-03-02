import { AgentFlowData, ChatMessage, ChatSection } from '../types';
import { parseYaml, stringifyYaml } from 'obsidian';

export class AgentFlowParser {
  parse(markdown: string): AgentFlowData {
    const { frontmatter, content } = this.splitContent(markdown);
    
    return {
      agents: this.parseAgents(frontmatter.agents),
      flows: this.parseFlows(content),
      nodes: this.parseNodes(content),
      relationships: this.parseRelationships(content),
      chat: this.parseContent(content).chat
    };
  }

  stringify(data: AgentFlowData): string {
    const frontmatter = this.stringifyFrontmatter(data);
    const content = this.stringifyContent(data);
    return `---\n${frontmatter}\n---\n\n${content}`;
  }

  private splitContent(markdown: string) {
    const fmRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = markdown.match(fmRegex);
    
    if (!match) {
      return { frontmatter: {}, content: markdown };
    }

    return {
      frontmatter: parseYaml(match[1]),
      content: match[2]
    };
  }

  private parseAgents(agentsYaml: any) {
    return agentsYaml || {};
  }

  private parseFlows(content: string) {
    // 实现流程解析逻辑
    return {};
  }

  private parseNodes(content: string) {
    // 实现节点解析逻辑
    return {};
  }

  private parseRelationships(content: string) {
    // 实现关系解析逻辑
    return {
      parentFlow: {},
      nodeOrder: {},
      dependencies: {}
    };
  }

  private parseContent(content: string) {
    const sections = this.parseSections(content);
    return {
      chat: { sections }
    };
  }

  private parseSections(content: string): {[key: string]: ChatSection} {
    const sections: {[key: string]: ChatSection} = {};
    const sectionRegex = /^## ([^\n]+)/gm;
    let match;
    let lastIndex = 0;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionName = match[1].trim();
      const startIndex = match.index;
      const endIndex = content.indexOf('## ', startIndex + 1);
      const sectionContent = endIndex === -1 
        ? content.slice(startIndex)
        : content.slice(startIndex, endIndex);

      if (sectionName === 'ChatHistory') {
        sections[sectionName] = this.parseChatHistory(sectionContent);
      } else if (sectionName === 'Inbox') {
        sections[sectionName] = this.parseInbox(sectionContent);
      } else if (sectionName === 'Workspace') {
        sections[sectionName] = this.parseWorkspace(sectionContent);
      }
      
      lastIndex = endIndex === -1 ? content.length : endIndex;
    }
    
    return sections;
  }

  private parseChatHistory(content: string): ChatSection {
    const messages: ChatMessage[] = [];
    const messageRegex = /### (User|System|Agent)\n\n([\s\S]*?)(?=### |$)/g;
    let match;

    while ((match = messageRegex.exec(content)) !== null) {
      const role = match[1].toLowerCase() as 'user' | 'system' | 'agent';
      const messageContent = match[2].trim();
      
      const message: ChatMessage = {
        role,
        content: messageContent,
        metadata: this.parseMessageMetadata(messageContent)
      };
      
      messages.push(message);
    }

    return {
      type: 'history',
      messages
    };
  }

  private parseMessageMetadata(content: string) {
    const metadata: ChatMessage['metadata'] = {};
    
    // 解析操作指令
    const actions = content.match(/>\s*\[(.*?)\]:\s*\[(.*?)\]/g);
    if (actions) {
      metadata.actions = actions.map(a => a.trim());
    }
    
    // 解析引用文件
    const references = content.match(/\[\[(.*?)\]\]/g);
    if (references) {
      metadata.references = references.map(r => r.slice(2, -2));
    }
    
    return metadata;
  }

  private parseInbox(content: string): ChatSection {
    const cards: InboxCard[] = [];
    const cardRegex = /### Card.*?\n\n(.*?)(?=### |$)/gs;
    let match;
    
    while ((match = cardRegex.exec(content)) !== null) {
      const cardContent = match[1].trim();
      cards.push({
        id: `card-${Date.now()}-${cards.length}`,
        type: cardContent.startsWith('url') ? 'url' : 'text',
        content: cardContent
      });
    }
    
    return {
      type: 'inbox',
      cards
    };
  }

  private parseWorkspace(content: string): ChatSection {
    const references = content.match(/\[\[(.*?)\]\]/g)?.map(r => r.slice(2, -2)) || [];
    
    return {
      type: 'workspace',
      references
    };
  }

  // 其他解析方法...
}
