import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Register from './components/Register';
import HomePage from './components/Dashboard';
import './App.css';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const authToken = localStorage.getItem('authToken');
  return authToken ? children : <Navigate to="/" replace />;
};

// Dashboard
const Dashboard = () => {
  const navigate = useNavigate(); 

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    window.location.href = '/';
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const username = user?.name || user?.email || 'User';

  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 1500); // 1.5 sec

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome to Your Portfolio, {username}!</h1>
        <p>You have successfully logged in.</p>
        <p>Redirecting to your home page...</p>

        {user && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px'
          }}>
            <h3>Your Account Details:</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.userId}</p>
            <p><strong>Name:</strong> {user.name}</p>
          </div>
        )}

        <button onClick={handleLogout} className="logout-button" style={{ marginTop: '20px' }}>
          Logout
        </button>
      </div>
    </div>
  );
};

// App
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Dashboard transfter） */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* HomePage */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;