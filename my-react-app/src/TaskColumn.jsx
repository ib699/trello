import React from 'react';
import TaskCard from './TaskCard';

function TaskColumn({ title, tasks, onTaskUpdated, onTaskDeleted }) {
  return (
    <div className="task-column">
      <h3>{title}</h3>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={onTaskDeleted}
        />
      ))}
    </div>
  );
}

export default TaskColumn;
