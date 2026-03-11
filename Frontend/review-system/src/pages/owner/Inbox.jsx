import React, { useState, useEffect, useCallback } from 'react';
import { fetchMySupportMessages, sendSupportMessage } from '../../services/api';
import { FaInbox, FaPaperPlane, FaSpinner, FaComments, FaPaperclip } from 'react-icons/fa';

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds >= 86400) return Math.floor(seconds / 86400) + 'd ago';
  if (seconds >= 3600) return Math.floor(seconds / 3600) + 'h ago';
  if (seconds >= 60) return Math.floor(seconds / 60) + 'm ago';
  return 'just now';
};

const Inbox = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchMySupportMessages();
      setData(res);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    if (!messageText.trim() || messageText.length < 5) return;
    setSending(true);
    try {
      await sendSupportMessage(messageText.trim(), attachment || undefined);
      setMessageText('');
      setAttachment(null);
      loadMessages();
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const messages = data?.messages || [];

  return (
    <div style={styles.page}>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <header style={styles.header}>
        <h1 style={styles.title}>Support Inbox</h1>
        <p style={styles.subtitle}>Message the admin about complaints or business issues. You'll see replies here.</p>
      </header>
      <main style={styles.main}>
        {loading ? (
          <div style={styles.loader}><FaSpinner className="spin" /> Loading...</div>
        ) : (
          <div style={styles.chatBox}>
            <div style={styles.messagesList}>
              {messages.length === 0 ? (
                <div style={styles.empty}>
                  <FaComments size={48} />
                  <p>No messages yet. Start a conversation by sending a message below.</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} style={{ ...styles.bubble, ...(m.is_from_me ? styles.bubbleMe : styles.bubbleAdmin) }}>
                    <span style={styles.sender}>{m.is_from_me ? 'You' : 'Admin'}</span>
                    <p style={styles.msgText}>{m.message}</p>
                    {m.attachment_url && (
                      <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={styles.attachmentLink}>
                        <FaPaperclip /> View attachment
                      </a>
                    )}
                    <span style={styles.time}>{formatRelativeTime(m.created_at)}</span>
                  </div>
                ))
              )}
            </div>
            <div style={styles.inputArea}>
              <textarea
                placeholder="Type your message (min 5 characters)..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                style={styles.textarea}
                rows={3}
              />
              <div style={styles.attachRow}>
                <label style={styles.fileLabel}>
                  <input type="file" onChange={e => setAttachment(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  <FaPaperclip /> {attachment ? attachment.name : 'Attach file (optional)'}
                </label>
              </div>
              <button
                style={styles.sendBtn}
                onClick={handleSend}
                disabled={messageText.trim().length < 5 || sending}
              >
                {sending ? <FaSpinner className="spin" /> : <FaPaperPlane />}
                Send
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' },
  header: { padding: '2rem 2.5rem', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)' },
  title: { fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--header-text)', margin: '0 0 0.25rem 0' },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-color)', opacity: 0.8, margin: 0 },
  main: { flex: 1, padding: '2rem 2.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' },
  loader: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '1rem' },
  chatBox: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '400px' },
  messagesList: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem', color: '#9CA3AF', textAlign: 'center' },
  bubble: { padding: '1rem', borderRadius: '12px', maxWidth: '85%' },
  bubbleMe: { backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', alignSelf: 'flex-end' },
  bubbleAdmin: { backgroundColor: 'var(--hero-bg)', border: '1px solid var(--card-border)', alignSelf: 'flex-start' },
  sender: { fontSize: '0.8rem', fontWeight: '600', color: 'var(--header-text)', display: 'block', marginBottom: '0.25rem' },
  msgText: { margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 },
  time: { fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem', display: 'block' },
  inputArea: { padding: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  textarea: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', resize: 'vertical' },
  sendBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: 'var(--button-bg)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-end' },
  attachRow: { display: 'flex', alignItems: 'center' },
  fileLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--button-bg)', cursor: 'pointer', opacity: 0.9 },
  attachmentLink: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', color: 'var(--button-bg)', fontSize: '0.9rem' },
};

export default Inbox;
