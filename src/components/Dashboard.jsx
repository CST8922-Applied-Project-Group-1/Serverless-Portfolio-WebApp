import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const HomePage = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user'));
  const username = userData?.name || 'User';
  const email = userData?.email || 'No email available';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    navigate('/');
  };

  return (
    <div className="home-page">
      <div className="home-layout">
        <aside className="sidebar">
          <div className="user-info-card">
            <h2>{username}</h2>
            <p>{email}</p>
          </div>

          <h2 className="sidebar-title">Menu</h2>

          <div className="sidebar-card">
            <h3>Create Profile</h3>
            <p>Add your personal and professional information.</p>
          </div>

          <div className="sidebar-card">
            <h3>Search Users</h3>
            <p>Find other users by name or professional interests.</p>
          </div>

          <div className="sidebar-card">
            <h3>Manage Connections</h3>
            <p>Build and maintain your professional network.</p>
          </div>

          <div className="sidebar-card" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <h3>Create Profile</h3>
            <p>Add your personal and professional information.</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main className="main-content">
          <div className="welcome-box">
            <h1>Welcome, {username}</h1>
            <p>This is your professional networking home page.</p>
          </div>

          <div className="content-box">
            <h2>Profile Overview</h2>
            <p>
              This section will display the user’s profile summary, education,
              work experience, and skills after the profile is created.
            </p>
          </div>

          <div className="content-box">
            <h2>Search Users</h2>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or skill"
            />
            <p className="search-note">
              Search results can be displayed here after connecting the API and database.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;