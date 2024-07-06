import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import CreateBoardTaskModal from './CreateBoardTaskModal';
import './BoardPage.css';

function BoardPage() {
  const { boardId } = useParams();
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      } catch (err) {
        toast.error('Failed to fetch tasks.');
      }
    };

    fetchTasks();
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

  const handleTaskCreated = (newTask) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      todo: [...prevTasks.todo, newTask]
    }));
  };

  return (
    <div className="board-page">
      <h2>Board {boardId}</h2>
      <button onClick={() => setIsModalOpen(true)}>Create Task</button>
      <CreateBoardTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTaskCreated={handleTaskCreated} 
        boardName={boardId} 
      />
      <div className="task-columns">
        {['todo', 'inProgress', 'done'].map(columnId => (
          <div 
            key={columnId} 
            id={columnId} 
            className="droppable"
            onDragOver={onDragOver}
            onDrop={(event) => onDrop(event, columnId)}
          >
            <h3>{columnId}</h3>
            {tasks[columnId].map((task) => (
              <div 
                key={task.id} 
                className="task-card" 
                draggable 
                onDragStart={(event) => onDragStart(event, task, columnId)}
              >
                <h4>{task.title}</h4>
                <p>{task.assignee}</p>
                {task.photo && <img src={task.photo} alt="Task" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BoardPage;
