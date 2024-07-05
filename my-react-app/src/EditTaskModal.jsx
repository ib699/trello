import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function EditTaskModal({ isOpen, onClose, task, onTaskUpdated }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [estimate, setEstimate] = useState(task.estimate);
  const [dueDate, setDueDate] = useState(task.due_date);
  const [photo, setPhoto] = useState(task.photo);

  const handleUpdate = async () => {
    const updatedTask = {
      ...task,
      title,
      description,
      estimate,
      due_date: dueDate,
      photo
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/tasks/${task.id}`, updatedTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onTaskUpdated(response.data);
      onClose();
      toast.success('Task updated successfully.');
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };

  const handlePhotoChange = (e) => {
    setPhoto(URL.createObjectURL(e.target.files[0]));
  };

  return (
    isOpen && (
      <div className="modal">
        <h3>Edit Task</h3>
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
        <button onClick={handleUpdate}>Update</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    )
  );
}

export default EditTaskModal;
