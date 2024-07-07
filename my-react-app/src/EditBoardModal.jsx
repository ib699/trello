import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ModalStyles.css';  // Import the CSS file

function EditBoardModal({ isOpen, onClose, board, onBoardUpdated }) {
  const [title, setTitle] = useState(board ? board.name : '');
  const [description, setDescription] = useState(board ? board.description : '');

  useEffect(() => {
    if (board) {
      setTitle(board.name);
      setDescription(board.description);
    }
  }, [board]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    } else {
      document.removeEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/boards/${board.id}`, 
      { 
        name: title, 
        description 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onBoardUpdated(response.data);
      toast.success('Board updated successfully.');
      onClose();
    } catch (err) {
      toast.error('Failed to update board.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Board</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <button type="submit">Save Changes</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

export default EditBoardModal;