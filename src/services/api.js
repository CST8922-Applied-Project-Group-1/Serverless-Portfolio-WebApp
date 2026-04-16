const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7071/api';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function parseResponse(res, fallbackMessage) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return { error: text || fallbackMessage };
  }
}

export async function getMyProfile() {
  const res = await fetch(`${API_BASE_URL}/profile/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return parseResponse(res, 'Failed to fetch profile');
}

export async function createProfile(data) {
  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  return parseResponse(res, 'Failed to create profile');
}

export async function updateProfile(data) {
  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  return parseResponse(res, 'Failed to update profile');
}

export async function getConversations() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.userId;

  const res = await fetch(`${API_BASE_URL}/messages/conversations/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return parseResponse(res, 'Failed to fetch conversations');
}

export async function getMessages(otherUserId) {
  const res = await fetch(`${API_BASE_URL}/messages/${otherUserId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return parseResponse(res, 'Failed to fetch messages');
}

export async function sendMessage(payload) {
  const res = await fetch(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  return parseResponse(res, 'Failed to send message');
}

export async function getConnectionsForMessaging() {
  const rawUser = localStorage.getItem('user');
  let user = {};

  try {
    user = rawUser ? JSON.parse(rawUser) : {};
  } catch {
    user = {};
  }

  const userId = Number(user.userId);

  if (!userId) {
    return { error: 'No valid logged-in user found' };
  }

  const res = await fetch(`${API_BASE_URL}/connections/user/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return parseResponse(res, 'Failed to fetch connections');
}

export async function searchUsers(query = '') {
  const res = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return parseResponse(res, 'Failed to search users');
}

export async function createConnection(payload) {
  const res = await fetch(`${API_BASE_URL}/connections`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  return parseResponse(res, 'Failed to create connection');
}

export async function getConnectionsSummary() {
  const res = await fetch(`${API_BASE_URL}/connections/manage`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return parseResponse(res, 'Failed to fetch connections summary');
}

export async function respondToConnection(payload) {
  const res = await fetch(`${API_BASE_URL}/connections/respond`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  return parseResponse(res, 'Failed to respond to connection');
}

export async function getUserProfileById(userId) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return parseResponse(res, 'Failed to fetch user profile');
}