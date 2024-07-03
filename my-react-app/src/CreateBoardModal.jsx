import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function CreateBoardModal({ isOpen, onClose, onBoardCreated }) {
  const [boardName, setBoardName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllUsers(response.data);
      } catch (err) {
        toast.error('Failed to fetch users.');
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddMember = (username) => {
    if (!members.includes(username)) {
      setMembers([...members, username]);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/boards', {
        name: boardName,
        description,
        members
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onBoardCreated(response.data);
      onClose();
    } catch (err) {
      toast.error('Failed to create board.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <h2>Create Board</h2>
      <input
        type="text"
        placeholder="Board Name"
        value={boardName}
        onChange={(e) => setBoardName(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea>
      <input
        type="text"
        placeholder="Search users"
        value={searchQuery}
        onChange={handleSearch}
      />
      <ul>
        {allUsers
          .filter(user => user.includes(searchQuery))
          .map(user => (
            <li key={user}>
              {user} <button onClick={() => handleAddMember(user)}>Add</button>
            </li>
          ))}
      </ul>
      <div>
        <h4>Members</h4>
        <ul>
          {members.map(member => (
            <li key={member}>{member}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleCreateBoard}>Create Board</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default CreateBoardModal;
