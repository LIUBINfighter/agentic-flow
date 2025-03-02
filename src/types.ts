export interface AgentFlowData {
  agents: {[id: string]: Agent};
  flows: {[id: string]: Flow};
  nodes: {[id: string]: Node};
  relationships: {
    parentFlow: {[nodeId: string]: string},
    nodeOrder: {[flowId: string]: string[]},
    dependencies: {[nodeId: string]: string[]}
  },
  chat?: {
    sections: {[key: string]: ChatSection}
  }
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  config: AgentConfig;
}

export interface Flow {
  id: string;
  title: string;
  description: string;
  status: FlowStatus;
}

export interface Node {
  id: string;
  type: NodeType;
  content: string;
  agentId?: string;
  metadata: NodeMetadata;
}

export enum AgentType {
  LLM = 'llm',
  TOOL = 'tool',
  HUMAN = 'human'
}

export enum FlowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export enum NodeType {
  PROMPT = 'prompt',
  RESPONSE = 'response',
  ACTION = 'action'
}

export interface NodeMetadata {
  status: 'pending' | 'running' | 'completed' | 'error';
  createdAt: number;
  updatedAt: number;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // 其他配置项...
}

export interface AgentFlowFileMetadata {
  'agentic-flow': 'chat';
  version: number;
  agents: {[id: string]: Agent};
  flows: {[id: string]: Flow};
}

export interface ViewState {
  file: string;
}

export interface ChatMessage {
  role: 'user' | 'system' | 'agent';
  content: string;
  metadata?: {
    actions?: string[];
    references?: string[];
    timestamp?: number;
  }
}

export interface ChatSection {
  type: 'inbox' | 'history' | 'workspace';
  cards?: InboxCard[];
  messages?: ChatMessage[];
  references?: string[];
}

export interface InboxCard {
  id: string;
  type: 'text' | 'url';
  content: string;
}
