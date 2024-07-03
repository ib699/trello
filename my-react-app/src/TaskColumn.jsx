import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function TaskColumn({ status, boardId }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`/api/boards/${boardId}/tasks?status=${status}`);
        setTasks(response.data);
      } catch (err) {
        toast.error('Failed to fetch tasks.');
      }
    };

    fetchTasks();
  }, [status, boardId]);

  const addTask = async () => {
    try {
      const response = await axios.post(`/api/boards/${boardId}/tasks`, {
        title: newTaskTitle,
        status,
      });
      setTasks([...tasks, response.data]);
      setNewTaskTitle('');
      toast.success('Task added successfully.');
    } catch (err) {
      toast.error('Failed to add task.');
    }
  };

  return (
    <div className="task-column">
      <h3>{status.replace('-', ' ')}</h3>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="New Task"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
      />
      <button onClick={addTask}>Add Task</button>
    </div>
  );
}

export default TaskColumn;
