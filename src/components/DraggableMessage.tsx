import * as React from 'react';
import { IMessage } from '../types/IChatDocument';

interface DraggableMessageProps {
  message: IMessage;
  onDragStart?: (e: React.DragEvent, message: IMessage) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export const DraggableMessage: React.FC<DraggableMessageProps> = ({ 
  message, 
  onDragStart, 
  onDragEnd,
  isDragging 
}) => {
  return (
    <div 
      className={`chat-message ${message.type === 'user' ? 'user' : 'assistant'} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, message)}
      onDragEnd={onDragEnd}
    >
      <div className="message-header">
        {message.type === 'user' ? '用户' : 'AI'}:
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};
