import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, createProfile, updateProfile } from '../services/api';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    bio: '',
    skills: '',
    experience: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();

    if (data && !data.error) {
  setProfileExists(true);

  const formatSkills = (skills) => {
    try {
      if (!skills) return '';

      // Already array
      if (Array.isArray(skills)) {
        return skills.join(', ');
      }

      // JSON string → parse it
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

  setForm({
    name: data.Name || '',
    bio: data.Bio || '',
    skills: formatSkills(data.Skills),
    experience: data.Experience || ''
  });
}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!form.bio.trim()) {
      newErrors.bio = 'Bio is required';
    }

    if (!form.skills.trim()) {
      newErrors.skills = 'Please add at least one skill';
    }

    if (!form.experience.trim()) {
      newErrors.experience = 'Experience is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    if (errors[e.target.name]) {
      setErrors((prev) => ({
        ...prev,
        [e.target.name]: ''
      }));
    }

    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setMessage('');
    setMessageType('');

    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim(),
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      experience: form.experience.trim()
    };

    try {
      const result = profileExists
        ? await updateProfile(payload)
        : await createProfile(payload);

      if (result.error) {
        setMessage(result.error);
        setMessageType('error');
      } else {
        setMessage(profileExists ? 'Profile updated successfully.' : 'Profile created successfully.');
        setMessageType('success');
        setProfileExists(true);
        loadProfile();
      }
    } catch (error) {
      console.error(error);
      setMessage('Something went wrong while saving your profile.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <button className="profile-back-link" onClick={() => navigate('/home')}>
            ←
          </button>
          <h1>{profileExists ? 'Edit Profile' : 'Create Profile'}</h1>
          <p>
            {profileExists
              ? 'Keep your professional information up to date.'
              : 'Build your professional profile to get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {message && (
            <div className={`profile-message ${messageType === 'error' ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="bio">Professional Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className={errors.bio ? 'error' : ''}
              placeholder="Write a short professional summary"
              rows="4"
            />
            {errors.bio && <span className="field-error">{errors.bio}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              className={errors.skills ? 'error' : ''}
              placeholder="React, Node.js, Azure, SQL"
            />
            {errors.skills && <span className="field-error">{errors.skills}</span>}
            <small className="helper-text">Separate each skill with a comma.</small>
          </div>

          <div className="form-group">
            <label htmlFor="experience">Experience</label>
            <textarea
              id="experience"
              name="experience"
              value={form.experience}
              onChange={handleChange}
              className={errors.experience ? 'error' : ''}
              placeholder="Describe your work experience and technical background"
              rows="5"
            />
            {errors.experience && <span className="field-error">{errors.experience}</span>}
          </div>

          <button type="submit" className="profile-button" disabled={saving}>
            {saving
              ? (profileExists ? 'Updating profile...' : 'Creating profile...')
              : (profileExists ? 'Update Profile' : 'Create Profile')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
