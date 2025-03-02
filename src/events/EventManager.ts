export enum EventType {
  FILE_CHANGE = 'file-change',
  FLOW_UPDATE = 'flow-update',
  NODE_UPDATE = 'node-update',
  AGENT_UPDATE = 'agent-update',
  EXECUTION_STATE = 'execution-state'
}

export type EventHandler = (data: any) => void;

export class EventManager {
  private handlers: Map<EventType, Set<EventHandler>>;

  constructor() {
    this.handlers = new Map();
  }

  on(event: EventType, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)?.add(handler);
    
    return () => this.off(event, handler);
  }

  off(event: EventType, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: EventType, data: any) {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
