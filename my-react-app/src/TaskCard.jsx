import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import EditTaskModal from './EditTaskModal.jsx';

function TaskCard({ task, onTaskUpdated, onTaskDeleted }) {
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onTaskDeleted(task.id);
      toast.success('Task deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  return (
    <div className="task-card">
      <h4>{task.title}</h4>
      <p>Assignee: {task.assignee}</p>
      {task.photo && <img src={task.photo} alt="Task" />}
      <button onClick={() => setShowEditTaskModal(true)}>Edit</button>
      <button onClick={handleDelete}>Delete</button>
      <EditTaskModal
        isOpen={showEditTaskModal}
        onClose={() => setShowEditTaskModal(false)}
        task={task}
        onTaskUpdated={onTaskUpdated}
      />
    </div>
  );
}

export default TaskCard;
