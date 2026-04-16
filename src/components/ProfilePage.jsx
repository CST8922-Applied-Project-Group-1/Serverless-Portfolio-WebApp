import React, { useEffect, useState } from 'react';
import { getMyProfile, createProfile, updateProfile } from '../services/api';

const ProfilePage = () => {
  const [form, setForm] = useState({
    name: '',
    bio: '',
    skills: '',
    experience: ''
  });
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();

      if (data && !data.error) {
        setProfileExists(true);
        setForm({
          name: data.Name || '',
          bio: data.Bio || '',
          skills: Array.isArray(data.Skills)
            ? data.Skills.join(', ')
            : (data.Skills || ''),
          experience: data.Experience || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const payload = {
      name: form.name,
      bio: form.bio,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      experience: form.experience
    };

    const result = profileExists
      ? await updateProfile(payload)
      : await createProfile(payload);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(profileExists ? 'Profile updated successfully' : 'Profile created successfully');
      setProfileExists(true);
      loadProfile();
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{profileExists ? 'Edit Profile' : 'Create Profile'}</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={handleChange}
        />
        <br /><br />

        <textarea
          name="bio"
          placeholder="Your bio"
          value={form.bio}
          onChange={handleChange}
        />
        <br /><br />

        <input
          type="text"
          name="skills"
          placeholder="Skills separated by commas"
          value={form.skills}
          onChange={handleChange}
        />
        <br /><br />

        <textarea
          name="experience"
          placeholder="Your experience"
          value={form.experience}
          onChange={handleChange}
        />
        <br /><br />

        <button type="submit">
          {profileExists ? 'Update Profile' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;