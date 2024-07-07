import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import CreateBoardTaskModal from './CreateBoardTaskModal';
import TaskViewEditModal from './TaskViewEditModal';
import AssignUserModal from './AssignUserModal';
import './BoardPage.css';

function BoardPage() {
  const { boardId } = useParams(); // Extract boardId from route params
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // State for current task
  const [boardInfo, setBoardInfo] = useState(null); // State for board info
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [newMember, setNewMember] = useState(''); // State for new member input
  const [taskStatus, setTaskStatus] = useState('todo'); // State to track task status
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchBoardInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/boards/${boardId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { admins, description, id, members, name } = response.data;
        setBoardInfo({ admins, description, id, members, name });
        setMembers(members);
        setAdmins(admins);
        setLoading(false); // Set loading to false after data is fetched
      } catch (err) {
        toast.error('Failed to fetch board information.');
        setLoading(false); // Set loading to false on error
      }
    };

    if (boardId) { // Ensure boardId is defined before fetching data
      fetchBoardInfo();
    }
  }, [boardId]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/boards/${boardId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const groupedTasks = {
          todo: response.data.filter(task => task.status === 'todo'),
          inProgress: response.data.filter(task => task.status === 'inProgress'),
          done: response.data.filter(task => task.status === 'done')
        };
        setTasks(groupedTasks);
        setLoading(false); // Set loading to false after data is fetched
      } catch (err) {
        toast.error('Failed to fetch tasks.');
        setLoading(false); // Set loading to false on error
      }
    };

    if (boardId) { // Ensure boardId is defined before fetching data
      fetchTasks();
    }
  }, [boardId]);

  const onDragStart = (event, task, sourceColumn) => {
    event.dataTransfer.setData('task', JSON.stringify(task));
    event.dataTransfer.setData('sourceColumn', sourceColumn);
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const onDrop = async (event, destinationColumn) => {
    const task = JSON.parse(event.dataTransfer.getData('task'));
    const sourceColumn = event.dataTransfer.getData('sourceColumn');

    if (sourceColumn === destinationColumn) return;

    const sourceItems = Array.from(tasks[sourceColumn]);
    const destinationItems = Array.from(tasks[destinationColumn]);

    const updatedSourceItems = sourceItems.filter(item => item.id !== task.id);
    destinationItems.push(task);

    setTasks({
      ...tasks,
      [sourceColumn]: updatedSourceItems,
      [destinationColumn]: destinationItems
    });

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${task.id}/status`, {
        status: destinationColumn
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task status updated successfully.');
    } catch (err) {
      toast.error('Failed to update task status.');
    }
  };

  const handleTaskCreated = async (newTask) => {
    try {
      const token = localStorage.getItem('token');
      await axios.get(
        `http://localhost:5000/api/boards/${boardId}/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTasks(prevTasks => ({
        ...prevTasks,
        [taskStatus]: [...prevTasks[taskStatus], newTask]
      }));
      toast.success('Task created successfully.');
      setIsCreateModalOpen(false); // Close create modal after task creation
    } catch (err) {
      toast.error('Failed to create task.');
    }
  };

  const handleAddMember = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/boards/${boardId}/members`,
        { username: newMember },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMembers([...members, newMember]);
      setNewMember(''); // Clear the input field
      toast.success('Member added successfully.');
    } catch (err) {
      toast.error('Failed to add member.');
    }
  };

  const handleDeleteMember = async (member) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/boards/${boardId}/members`,
        {
          data: { username: member },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMembers(members.filter(m => m !== member));
      toast.success('Member removed successfully.');
    } catch (err) {
      toast.error('Failed to remove member.');
    }
  };

  const handleAssignUsers = (taskId, assignees) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      todo: prevTasks.todo.map(task => task.id === taskId ? { ...task, assignees } : task),
      inProgress: prevTasks.inProgress.map(task => task.id === taskId ? { ...task, assignees } : task),
      done: prevTasks.done.map(task => task.id === taskId ? { ...task, assignees } : task)
    }));
  };

  const handleUpdateTask = (taskId, updates) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      todo: prevTasks.todo.map(task => task.id === taskId ? { ...task, ...updates } : task),
      inProgress: prevTasks.inProgress.map(task => task.id === taskId ? { ...task, ...updates } : task),
      done: prevTasks.done.map(task => task.id === taskId ? { ...task, ...updates } : task)
    }));
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task deleted successfully.');
      // Refresh tasks
      const response = await axios.get(`http://localhost:5000/api/boards/${boardId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const groupedTasks = {
        todo: response.data.filter(task => task.status === 'todo'),
        inProgress: response.data.filter(task => task.status === 'inProgress'),
        done: response.data.filter(task => task.status === 'done')
      };
      setTasks(groupedTasks);
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  if (loading) {
    return <p>Loading...</p>; // Optionally show a loading indicator
  }

  return (
    <div className="board-page">
      <h2>Board {boardInfo && boardInfo.name}</h2>
      <p>Description: {boardInfo && boardInfo.description}</p>
      <div className="sidebar">
        <h3>Board Members</h3>
        <ul>
          {members.map(member => (
            <li key={member}>
              {member}
              <button onClick={() => handleDeleteMember(member)}>Delete</button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          placeholder="Enter username"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
        />
        <button onClick={handleAddMember}>Add Member</button>
        <h3>Board Admins</h3>
        <ul>
          {admins.map(admin => (
            <li key={admin}>{admin}</li>
          ))}
        </ul>
      </div>
      <div className="task-columns">
        {['todo', 'inProgress', 'done'].map(column => (
          <div
            key={column}
            id={column}
            className="droppable"
            onDragOver={onDragOver}
            onDrop={(event) => onDrop(event, column)}
          >
            <h3>{column.charAt(0).toUpperCase() + column.slice(1)}</h3>
            {tasks[column].map((task) => (
              <div
                key={task.id}
                className="task-card"
                draggable
                onDragStart={(event) => onDragStart(event, task, column)}
                onClick={() => { setCurrentTask(task); setIsEditModalOpen(true); }}
              >
                <h4>{task.title}</h4>
                <p>{task.assignee}</p>
                {task.photo && <img src={task.photo} alt="Task" />}
                <button onClick={(e) => { e.stopPropagation(); setCurrentTask(task); setIsAssignModalOpen(true); }}>Assign Users</button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}>Delete Task</button>
                <div className="assignees">
                  {task.assignees && task.assignees.map(user => (
                    <div key={user.username} className="assignee">
                      {user.photo && <img src={user.photo} alt={user.username} />}
                      <span>{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="create-task-buttons">
        <button onClick={() => { setIsCreateModalOpen(true); setTaskStatus('todo'); }}>Create Task</button>
        <button onClick={() => { setIsCreateModalOpen(true); setTaskStatus('inProgress'); }}>Create Task</button>
        <button onClick={() => { setIsCreateModalOpen(true); setTaskStatus('done'); }}>Create Task</button>
      </div>
      <CreateBoardTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        boardName={boardInfo && boardInfo.name}
        boardId={boardId} // Pass boardId as a prop
        status={taskStatus} // Pass taskStatus as a prop
      />
      {currentTask && (
        <TaskViewEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={currentTask}
          boardId={boardId}
          onUpdate={handleUpdateTask}
        />
      )}
      {currentTask && (
        <AssignUserModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          taskId={currentTask.id}
          boardId={boardId}
          onAssign={handleAssignUsers}
        />
      )}
    </div>
  );
}

export default BoardPage;
