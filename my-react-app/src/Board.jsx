import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Board({ board, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [boardName, setBoardName] = useState(board.name);

  const handleUpdateBoard = async () => {
    try {
      await axios.put(`/api/boards/${board.id}`, { name: boardName });
      setEditMode(false);
      toast.success('Board updated successfully!');
    } catch (err) {
      toast.error('Failed to update board.');
    }
  };

  return (
    <div className="board">
      {editMode ? (
        <>
          <input
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
          />
          {/* <button onClick={handleUpdateBoard}>Save</button> */}
          {/* <button onClick={() => setEditMode(false)}>Cancel</button> */}
        </>
      ) : (
        <>
          <h3>{board.name}</h3>
        </>
      )}
    </div>
  );
}

export default Board;
