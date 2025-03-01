import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AgenticFlowModel } from '../models/KanbanModel';

export const KANBAN_VIEW_TYPE = 'agentic-flow-view';

interface AgenticFlowViewProps {
    model: AgenticFlowModel;
}

const AgenticFlowBoard: React.FC<AgenticFlowViewProps> = ({ model }) => {
    const [data, setData] = useState(model.getData());

    useEffect(() => {
        const updateView = () => {
            setData(model.getData());
        };

        model.addObserver(updateView);
        return () => model.removeObserver(updateView);
    }, [model]);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { source, destination } = result;
        model.moveCard(
            result.draggableId,
            source.droppableId,
            destination.droppableId,
            destination.index
        );
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="chat-view-board">
                {data.lists.map(list => (
                    <div key={list.id} className="chat-view-list">
                        <div className="list-header">
                            <h2>{list.title}</h2>
                        </div>
                        <Droppable droppableId={list.id}>
                            {(provided) => (
                                <div
                                    className="list-cards"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {list.cards.map((card, index) => (
                                        <Draggable
                                            key={card.id}
                                            draggableId={card.id}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="chat-view-card"
                                                >
                                                    <div className="card-content">{card.content}</div>
                                                    {data.settings.showDates && (
                                                        <div className="card-dates">
                                                            <span>Modified: {new Date(card.modified).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    {data.settings.showTags && card.tags && (
                                                        <div className="card-tags">
                                                            {card.tags.map(tag => (
                                                                <span key={tag} className="tag">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export class AgenticFlowView extends ItemView {
    private model: AgenticFlowModel;
    private root: Root | null = null;

    constructor(leaf: WorkspaceLeaf, file: TFile) {
        super(leaf);
        this.model = new AgenticFlowModel(file);
    }

    getViewType(): string {
        return KANBAN_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.model.getFile().basename + ' (AgenticFlow)';
    }

    async onOpen() {
        const content = await this.app.vault.read(this.model.getFile());
        await this.model.loadFromMarkdown(content);

        // 监听文件变更
        this.registerEvent(
            this.app.vault.on('modify', (file: TFile) => {
                if (file === this.model.getFile()) {
                    this.app.vault.read(file).then(content => {
                        this.model.loadFromMarkdown(content);
                    });
                }
            })
        );

        // 渲染React组件
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <React.StrictMode>
                <AgenticFlowBoard model={this.model} />
            </React.StrictMode>
        );
    }

    async onClose() {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
}
