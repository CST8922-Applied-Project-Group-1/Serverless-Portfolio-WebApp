import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnectionsSummary, respondToConnection } from '../services/api';
import '../styles/ManageConnectionsPage.css';

const ManageConnectionsPage = () => {
  const navigate = useNavigate();

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await getConnectionsSummary();

      if (result.error) {
        setError(result.error);
        setIncoming([]);
        setOutgoing([]);
        setAccepted([]);
      } else {
        setIncoming(result.incoming || []);
        setOutgoing(result.outgoing || []);
        setAccepted(result.accepted || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load connection data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (connectionId, action) => {
    setProcessingId(connectionId);
    setError('');
    setSuccessMessage('');

    try {
      const result = await respondToConnection({ connectionId, action });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage(
          action === 'accepted'
            ? 'Connection request accepted.'
            : 'Connection request denied.'
        );
        await loadConnections();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to process connection request.');
    } finally {
      setProcessingId(null);
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

  const getDisplayName = (item) => {
    return item.Name || item.name || `User #${item.UserId || item.userId}`;
  };

  const getDisplayEmail = (item) => {
    return item.Email || item.email || 'Email not available';
  };

  const getDisplayBio = (item) => {
    return item.Bio || item.bio || 'This user has not added a bio yet.';
  };

  const getDisplayExperience = (item) => {
    return item.Experience || item.experience || '';
  };

  const getDisplaySkills = (item) => {
    return formatSkills(item.Skills || item.skills || '');
  };

  const renderCard = (item, type) => {
    const userId = item.UserId || item.userId;
    const connectionId = item.ConnectionId || item.connectionId;

    const name = getDisplayName(item);
    const email = getDisplayEmail(item);
    const bio = getDisplayBio(item);
    const experience = getDisplayExperience(item);
    const skills = getDisplaySkills(item);

    return (
      <div key={`${type}-${connectionId}-${userId}`} className="connection-card">
        <div className="connection-card-top">
          <div className="connection-avatar">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="connection-card-identity">
            <h3>{name}</h3>
            <p>{email}</p>
          </div>
        </div>

        <div className="connection-card-content">
          <div className="connection-card-section">
            <h4>Bio</h4>
            <p>{bio}</p>
          </div>

          {skills && (
            <div className="connection-card-section">
              <h4>Skills</h4>
              <p>{skills}</p>
            </div>
          )}

          {experience && (
            <div className="connection-card-section">
              <h4>Experience</h4>
              <p>{experience}</p>
            </div>
          )}
        </div>

        <div className="connection-card-actions">
          <button
            type="button"
            className="view-profile-button"
            onClick={() => navigate(`/users/${userId}/profile`)}
          >
            View Profile
          </button>

          {type === 'incoming' && (
            <>
              <button
                type="button"
                className="accept-button"
                disabled={processingId === connectionId}
                onClick={() => handleRespond(connectionId, 'accepted')}
              >
                {processingId === connectionId ? 'Processing...' : 'Accept'}
              </button>

              <button
                type="button"
                className="deny-button"
                disabled={processingId === connectionId}
                onClick={() => handleRespond(connectionId, 'rejected')}
              >
                {processingId === connectionId ? 'Processing...' : 'Deny'}
              </button>
            </>
          )}

          {type === 'outgoing' && (
            <span className="status-badge pending">Pending</span>
          )}

          {type === 'accepted' && (
            <span className="status-badge connected">Connected</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="manage-connections-page">
      <div className="manage-connections-shell">
        <div className="manage-connections-header">
          <button
            className="manage-connections-back-link"
            onClick={() => navigate('/home')}
          >
            ←
          </button>
          <div>
            <h1>Manage Connections</h1>
            <p>Review requests, monitor pending invitations, and browse your network.</p>
          </div>
        </div>

        {error && <div className="manage-connections-message error">{error}</div>}
        {successMessage && (
          <div className="manage-connections-message success">{successMessage}</div>
        )}

        {loading ? (
          <div className="manage-connections-empty">Loading connections...</div>
        ) : (
          <div className="manage-connections-sections">
            <section className="connection-section">
              <h2>Incoming Requests</h2>
              {incoming.length === 0 ? (
                <div className="manage-connections-empty compact">
                  No incoming requests.
                </div>
              ) : (
                <div className="connection-grid">
                  {incoming.map((item) => renderCard(item, 'incoming'))}
                </div>
              )}
            </section>

            <section className="connection-section">
              <h2>Outgoing Requests</h2>
              {outgoing.length === 0 ? (
                <div className="manage-connections-empty compact">
                  No outgoing requests.
                </div>
              ) : (
                <div className="connection-grid">
                  {outgoing.map((item) => renderCard(item, 'outgoing'))}
                </div>
              )}
            </section>

            <section className="connection-section">
              <h2>Connected Users</h2>
              {accepted.length === 0 ? (
                <div className="manage-connections-empty compact">
                  No accepted connections yet.
                </div>
              ) : (
                <div className="connection-grid">
                  {accepted.map((item) => renderCard(item, 'accepted'))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageConnectionsPage;
