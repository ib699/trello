// Droppable.js
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

function Droppable({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const style = {
    backgroundColor: isOver ? 'lightblue' : 'lightgrey',
    padding: '16px',
    borderRadius: '4px',
    minHeight: '200px',
    border: isOver ? '2px dashed #ccc' : 'none'
  };

  return (
    <div ref={setNodeRef} style={style} id={id}>
      {children}
    </div>
  );
}

export { Droppable };
