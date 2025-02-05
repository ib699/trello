// Draggable.js
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function Draggable({ id, children, data }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: 'none'
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export { Draggable };
