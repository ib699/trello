// BoardPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';
import './BoardPage.css';

function BoardPage() {
  const { boardId } = useParams();
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: []
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/boards/${boardId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const groupedTasks = {
          todo: response.data.filter(task => task.status === 'todo'),
          inProgress: response.data.filter(task => task.status === 'in progress'),
          done: response.data.filter(task => task.status === 'done')
        };
        setTasks(groupedTasks);
      } catch (err) {
        toast.error('Failed to fetch tasks.');
      }
    };

    fetchTasks();
  }, [boardId]);

  const handleDragEnd = ({ over, active }) => {
    if (!over) return;

    console.log("Active:", active);
    console.log("Over:", over);

    const sourceColumn = active?.data?.current?.sortable?.containerId;
    const destinationColumn = over?.id;

    if (!sourceColumn || !destinationColumn) {
        console.error("Source or destination column is undefined");
        return;
    }

    if (sourceColumn === destinationColumn) return;

    const sourceItems = Array.from(tasks[sourceColumn]);
    const [movedTask] = sourceItems.splice(active.data.current.sortable.index, 1);

    const destinationItems = Array.from(tasks[destinationColumn]);
    destinationItems.splice(over.data.current.sortable.index, 0, movedTask);

    setTasks({
        ...tasks,
        [sourceColumn]: sourceItems,
        [destinationColumn]: destinationItems
    });

    // Update the task's status in the backend
    const updateTaskStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/tasks/${movedTask.id}/status`, {
                status: destinationColumn
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Task status updated successfully.');
        } catch (err) {
            toast.error('Failed to update task status.');
        }
    };

    updateTaskStatus();
};

  return (
    <div className="board-page">
      <h2>Board {boardId}</h2>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="task-columns">
          {['todo', 'inProgress', 'done'].map(columnId => (
            <Droppable key={columnId} id={columnId}>
              <h3>{columnId}</h3>
              {tasks[columnId].map((task, index) => (
                <Draggable key={task.id} id={task.id} index={index} data={{sortable: {containerId: columnId, index}}}>
                  <div className="task-card">
                    <h4>{task.title}</h4>
                    <p>{task.assignee}</p>
                    {task.photo && <img src={task.photo} alt="Task" />}
                  </div>
                </Draggable>
              ))}
            </Droppable>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export default BoardPage;
