import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function BoardCreationPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);

  const searchUsers = async () => {
    try {
      const response = await axios.get(`/api/users?username=${searchTerm}`);
      setFoundUsers(response.data);
    } catch (err) {
      toast.error('Failed to search users.');
    }
  };

  const addMember = (user) => {
    if (!members.find(member => member.id === user.id)) {
      setMembers([...members, user]);
    }
  };

  const removeMember = (userId) => {
    setMembers(members.filter(member => member.id !== userId));
  };

  const createBoard = async () => {
    try {
      const response = await axios.post('/api/boards', {
        title,
        description,
        members: members.map(member => member.id),
      });
      toast.success('Board created successfully.');
      // Redirect to the newly created board
    } catch (err) {
      toast.error('Failed to create board.');
    }
  };

  return (
    <div className="board-creation-page">
      <h2>Create a New Board</h2>
      <div>
        <input
          type="text"
          placeholder="Board Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <textarea
          placeholder="Board Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Search Users"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={searchUsers}>Search</button>
      </div>
      <ul>
        {foundUsers.map(user => (
          <li key={user.id}>
            {user.username} <button onClick={() => addMember(user)}>Add</button>
          </li>
        ))}
      </ul>
      <h3>Board Members</h3>
      <ul>
        {members.map(member => (
          <li key={member.id}>
            {member.username} <button onClick={() => removeMember(member.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={createBoard}>Create Board</button>
    </div>
  );
}

export default BoardCreationPage;
