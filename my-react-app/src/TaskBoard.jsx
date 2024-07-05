import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import TaskColumn from './TaskColumn';
import CreateTaskModal from './CreateTaskModal';

function TaskBoard({ board }) {
  const [tasks, setTasks] = useState([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/user/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(response.data);
      } catch (err) {
        toast.error('Failed to fetch tasks.');
      }
    };

    fetchTasks();
  }, []);

  const handleTaskCreated = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(task => (task.id === updatedTask.id ? updatedTask : task)));
  };

  const handleTaskDeleted = (deletedTaskId) => {
    setTasks(tasks.filter(task => task.id !== deletedTaskId));
  };

  return (
    <div className="task-board">
      <h2>{board.name}</h2>
      <button onClick={() => setShowCreateTaskModal(true)}>Add Task</button>
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onTaskCreated={handleTaskCreated}
        boardName={board.name}
      />
      <div className="task-columns">
        <TaskColumn
          title="Todo"
          tasks={tasks.filter(task => task.status === 'todo')}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
        <TaskColumn
          title="In Progress"
          tasks={tasks.filter(task => task.status === 'in progress')}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
        <TaskColumn
          title="Done"
          tasks={tasks.filter(task => task.status === 'done')}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      </div>
    </div>
  );
}

export default TaskBoard;
