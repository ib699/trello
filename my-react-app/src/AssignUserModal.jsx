import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import axios from 'axios';

function AssignUserModal({ isOpen, onClose, taskId, boardId, onAssign }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/boards/${boardId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = [
          ...response.data.admins.map(username => ({ username, role: 'admin' })),
          ...response.data.members.map(username => ({ username, role: 'member' }))
        ];
        setUsers(usersData);
      } catch (err) {
        toast.error('Failed to fetch users.');
      }
    };

    fetchUsers();
  }, [boardId]);

  const handleAssign = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/assignees`,
        { assignees: selectedUsers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAssign(taskId, selectedUsers);
      toast.success('Users assigned successfully.');
      onClose();
    } catch (err) {
      toast.error('Failed to assign users.');
    }
  };

  const handleRemove = async (username) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/tasks/${taskId}/assignees/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedUsers(selectedUsers.filter(user => user !== username));
      toast.success(`User ${username} removed successfully.`);
    } catch (err) {
      toast.error(`Failed to remove user ${username}.`);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      <h2>Assign Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.username}>
            <label>
              <input
                type="checkbox"
                value={user.username}
                checked={selectedUsers.includes(user.username)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedUsers(prev =>
                    checked ? [...prev, user.username] : prev.filter(u => u !== user.username)
                  );
                }}
              />
              {user.username} ({user.role}) {user.photo && <img src={user.photo} alt={user.username} />}
              <button onClick={() => handleRemove(user.username)}>Remove</button>
            </label>
          </li>
        ))}
      </ul>
      <button onClick={handleAssign}>Assign</button>
      <button onClick={onClose}>Close</button>
    </Modal>
  );
}

export default AssignUserModal;
