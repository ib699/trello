import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import TaskColumn from './TaskColumn';

function BoardPage({ boardId }) {
  const [board, setBoard] = useState(null);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await axios.get(`/api/boards/${boardId}`);
        setBoard(response.data);
      } catch (err) {
        toast.error('Failed to fetch board.');
      }
    };

    fetchBoard();

    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'online-status') {
        setOnlineStatus(data.status);
      }
    };

    return () => {
      ws.close();
    };
  }, [boardId]);

  const searchUsers = async () => {
    try {
      const response = await axios.get(`/api/users?username=${newMemberUsername}`);
      setFoundUsers(response.data);
    } catch (err) {
      toast.error('Failed to search users.');
    }
  };

  const addMember = async (user) => {
    try {
      await axios.post(`/api/boards/${boardId}/members`, { userId: user.id });
      setBoard({ ...board, members: [...board.members, user] });
      toast.success('Member added successfully.');
    } catch (err) {
      toast.error('Failed to add member.');
    }
  };

  const removeMember = async (userId) => {
    try {
      await axios.delete(`/api/boards/${boardId}/members/${userId}`);
      setBoard({ ...board, members: board.members.filter(member => member.id !== userId) });
      toast.success('Member removed successfully.');
    } catch (err) {
      toast.error('Failed to remove member.');
    }
  };

  const changeRole = async (userId, role) => {
    try {
      await axios.patch(`/api/boards/${boardId}/members/${userId}`, { role });
      setBoard({
        ...board,
        members: board.members.map(member =>
          member.id === userId ? { ...member, role } : member
        ),
      });
      toast.success('Role updated successfully.');
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  return (
    <div className="board-page">
      {board && (
        <>
          <h2>{board.title}</h2>
          <p>{board.description}</p>
          <h3>Members</h3>
          <ul>
            {board.members.map(member => (
              <li key={member.id}>
                {member.username} - {member.role} - {onlineStatus[member.id] ? 'Online' : 'Offline'}
                <button onClick={() => removeMember(member.id)}>Remove</button>
                {member.role !== 'admin' && (
                  <button onClick={() => changeRole(member.id, 'admin')}>Make Admin</button>
                )}
                {member.role === 'admin' && (
                  <button onClick={() => changeRole(member.id, 'member')}>Demote</button>
                )}
              </li>
            ))}
          </ul>
          <input
            type="text"
            placeholder="Search Users"
            value={newMemberUsername}
            onChange={(e) => setNewMemberUsername(e.target.value)}
          />
          <button onClick={searchUsers}>Search</button>
          <ul>
            {foundUsers.map(user => (
              <li key={user.id}>
                {user.username} <button onClick={() => addMember(user)}>Add</button>
              </li>
            ))}
          </ul>
          <div className="task-columns">
            <TaskColumn status="todo" boardId={boardId} />
            <TaskColumn status="in-progress" boardId={boardId} />
            <TaskColumn status="done" boardId={boardId} />
          </div>
        </>
      )}
    </div>
  );
}

export default BoardPage;
