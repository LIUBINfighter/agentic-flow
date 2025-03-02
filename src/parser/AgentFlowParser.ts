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
        id: `msg-${Date.now()}-${messages.length}`,
        role,
        content: messageContent,
        metadata: this.parseMessageMetadata(messageContent),
        timestamp: Date.now()
      };
      
      messages.push(message);
    }

    return {
      type: 'history',
      messages
    };
  }

  private parseMessageMetadata(content: string): MessageMetadata {
    const metadata: MessageMetadata = {};
    
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
    
    // 解析时间戳（如果有）
    const timestamp = content.match(/\{timestamp:\s*(\d+)\}/);
    if (timestamp) {
      metadata.timestamp = parseInt(timestamp[1]);
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

  private parseAgents(agents: any[] = []): Agent[] {
    return agents.map(agent => ({
      id: agent.id || `agent-${Date.now()}`,
      name: agent.name || '',
      role: agent.role || '',
      description: agent.description || '',
      systemPrompt: agent.systemPrompt || '',
      metadata: agent.metadata || {}
    }));
  }

  private parseFlows(content: string): Flow[] {
    const flows: Flow[] = [];
    const flowRegex = /### Flow: (.*?)\n([\s\S]*?)(?=### |$)/g;
    let match;

    while ((match = flowRegex.exec(content)) !== null) {
      flows.push({
        id: `flow-${Date.now()}-${flows.length}`,
        name: match[1].trim(),
        steps: this.parseFlowSteps(match[2])
      });
    }

    return flows;
  }

  private parseFlowSteps(content: string): FlowStep[] {
    const steps: FlowStep[] = [];
    const stepRegex = /\d+\.\s*(.*?)(?=\n\d+\.|$)/gs;
    let match;

    while ((match = stepRegex.exec(content)) !== null) {
      steps.push({
        id: `step-${Date.now()}-${steps.length}`,
        content: match[1].trim()
      });
    }

    return steps;
  }

  private parseNodes(content: string): Node[] {
    const nodes: Node[] = [];
    const nodeRegex = /### Node: (.*?)\n([\s\S]*?)(?=### |$)/g;
    let match;

    while ((match = nodeRegex.exec(content)) !== null) {
      nodes.push({
        id: `node-${Date.now()}-${nodes.length}`,
        name: match[1].trim(),
        content: match[2].trim()
      });
    }

    return nodes;
  }

  private parseRelationships(content: string): Relationship[] {
    const relationships: Relationship[] = [];
    const relationRegex = /\[(.*?)\]\s*->\s*\[(.*?)\]/g;
    let match;

    while ((match = relationRegex.exec(content)) !== null) {
      relationships.push({
        id: `rel-${Date.now()}-${relationships.length}`,
        source: match[1].trim(),
        target: match[2].trim()
      });
    }

    return relationships;
  }

  private stringifyFrontmatter(data: AgentFlowData): string {
    return stringifyYaml({
      agents: data.agents
    });
  }

  private stringifyContent(data: AgentFlowData): string {
    let content = '';

    // 添加 Chat 部分
    if (data.chat) {
      Object.entries(data.chat.sections).forEach(([name, section]) => {
        content += `## ${name}\n\n`;
        if (section.type === 'history') {
          section.messages.forEach(msg => {
            content += `### ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}\n\n${msg.content}\n\n`;
          });
        }
      });
    }

    // 添加 Flows
    data.flows.forEach(flow => {
      content += `### Flow: ${flow.name}\n`;
      flow.steps.forEach((step, index) => {
        content += `${index + 1}. ${step.content}\n`;
      });
      content += '\n';
    });

    // 添加 Nodes
    data.nodes.forEach(node => {
      content += `### Node: ${node.name}\n${node.content}\n\n`;
    });

    // 添加 Relationships
    data.relationships.forEach(rel => {
      content += `[${rel.source}] -> [${rel.target}]\n`;
    });

    return content;
  }

  // 其他解析方法...
}
