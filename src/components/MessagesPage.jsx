import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getConversations,
  getMessages,
  sendMessage
} from '../services/api';
import '../styles/MessagesPage.css';

const MessagesPage = () => {
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [showNewMessagePanel, setShowNewMessagePanel] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      setFilteredConversations(conversations);
      return;
    }

    setFilteredConversations(
      conversations.filter((item) =>
        `${item.name} ${item.email}`.toLowerCase().includes(normalizedSearch)
      )
    );
  }, [search, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const existingIds = new Set(
      conversations.map((c) => Number(c.userId)).filter(Boolean)
    );

    const fallbackUsers = [
      {
        userId: 1,
        name: 'John Doe',
        email: 'john.doe@example.com'
      },
      {
        userId: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com'
      },
      {
        userId: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com'
      },
      {
        userId: 4,
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com'
      }
    ].filter(
      (user) =>
        Number(user.userId) !== Number(currentUser.userId) &&
        !existingIds.has(Number(user.userId))
    );

    setAvailableUsers(fallbackUsers);
  }, [conversations, currentUser.userId]);

  const normalizeConversation = (item) => ({
    userId: item.otherUserId || item.OtherUserId,
    name: item.otherUserName || item.OtherUserName || 'Unknown User',
    email: item.otherUserEmail || item.OtherUserEmail || '',
    profileImageUrl: item.profileImageUrl || item.ProfileImageUrl || '',
    lastMessage: item.lastMessage || item.LastMessage || '',
    lastMessageTime: item.lastMessageTime || item.LastMessageTime || '',
    unreadCount: item.unreadCount || item.UnreadCount || 0
  });

  const normalizeMessage = (item) => ({
    messageId: item.messageId || item.MessageId,
    fromUserId: item.fromUserId || item.FromUserId,
    toUserId: item.toUserId || item.ToUserId,
    content: item.content || item.Content || '',
    sentAt: item.sentAt || item.SentAt,
    isRead: item.isRead || item.IsRead || false
  });

  const loadConversations = async () => {
    setSidebarLoading(true);
    setError('');

    try {
      const result = await getConversations();

      if (result.error) {
        setError(result.error);
        setConversations([]);
        setFilteredConversations([]);
        return;
      }

      const normalized = Array.isArray(result)
        ? result.map(normalizeConversation).filter((item) => item.userId)
        : [];

      setConversations(normalized);
      setFilteredConversations(normalized);

      if (normalized.length > 0) {
        if (selectedUser) {
          const updatedSelected = normalized.find(
            (item) => Number(item.userId) === Number(selectedUser.userId)
          );

          if (updatedSelected) {
            setSelectedUser(updatedSelected);
          }
        } else {
          setSelectedUser(normalized[0]);
          loadMessagesForUser(normalized[0].userId);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load conversations.');
    } finally {
      setSidebarLoading(false);
    }
  };

  const loadMessagesForUser = async (otherUserId) => {
    setChatLoading(true);
    setError('');

    try {
      const result = await getMessages(otherUserId);

      if (result.error) {
        setError(result.error);
        setMessages([]);
        return;
      }

      const normalized = Array.isArray(result)
        ? result.map(normalizeMessage)
        : [];

      setMessages(normalized);
    } catch (err) {
      console.error(err);
      setError('Failed to load messages.');
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectUser = (person) => {
    setSelectedUser(person);
    setShowNewMessagePanel(false);
    loadMessagesForUser(person.userId);
  };

  const handleStartConversation = (person) => {
    setSelectedUser(person);
    setMessages([]);
    setShowNewMessagePanel(false);
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!selectedUser || !messageText.trim()) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const result = await sendMessage({
        toUserId: selectedUser.userId,
        content: messageText.trim()
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      const newMessage = {
        messageId: result.MessageId || result.messageId || Date.now(),
        fromUserId: result.FromUserId || result.fromUserId || currentUser.userId,
        toUserId: result.ToUserId || result.toUserId || selectedUser.userId,
        content: result.Content || result.content || messageText.trim(),
        sentAt: result.SentAt || result.sentAt || new Date().toISOString(),
        isRead: result.IsRead || result.isRead || false
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');

      await loadConversations();
    } catch (err) {
      console.error(err);
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatSidebarTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAvailableUsers = availableUsers.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(userSearch.trim().toLowerCase())
  );

  return (
    <div className="messages-page">
      <div className="messages-shell">
        <aside className="messages-sidebar">
          <div className="messages-sidebar-top">
            <button className="messages-back-link" onClick={() => navigate('/home')}>
              ←
            </button>
            <div className="messages-sidebar-title-block">
              <h1>Messages</h1>
              <p>Stay connected with your network.</p>
            </div>
          </div>

          <div className="messages-sidebar-actions">
            <button
              type="button"
              className="new-message-button"
              onClick={() => setShowNewMessagePanel((prev) => !prev)}
            >
              {showNewMessagePanel ? 'Close' : 'New Message'}
            </button>
          </div>

          {showNewMessagePanel && (
            <div className="new-message-panel">
              <input
                type="text"
                placeholder="Search users to message"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />

              <div className="new-message-user-list">
                {filteredAvailableUsers.length === 0 ? (
                  <div className="messages-empty-state compact">No users found.</div>
                ) : (
                  filteredAvailableUsers.map((user) => (
                    <button
                      key={user.userId}
                      type="button"
                      className="new-message-user-item"
                      onClick={() => handleStartConversation(user)}
                    >
                      <div className="conversation-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="conversation-meta">
                        <div className="conversation-row">
                          <h3>{user.name}</h3>
                        </div>
                        <p>{user.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="messages-search">
            <input
              type="text"
              placeholder="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {sidebarLoading ? (
            <div className="messages-empty-state">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="messages-empty-state">No conversations yet.</div>
          ) : (
            <div className="messages-conversation-list">
              {filteredConversations.map((person) => (
                <button
                  key={person.userId}
                  type="button"
                  className={`conversation-item ${
                    selectedUser?.userId === person.userId ? 'active' : ''
                  }`}
                  onClick={() => handleSelectUser(person)}
                >
                  <div className="conversation-avatar">
                    {person.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  <div className="conversation-meta">
                    <div className="conversation-row">
                      <h3>{person.name}</h3>
                      <span>{formatSidebarTime(person.lastMessageTime)}</span>
                    </div>
                    <p>{person.lastMessage || person.email || 'Start a conversation'}</p>
                  </div>

                  {person.unreadCount > 0 && (
                    <span className="conversation-badge">{person.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="messages-chat-panel">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div className="chat-user">
                  <div className="chat-avatar">
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2>{selectedUser.name}</h2>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {error && <div className="chat-error">{error}</div>}

              <div className="chat-messages">
                {chatLoading ? (
                  <div className="messages-empty-state">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="messages-empty-state">
                    No messages yet. Send the first message to start this conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = Number(msg.fromUserId) === Number(currentUser.userId);

                    return (
                      <div
                        key={msg.messageId}
                        className={`message-row ${isMine ? 'mine' : 'theirs'}`}
                      >
                        <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                          <p>{msg.content}</p>
                          <span>{formatMessageTime(msg.sentAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-compose" onSubmit={handleSend}>
                <textarea
                  placeholder={`Message ${selectedUser.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows="2"
                />
                <button type="submit" disabled={sending || !messageText.trim()}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="messages-empty-panel">
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the left or start a new message.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MessagesPage;
