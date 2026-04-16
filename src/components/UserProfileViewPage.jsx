import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserProfileById } from '../services/api';
import '../styles/UserProfileViewPage.css';

const UserProfileViewPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getUserProfileById(userId);

      if (result.error) {
        setError(result.error);
        setProfile(null);
      } else {
        setProfile(result);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load profile.');
      setProfile(null);
    } finally {
      setLoading(false);
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

  return (
    <div className="user-profile-view-page">
      <div className="user-profile-view-card">
        <div className="user-profile-view-header">
          <button className="user-profile-view-back-link" onClick={() => navigate('/manage-connections')}>
            ←
          </button>
          <div>
            <h1>User Profile</h1>
            <p>Review profile information before responding to a request.</p>
          </div>
        </div>

        {loading ? (
          <div className="user-profile-view-empty">Loading profile...</div>
        ) : error ? (
          <div className="user-profile-view-message error">{error}</div>
        ) : profile ? (
          <>
            <div className="user-profile-hero">
              <div className="user-profile-avatar">
                {(profile.Name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{profile.Name}</h2>
                <p>{profile.Email}</p>
              </div>
            </div>

            {profile.Bio && (
              <div className="user-profile-section">
                <h3>Bio</h3>
                <p>{profile.Bio}</p>
              </div>
            )}

            {profile.Skills && (
              <div className="user-profile-section">
                <h3>Skills</h3>
                <p>{formatSkills(profile.Skills)}</p>
              </div>
            )}

            {profile.Experience && (
              <div className="user-profile-section">
                <h3>Experience</h3>
                <p>{profile.Experience}</p>
              </div>
            )}
          </>
        ) : (
          <div className="user-profile-view-empty">No profile found.</div>
        )}
      </div>
    </div>
  );
};

export default UserProfileViewPage;
