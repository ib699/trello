import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import axios from 'axios';
import './task-modal.css';

function TaskViewEditModal({ isOpen, onClose, task, onUpdate }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [estimatedDate, setEstimatedDate] = useState(task?.estimatedDate || '');
  const [file, setFile] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState(task?.assignees || []);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setEstimatedDate(task.estimatedDate);
      setSelectedAssignees(task.assignees);
      fetchComments();
      fetchSubtasks();
    }

    fetchAssignees();
  }, [task]);

  const fetchAssignees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/tasks/${task?.id}/assignees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignees(response.data.assignees);
      setSelectedAssignees(response.data.assignees);
    } catch (err) {
      toast.error('Failed to fetch assignees.');
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/tasks/${task?.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data);
    } catch (err) {
      toast.error('Failed to fetch comments.');
    }
  };

  const fetchSubtasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/tasks/${task?.id}/subtasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubtasks(response.data);
    } catch (err) {
      toast.error('Failed to fetch subtasks.');
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');

      let base64File = null;
      if (file) {
        base64File = await convertFileToBase64(file);
      }

      const taskData = {
        title,
        description,
        estimatedDate,
        assignees: selectedAssignees,
        file: base64File,
      };

      await axios.put(
        `http://localhost:5000/api/tasks/${task.id}`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onUpdate(task.id, { title, description, estimatedDate, assignees: selectedAssignees });
      toast.success('Task updated successfully.');
      onClose();
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAddComment = async () => {
    if (!newComment) {
      toast.error('Comment content is required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${task.id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, response.data]);
      setNewComment('');
      toast.success('Comment added successfully.');
    } catch (err) {
      toast.error('Failed to add comment.');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle) {
      toast.error('Subtask title is required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${task.id}/subtasks`,
        { title: newSubtaskTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubtasks([...subtasks, response.data]);
      setNewSubtaskTitle('');
      toast.success('Subtask added successfully.');
    } catch (err) {
      toast.error('Failed to add subtask.');
    }
  };

  const handleUpdateSubtask = async (subtaskId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/subtasks/${subtaskId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubtasks(subtasks.map(subtask => subtask.id === subtaskId ? { ...subtask, ...updates } : subtask));
      toast.success('Subtask updated successfully.');
    } catch (err) {
      toast.error('Failed to update subtask.');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/subtasks/${subtaskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubtasks(subtasks.filter(subtask => subtask.id !== subtaskId));
      toast.success('Subtask deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete subtask.');
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} className="task-modal">
      <div className="task-modal-content">
        <h2>Update Task</h2>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Estimated Date
          <input
            type="date"
            value={estimatedDate}
            onChange={(e) => setEstimatedDate(e.target.value)}
          />
        </label>
        <label>
          File
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
        <button onClick={handleUpdate}>Update</button>
        <button onClick={onClose}>Close</button>

        <div className="assignees-section">
          <h3>Assignees</h3>
          <ul>
            {assignees.map((assignee, index) => (
              <li key={index}>{assignee}</li>
            ))}
          </ul>
        </div>

        <div className="comments-section">
          <h3>Comments</h3>
          <ul>
            {comments.map(comment => (
              <li key={comment.id}>
                <strong>{comment.username}</strong>: {comment.content}
                <br />
                <small>{new Date(comment.timestamp).toLocaleString()}</small>
              </li>
            ))}
          </ul>
          <input
            type="text"
            placeholder="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button onClick={handleAddComment}>Add Comment</button>
        </div>

        <div className="subtasks-section">
          <h3>Subtasks</h3>
          <ul>
            {subtasks.map(subtask => (
              <li key={subtask.id}>
                <input
                  type="text"
                  value={subtask.title}
                  onChange={(e) => handleUpdateSubtask(subtask.id, { title: e.target.value })}
                />
                <select
                  value={subtask.status}
                  onChange={(e) => handleUpdateSubtask(subtask.id, { status: e.target.value })}
                >
                  <option value="todo">Todo</option>
                  <option value="done">Done</option>
                </select>
                <button onClick={() => handleDeleteSubtask(subtask.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            placeholder="Add a subtask"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
          />
          <button onClick={handleAddSubtask}>Add Subtask</button>
        </div>
      </div>
    </Modal>
  );
}

export default TaskViewEditModal;
