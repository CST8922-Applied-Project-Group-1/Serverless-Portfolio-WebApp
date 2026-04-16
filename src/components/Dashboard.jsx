import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const HomePage = () => {
  const navigate = useNavigate();

  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const username = userData?.name || 'User';
  const email = userData?.email || 'No email available';

  const menuItems = [
    {
      title: 'My Profile',
      description: 'Create or update your professional profile, skills, and experience.',
      action: 'Open Profile',
      route: '/profile'
    },
    {
      title: 'Find People',
      description: 'Search professionals by name, bio, skills, or experience.',
      action: 'Search Users',
      route: '/search-users'
    },
    {
      title: 'Manage Connections',
      description: 'Review incoming requests, outgoing requests, and accepted connections.',
      action: 'Manage Network',
      route: '/manage-connections'
    },
    {
      title: 'Messages',
      description: 'View conversations, start new chats, and stay in touch with your network.',
      action: 'Open Messages',
      route: '/messages'
    }
  ];

  const quickStats = [
    { label: 'Profile', value: 'Ready to update' },
    { label: 'Network', value: 'Grow connections' },
    { label: 'Messages', value: 'Stay connected' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="dashboard-user-card">
            <div className="dashboard-avatar">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{username}</h2>
              <p>{email}</p>
            </div>
          </div>

          <div className="dashboard-nav-section">
            <h3 className="dashboard-section-title">Workspace</h3>

            {menuItems.map((item) => (
              <button
                key={item.title}
                type="button"
                className="dashboard-nav-card"
                onClick={() => navigate(item.route)}
              >
                <span className="dashboard-nav-card-title">{item.title}</span>
                <span className="dashboard-nav-card-text">{item.description}</span>
              </button>
            ))}
          </div>

          <button className="dashboard-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main className="dashboard-main">
          <section className="dashboard-hero">
            <div>
              <p className="dashboard-eyebrow">Professional Networking Platform</p>
              <h1>Welcome back, {username}</h1>
              <p className="dashboard-hero-text">
                Manage your profile, expand your network, and keep your conversations organized
                from one clean workspace.
              </p>
            </div>

            <div className="dashboard-hero-actions">
              <button type="button" className="primary-btn" onClick={() => navigate('/profile')}>
                Update Profile
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate('/search-users')}
              >
                Find People
              </button>
            </div>
          </section>

          <section className="dashboard-stats-grid">
            {quickStats.map((stat) => (
              <div key={stat.label} className="dashboard-stat-card">
                <span className="dashboard-stat-label">{stat.label}</span>
                <strong className="dashboard-stat-value">{stat.value}</strong>
              </div>
            ))}
          </section>

          <section className="dashboard-content-grid">
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2>Getting Started</h2>
                <span>Recommended</span>
              </div>

              <div className="dashboard-checklist">
                <div className="dashboard-checklist-item">
                  <div className="dashboard-checklist-badge">1</div>
                  <div>
                    <h4>Complete your profile</h4>
                    <p>Add your bio, skills, and experience so others can discover you.</p>
                  </div>
                </div>

                <div className="dashboard-checklist-item">
                  <div className="dashboard-checklist-badge">2</div>
                  <div>
                    <h4>Connect with users</h4>
                    <p>Search professionals and send connection requests to grow your network.</p>
                  </div>
                </div>

                <div className="dashboard-checklist-item">
                  <div className="dashboard-checklist-badge">3</div>
                  <div>
                    <h4>Start conversations</h4>
                    <p>Use messaging to introduce yourself and build meaningful connections.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2>Quick Access</h2>
                <span>Tools</span>
              </div>

              <div className="dashboard-actions-grid">
                <button
                  type="button"
                  className="dashboard-action-tile"
                  onClick={() => navigate('/profile')}
                >
                  <h4>Profile</h4>
                  <p>Edit your professional information.</p>
                </button>

                <button
                  type="button"
                  className="dashboard-action-tile"
                  onClick={() => navigate('/search-users')}
                >
                  <h4>Search</h4>
                  <p>Find people by skills or experience.</p>
                </button>

                <button
                  type="button"
                  className="dashboard-action-tile"
                  onClick={() => navigate('/manage-connections')}
                >
                  <h4>Connections</h4>
                  <p>Review requests and accepted contacts.</p>
                </button>

                <button
                  type="button"
                  className="dashboard-action-tile"
                  onClick={() => navigate('/messages')}
                >
                  <h4>Messages</h4>
                  <p>Read and send messages instantly.</p>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
