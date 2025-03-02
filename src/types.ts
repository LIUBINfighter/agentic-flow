export interface AgentFlowData {
  agents: Agent[];
  flows: Flow[];
  nodes: Node[];
  relationships: Relationship[];
  chat: {
    sections: Record<string, ChatSection>;
  };
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  metadata: Record<string, any>;
}

export interface Flow {
  id: string;
  name: string;
  steps: FlowStep[];
}

export interface FlowStep {
  id: string;
  content: string;
}

export interface Node {
  id: string;
  name: string;
  content: string;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
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
  ACTION'
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
  id: string;           // 添加必需的 id 属性
  role: 'user' | 'system' | 'agent';
  content: string;
  timestamp?: number;
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
