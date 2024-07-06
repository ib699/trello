import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom

function UserProfilePage() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve JWT token from localStorage
        const response = await axios.get('http://localhost:5000/getProfile', {
          headers: { Authorization: `Bearer ${token}` } // Attach JWT token to headers
        });
        setUser(response.data);
      } catch (err) {
        toast.error('Failed to fetch user profile.');
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve JWT token from localStorage
      const response = await axios.post('http://localhost:5000/api/user/logout');
      toast.success('Logged out successfully.');
      navigate('/login'); // Redirect to login page
    } catch (err) {
      toast.error('Failed to logout.');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve JWT token from localStorage
      await axios.delete('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` } // Attach JWT token to headers
      });
      toast.success('Account deleted successfully.');
      navigate('/signup'); // Redirect to signup page
    } catch (err) {
      toast.error('Failed to delete account.');
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setUpdatedUser({ username: user.username, email: user.email, password: '' });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve JWT token from localStorage
      await axios.put('http://localhost:5000/api/user/profile', updatedUser, {
        headers: { Authorization: `Bearer ${token}` } // Attach JWT token to headers
      });
      setUser({ ...user, ...updatedUser, password: undefined }); // Update user state without exposing the password
      setEditing(false);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error('Failed to update profile.');
    }
  };

  const handleTasks = () => {
    navigate('/tasks'); // Navigate to the tasks page
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-profile-page">
      <h2>User Profile</h2>
      <div>
        <strong>Username:</strong> {editing ? <input value={updatedUser.username} onChange={(e) => setUpdatedUser({ ...updatedUser, username: e.target.value })} /> : user.username}
      </div>
      <div>
        <strong>Email:</strong> {editing ? <input value={updatedUser.email} onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })} /> : user.email}
      </div>
      <div>
        <strong>Membership Date:</strong> {user.membershipDate}
      </div>
      {editing && (
        <div>
          <strong>Password:</strong> <input type="password" value={updatedUser.password} onChange={(e) => setUpdatedUser({ ...updatedUser, password: e.target.value })} />
        </div>
      )}
      <div>
        {editing ? <button onClick={handleSave}>Save</button> : <button onClick={handleEdit}>Edit Profile</button>}
        <button onClick={handleLogout}>Logout</button>
        <button onClick={handleDelete}>Delete Account</button>
        <button onClick={handleTasks}>View Tasks</button>
      </div>
    </div>
  );
}

export default UserProfilePage;
