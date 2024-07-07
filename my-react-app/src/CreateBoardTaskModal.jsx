import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function CreateBoardTaskModal({ isOpen, onClose, onTaskCreated, boardName, boardId, status }) { // Accept status as a prop
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimate, setEstimate] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [photo, setPhoto] = useState(null);

  const handleCreate = async () => {
    if (!title) {
      toast.error('Title is required.');
      return;
    }

    const newTask = {
      title,
      description,
      board_name: parseInt(boardId, 10), // Use boardId here
      estimate,
      due_date: dueDate,
      photo,
      status // Include status in the new task object
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onTaskCreated(response.data);
      onClose();
      toast.success('Task created successfully.');
    } catch (err) {
      toast.error('Failed to create task.');
    }
  };

  const handlePhotoChange = (e) => {
    setPhoto(URL.createObjectURL(e.target.files[0]));
  };

  return (
    isOpen && (
      <div className="modal">
        <h3>Create Task</h3>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <input
          type="number"
          placeholder="Estimate"
          value={estimate}
          onChange={(e) => setEstimate(Number(e.target.value))}
        />
        <input
          type="date"
          placeholder="Due Date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <input type="file" onChange={handlePhotoChange} />
        <button onClick={handleCreate}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    )
  );
}

export default CreateBoardTaskModal;
