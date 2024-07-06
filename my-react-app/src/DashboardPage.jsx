import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import CreateBoardModal from './CreateBoardModal';

function DashboardPage() {
  const [boards, setBoards] = useState([]);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Token not found, please log in again.');
          navigate('/login');  // Redirect to login page if no token
          return;
        }
        const response = await axios.get('http://localhost:5000/api/boards', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBoards(response.data);
      } catch (err) {
        if (err.response) {
          if (err.response.status === 404 && err.response.data.message === 'No boards found') {
            toast.error('No boards found');
          } else {
            toast.error('Failed to fetch boards.');
          }
        } else {
          toast.error('Failed to fetch boards.');
        }
      }
    };

    fetchBoards();
  }, [navigate]);

  const handleBoardCreated = (newBoard) => {
    setBoards([...boards, newBoard]);
  };

  const handleViewBoard = (boardId) => {
    navigate(`/boards/${boardId}`);
  };

  const handleViewProfile = () => {
    window.location.href = 'http://localhost:5173/profile';
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <button onClick={handleViewProfile}>Profile</button>
      <button onClick={() => setShowCreateBoardModal(true)}>Create Board</button>
      <CreateBoardModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onBoardCreated={handleBoardCreated}
      />
      <div className="boards-list">
        {boards.map(board => (
          <div key={board.id} className="board-item">
            <Board board={board} />
            <button onClick={() => handleViewBoard(board.id)}>View Board</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
