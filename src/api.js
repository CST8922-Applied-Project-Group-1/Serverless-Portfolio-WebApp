const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7071/api';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

export async function getMyProfile() {
  const res = await fetch(`${API_BASE_URL}/profile/me`, {
    headers: getAuthHeaders()
  });
  return res.json();
}

export async function createProfile(data) {
  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateProfile(data) {
  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function searchUsers(query) {
  const res = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders()
  });
  return res.json();
}