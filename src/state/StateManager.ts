import { EventManager, EventType } from '../events/EventManager';
import { AgentFlowData, Node, Flow, Agent } from '../types';
import { AgentFlowParser } from '../parser/AgentFlowParser';
import { debounce } from 'obsidian';
import { FileManager } from '../file/FileManager';

export class StateManager {
  private data: AgentFlowData;
  private events: EventManager;
  private fileManager: FileManager;
  private parser: AgentFlowParser;

  constructor() {
    this.events = new EventManager();
    this.fileManager = new FileManager();
    this.parser = new AgentFlowParser();
    this.data = this.getInitialState();
  }

  private getInitialState(): AgentFlowData {
    return {
      agents: {},
      flows: {},
      nodes: {},
      relationships: {
        parentFlow: {},
        nodeOrder: {},
        dependencies: {}
      }
    };
  }

  @debounce(1000)
  private async saveToFile() {
    const markdown = this.parser.stringify(this.data);
    await this.fileManager.writeFile(markdown);
  }

  setState(data: AgentFlowData) {
    this.data = data;
    this.events.emit(EventType.FLOW_UPDATE, this.data);
  }

  updateNode(nodeId: string, changes: Partial<Node>) {
    this.data.nodes[nodeId] = {
      ...this.data.nodes[nodeId],
      ...changes,
      metadata: {
        ...this.data.nodes[nodeId].metadata,
        updatedAt: Date.now()
      }
    };
    
    this.events.emit(EventType.NODE_UPDATE, {
      nodeId,
      changes
    });
    
    this.saveToFile();
  }

  updateFlow(flowId: string, changes: Partial<Flow>) {
    this.data.flows[flowId] = {
      ...this.data.flows[flowId],
      ...changes
    };
    
    this.events.emit(EventType.FLOW_UPDATE, {
      flowId,
      changes
    });
    
    this.saveToFile();
  }

  getState(): AgentFlowData {
    return this.data;
  }

  // 其他状态管理方法...
}
