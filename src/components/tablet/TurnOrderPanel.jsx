import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory } from '@/lib/gameLogic';
import { getPlayerColor } from '@/components/shared/BoardView';

export default function TurnOrderPanel({ state, updateState, onClose }) {
  const players = state.players || [];
  const currentId = players[state.currentPlayerIndex]?.id;

  async function handleDragEnd(result) {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(players);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const newIndex = Math.max(0, reordered.findIndex((p) => p.id === currentId));
    const history = addHistory(state, {
      type: 'turn_order',
      detail: reordered.map((p) => p.name).join(' → '),
    });
    await updateState({ players: reordered, currentPlayerIndex: newIndex, history });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto">
        <div className="comic-panel ds-sheen px-5 py-4">
          <div className="ds-eyebrow text-primary/80">Σειρά</div>
          <div className="ds-title mt-1 text-2xl text-foreground">Σειρά παιχνιδιού</div>
          <div className="ds-label mt-2">Σύρε και άφησε για νέα σειρά</div>
        </div>

        <ComicPanel>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="turn-order">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                  {players.map((p, index) => (
                    <Draggable key={p.id} draggableId={p.id} index={index}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className={`comic-panel-sm flex items-center gap-2.5 px-2.5 py-2 ${snapshot.isDragging ? 'border-primary/50 bg-primary/15' : p.id === currentId ? 'border-primary/40 bg-primary/10' : ''}`}
                        >
                          <span className="ds-value w-5 text-center text-sm text-primary">{index + 1}</span>
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/25 font-ui text-xs text-foreground"
                            style={{ backgroundColor: getPlayerColor(p.id) }}
                          >
                            {p.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="ds-value flex-1 truncate text-sm text-foreground">{p.name}</span>
                          {p.id === currentId && <span className="ds-label text-primary">Τώρα</span>}
                          <span className="text-foreground/30">☰</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </ComicPanel>

        <ComicButton variant="red" size="md" className="w-full" onClick={onClose}>Κλείσιμο</ComicButton>
      </div>
    </div>
  );
}