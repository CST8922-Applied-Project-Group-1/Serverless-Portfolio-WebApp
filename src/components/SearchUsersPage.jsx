import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchUsers, createConnection } from '../services/api';
import '../styles/SearchUsersPage.css';

const SearchUsersPage = () => {
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUsers('');
  }, []);

  const loadUsers = async (searchValue) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await searchUsers(searchValue);

      if (result.error) {
        setError(result.error);
        setUsers([]);
      } else {
        setUsers(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadUsers(query);
  };

  const handleConnect = async (userId) => {
    setConnectingId(userId);
    setError('');
    setSuccessMessage('');

    try {
      const result = await createConnection({ connectedUserId: userId });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Connection request sent successfully.');

        setUsers((prev) =>
          prev.map((user) =>
            Number(user.UserId || user.userId) === Number(userId)
              ? {
                  ...user,
                  ConnectionStatus: 'pending',
                  connectionStatus: 'pending',
                  RequestedBy: Number(currentUser.userId),
                  requestedBy: Number(currentUser.userId)
                }
              : user
          )
        );
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create connection.');
    } finally {
      setConnectingId(null);
    }
  };

  const formatSkills = (skills) => {
    try {
      if (!skills) return '';
      if (Array.isArray(skills)) return skills.join(', ');

      if (typeof skills === 'string') {
        const parsed = JSON.parse(skills);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      }

      return skills;
    } catch {
      return skills || '';
    }
  };

  const getConnectionState = (user) => {
    const status = user.ConnectionStatus || user.connectionStatus || null;
    const requestedBy = Number(user.RequestedBy || user.requestedBy || 0);
    const currentUserId = Number(currentUser.userId);

    if (!status) return 'none';

    const normalized = String(status).toLowerCase();

    if (normalized === 'accepted') {
      return 'accepted';
    }

    if (normalized === 'pending') {
      if (requestedBy === currentUserId) {
        return 'sent';
      }
      return 'pending';
    }

    if (normalized === 'rejected') {
      return 'none';
    }

    return 'none';
  };

  const getButtonConfig = (userId, state) => {
    if (Number(userId) === Number(currentUser.userId)) {
      return {
        label: 'This is you',
        className: 'connect-button self',
        disabled: true
      };
    }

    if (connectingId === userId) {
      return {
        label: 'Sending...',
        className: 'connect-button loading',
        disabled: true
      };
    }

    switch (state) {
      case 'accepted':
        return {
          label: 'Connected',
          className: 'connect-button connected',
          disabled: true
        };
      case 'sent':
        return {
          label: 'Request Sent',
          className: 'connect-button sent',
          disabled: true
        };
      case 'pending':
        return {
          label: 'Pending Approval',
          className: 'connect-button pending',
          disabled: true
        };
      default:
        return {
          label: 'Connect',
          className: 'connect-button',
          disabled: false
        };
    }
  };

  return (
    <div className="search-users-page">
      <div className="search-users-shell">
        <div className="search-users-header">
          <button className="search-users-back-link" onClick={() => navigate('/home')}>
            ←
          </button>
          <div>
            <h1>Find People</h1>
            <p>Search professionals, review profiles, and grow your network.</p>
          </div>
        </div>

        <form className="search-users-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by name, email, bio, skills, or experience"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {error && <div className="search-users-message error">{error}</div>}
        {successMessage && <div className="search-users-message success">{successMessage}</div>}

        {loading ? (
          <div className="search-users-empty">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="search-users-empty">No users found.</div>
        ) : (
          <div className="search-users-grid">
            {users.map((user) => {
              const userId = user.UserId || user.userId;
              const name = user.Name || user.name || 'Unknown User';
              const email = user.Email || user.email || '';
              const bio = user.Bio || user.bio || '';
              const experience = user.Experience || user.experience || '';
              const skills = formatSkills(user.Skills || user.skills);

              const state = getConnectionState(user);
              const buttonConfig = getButtonConfig(userId, state);

              return (
                <div key={userId} className="user-card">
                  <div className="user-card-top">
                    <div className="user-avatar">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="user-card-identity">
                      <h3>{name}</h3>
                      <p>{email}</p>

                      {state !== 'none' && (
                        <span className={`connection-state-badge ${state}`}>
                          {state === 'accepted' && 'Connected'}
                          {state === 'sent' && 'Request Sent'}
                          {state === 'pending' && 'Pending Approval'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="user-card-content">
                    {bio && (
                      <div className="user-card-section">
                        <h4>Bio</h4>
                        <p>{bio}</p>
                      </div>
                    )}

                    {skills && (
                      <div className="user-card-section">
                        <h4>Skills</h4>
                        <p>{skills}</p>
                      </div>
                    )}

                    {experience && (
                      <div className="user-card-section">
                        <h4>Experience</h4>
                        <p>{experience}</p>
                      </div>
                    )}
                  </div>

                  <div className="user-card-actions">
                    <button
                      type="button"
                      className="view-profile-button"
                      onClick={() => navigate(`/users/${userId}/profile`)}
                    >
                      View Profile
                    </button>

                    <button
                      type="button"
                      className={buttonConfig.className}
                      disabled={buttonConfig.disabled}
                      onClick={() => handleConnect(userId)}
                    >
                      {buttonConfig.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsersPage;
