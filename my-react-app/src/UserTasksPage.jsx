import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function UserTasksPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve JWT token from localStorage
        const response = await axios.get('http://localhost:5000/api/user/tasks', {
          headers: { Authorization: `Bearer ${token}` } // Attach JWT token to headers
        });
        setTasks(response.data);
      } catch (err) {
        toast.error('Failed to fetch tasks.');
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="user-tasks-page">
      <h2>Assigned Tasks</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Board</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.description}</td>
              <td>{task.board_name}</td>
              <td>{task.due_date}</td>
              <td>{task.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTasksPage;
