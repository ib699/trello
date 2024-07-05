import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import DashboardPage from './DashboardPage';
import BoardPage from './BoardPage';
import UserProfilePage from './UserProfilePage';
import UserTasksPage from './UserTasksPage';
import BoardCreationPage from './BoardCreationPage';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/board/:boardId" element={<BoardPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/tasks" element={<UserTasksPage />} />
          <Route path="/create-board" element={<BoardCreationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
