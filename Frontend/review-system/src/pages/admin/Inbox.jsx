import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminContactSubmissions, updateContactSubmissionStatus,
  fetchAdminSupportThreads, fetchAdminThreadMessages, adminReplySupport,
} from '../../services/api';
import {
  FaInbox, FaCheckCircle, FaSpinner, FaSearch, FaEnvelope, FaPaperclip,
  FaExternalLinkAlt, FaComments, FaPaperPlane, FaUser,
} from 'react-icons/fa';

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return 'just now';
};

const SubmissionCard = ({ submission, isActive, onClick }) => {
  const statusColor = submission.status === 'Resolved' ? '#10B981' : '#F97316';
  return (
    <div style={{ ...styles.submissionCard, ...(isActive && styles.submissionCardActive) }} onClick={onClick}>
      <div style={styles.cardHeader}>
        <span style={styles.cardName}>{submission.name}</span>
        <span style={styles.cardTime}>{formatRelativeTime(submission.created_at)}</span>
      </div>
      <p style={styles.cardSubject}>{submission.subject}</p>
      <p style={styles.cardSnippet}>{submission.message?.slice(0, 60)}{(submission.message?.length || 0) > 60 ? '...' : ''}</p>
      <div style={styles.cardFooter}>
        <span style={{ ...styles.statusBadge, backgroundColor: `${statusColor}20`, color: statusColor }}>{submission.status}</span>
      </div>
    </div>
  );
};

const SupportThreadCard = ({ thread, isActive, onClick }) => (
  <div style={{ ...styles.submissionCard, ...(isActive && styles.submissionCardActive) }} onClick={onClick}>
    <div style={styles.cardHeader}>
      <span style={styles.cardName}>{thread.username}</span>
      <span style={styles.cardTime}>{formatRelativeTime(thread.last_at)}</span>
    </div>
    <p style={{ ...styles.cardSubject, textTransform: 'capitalize' }}>{thread.role}</p>
    <p style={styles.cardSnippet}>{thread.last_message}</p>
    {thread.unread_count > 0 && (
      <span style={styles.unreadBadge}>{thread.unread_count} new</span>
    )}
  </div>
);

const EmptyState = ({ message, icon }) => (
  <div style={styles.emptyState}>{icon}<p>{message}</p></div>
);

const Inbox = () => {
  const [activeTab, setActiveTab] = useState('contact'); // 'contact' | 'support'

  // Contact Us state
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Support state
  const [supportLoading, setSupportLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threadMessages, setThreadMessages] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminContactSubmissions();
      setSubmissions(data || []);
      if (data?.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      console.error('Failed to load contact submissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSupportThreads = useCallback(async () => {
    try {
      setSupportLoading(true);
      const data = await fetchAdminSupportThreads();
      setThreads(data || []);
      if (data?.length > 0 && !selectedThreadId) setSelectedThreadId(data[0].id);
    } catch (err) {
      console.error('Failed to load support threads:', err);
    } finally {
      setSupportLoading(false);
    }
  }, []);

  const loadThreadMessages = useCallback(async (tid) => {
    if (!tid) return;
    try {
      const data = await fetchAdminThreadMessages(tid);
      setThreadMessages(data);
    } catch (err) {
      console.error('Failed to load thread messages:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'contact') loadSubmissions();
    else loadSupportThreads();
  }, [activeTab, loadSubmissions, loadSupportThreads]);

  useEffect(() => {
    if (activeTab === 'support' && selectedThreadId) loadThreadMessages(selectedThreadId);
  }, [activeTab, selectedThreadId, loadThreadMessages]);

  const filteredSubmissions = submissions.filter(s => {
    const matchesFilter = filter === 'All' || s.status === filter;
    const matchesSearch = !searchTerm ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.message?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selected = submissions.find(s => s.id === selectedId);
  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const handleMarkResolved = async () => {
    if (!selected) return;
    setUpdatingId(selected.id);
    try {
      await updateContactSubmissionStatus(selected.id, selected.status === 'Resolved' ? 'Open' : 'Resolved');
      setSubmissions(prev => prev.map(s => s.id === selected.id ? { ...s, status: s.status === 'Resolved' ? 'Open' : 'Resolved' } : s));
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendReply = async () => {
    if (!selectedThreadId || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await adminReplySupport(selectedThreadId, replyText.trim());
      setReplyText('');
      loadThreadMessages(selectedThreadId);
      loadSupportThreads();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const isLoading = activeTab === 'contact' ? loading : supportLoading;

  if (isLoading && (activeTab === 'contact' ? submissions.length === 0 : threads.length === 0)) {
    return <div style={styles.loader}><FaSpinner className="spin" /> Loading Inbox...</div>;
  }

  return (
    <div style={styles.pageContainer}>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Inbox</h1>
          <p style={styles.headerSubtitle}>
            {activeTab === 'contact'
              ? 'Contact form submissions from visitors. Reply via their email.'
              : 'Support messages from customers and business owners. Reply in-system.'}
          </p>
        </div>
        <div style={styles.tabBar}>
          <button
            style={activeTab === 'contact' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('contact')}
          >
            <FaEnvelope /> Contact Us
          </button>
          <button
            style={activeTab === 'support' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('support')}
          >
            <FaComments /> Support
          </button>
        </div>
      </header>
      <main style={styles.mainContent}>
        {activeTab === 'contact' && (
          <>
            <div style={styles.filterBar}>
              {['All', 'Open', 'Resolved'].map(f => (
                <button key={f} style={filter === f ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            <div style={styles.inboxGrid}>
              <div style={styles.listCard}>
                <div style={styles.searchBox}>
                  <FaSearch style={styles.searchIcon} />
                  <input type="text" placeholder="Search by name, email, subject..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
                </div>
                <div style={styles.submissionList}>
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map(sub => (
                      <SubmissionCard key={sub.id} submission={sub} isActive={selectedId === sub.id} onClick={() => setSelectedId(sub.id)} />
                    ))
                  ) : (
                    <EmptyState message={`No submissions in "${filter}"`} icon={<FaInbox size={40} />} />
                  )}
                </div>
              </div>
              <div style={styles.detailCard}>
                {selected ? (
                  <>
                    <div style={styles.detailHeader}>
                      <h3 style={styles.detailSubject}>{selected.subject}</h3>
                      <p style={styles.detailMeta}>From <strong>{selected.name}</strong> &lt;{selected.email}&gt; · {formatRelativeTime(selected.created_at)}</p>
                      <span style={{ ...styles.statusBadge, backgroundColor: selected.status === 'Resolved' ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.2)', color: selected.status === 'Resolved' ? '#10B981' : '#F97316' }}>{selected.status}</span>
                    </div>
                    <div style={styles.detailBody}>
                      <div style={styles.messageBox}><p style={styles.messageText}>{selected.message}</p></div>
                      {selected.attachment_url && (
                        <div style={styles.attachmentBox}>
                          <FaPaperclip style={{ marginRight: '0.5rem' }} />
                          <a href={selected.attachment_url} target="_blank" rel="noopener noreferrer" style={styles.attachmentLink}>View attachment <FaExternalLinkAlt size={12} /></a>
                        </div>
                      )}
                      <div style={styles.replyHint}>
                        <FaEnvelope style={{ marginRight: '0.5rem' }} />
                        Reply to this user at: <a href={`mailto:${selected.email}`} style={styles.emailLink}>{selected.email}</a>
                      </div>
                    </div>
                    <div style={styles.detailActions}>
                      <button style={selected.status === 'Resolved' ? styles.resolveBtnOpen : styles.resolveBtn} onClick={handleMarkResolved} disabled={updatingId === selected.id}>
                        {updatingId === selected.id ? <FaSpinner className="spin" /> : <FaCheckCircle />}
                        {selected.status === 'Resolved' ? ' Reopen' : ' Mark Resolved'}
                      </button>
                    </div>
                  </>
                ) : (
                  <EmptyState message="Select a submission to view details." icon={<FaInbox size={50} />} />
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'support' && (
          <>
            <div style={styles.inboxGrid}>
              <div style={styles.listCard}>
                <div style={styles.searchBox}>
                  <FaUser style={styles.searchIcon} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>Customers & Owners</span>
                </div>
                <div style={styles.submissionList}>
                  {threads.length > 0 ? (
                    threads.map(t => (
                      <SupportThreadCard key={t.id} thread={t} isActive={selectedThreadId === t.id} onClick={() => setSelectedThreadId(t.id)} />
                    ))
                  ) : (
                    <EmptyState message="No support threads yet." icon={<FaComments size={40} />} />
                  )}
                </div>
              </div>
              <div style={styles.detailCard}>
                {selectedThread && threadMessages ? (
                  <>
                    <div style={styles.detailHeader}>
                      <h3 style={styles.detailSubject}>{threadMessages.thread?.user} ({threadMessages.thread?.role})</h3>
                      <p style={styles.detailMeta}>{threadMessages.thread?.email}</p>
                    </div>
                    <div style={styles.messagesList}>
                      {threadMessages.messages.map(m => (
                        <div key={m.id} style={{ ...styles.messageBubble, ...(m.is_from_user ? styles.messageBubbleUser : styles.messageBubbleAdmin) }}>
                          <span style={styles.messageSender}>{m.sender_name} {m.is_from_user ? '(User)' : '(Admin)'}</span>
                          <p style={styles.messageText}>{m.message}</p>
                          {m.attachment_url && (
                            <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={styles.attachmentLink}>
                              <FaPaperclip /> View attachment
                            </a>
                          )}
                          <span style={styles.messageTime}>{formatRelativeTime(m.created_at)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={styles.replyForm}>
                      <textarea placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={styles.replyTextarea} rows={3} />
                      <button style={styles.replyBtn} onClick={handleSendReply} disabled={!replyText.trim() || sendingReply}>
                        {sendingReply ? <FaSpinner className="spin" /> : <FaPaperPlane />}
                        Send Reply
                      </button>
                    </div>
                  </>
                ) : (
                  <EmptyState message="Select a thread to view and reply." icon={<FaComments size={50} />} />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const styles = {
  pageContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' },
  header: { padding: '2rem 2.5rem', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
  headerTitle: { fontSize: '2rem', fontWeight: 'bold', color: 'var(--header-text)', margin: '0 0 0.25rem 0' },
  headerSubtitle: { fontSize: '1rem', color: 'var(--text-color)', opacity: 0.8, margin: 0 },
  tabBar: { display: 'flex', gap: '0.5rem' },
  tab: { padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  tabActive: { padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--button-bg)', backgroundColor: 'var(--button-bg)', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  mainContent: { flex: 1, padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' },
  filterBar: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  filterBtn: { padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', cursor: 'pointer' },
  filterBtnActive: { padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--button-bg)', backgroundColor: 'var(--button-bg)', color: 'white', fontWeight: '600', cursor: 'pointer' },
  inboxGrid: { flex: 1, display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '1.5rem', overflow: 'hidden' },
  listCard: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  detailCard: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  searchBox: { position: 'relative', padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  searchIcon: { color: '#9CA3AF', flexShrink: 0 },
  searchInput: { flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' },
  submissionList: { overflowY: 'auto', flex: 1 },
  submissionCard: { padding: '1rem', borderBottom: '1px solid var(--card-border)', borderLeft: '4px solid transparent', cursor: 'pointer', transition: 'background-color 0.2s' },
  submissionCardActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--button-bg)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  cardName: { fontWeight: 'bold', color: 'var(--header-text)' },
  cardTime: { fontSize: '0.8rem', color: '#9CA3AF' },
  cardSubject: { margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--header-text)' },
  cardSnippet: { margin: 0, fontSize: '0.9rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardFooter: { marginTop: '0.75rem' },
  statusBadge: { padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' },
  unreadBadge: { display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', backgroundColor: 'var(--button-bg)', color: 'white' },
  detailHeader: { padding: '1.5rem', borderBottom: '1px solid var(--card-border)', backgroundColor: 'var(--hero-bg)' },
  detailSubject: { margin: 0, fontSize: '1.5rem', color: 'var(--header-text)' },
  detailMeta: { margin: '0.5rem 0 0 0', color: '#6B7280', fontSize: '0.95rem' },
  detailBody: { flex: 1, overflowY: 'auto', padding: '1.5rem' },
  messageBox: { backgroundColor: 'var(--bg-color)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '1rem' },
  messageText: { margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 },
  attachmentBox: { display: 'flex', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--card-border)' },
  attachmentLink: { color: 'var(--button-bg)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' },
  replyHint: { display: 'flex', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '0.95rem' },
  emailLink: { color: 'var(--button-bg)', marginLeft: '0.25rem', fontWeight: '600' },
  detailActions: { padding: '1rem 1.5rem', borderTop: '1px solid var(--card-border)' },
  resolveBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  resolveBtnOpen: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: 'var(--hero-bg)', color: 'var(--text-color)', border: '1px solid var(--card-border)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  messagesList: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  messageBubble: { padding: '1rem', borderRadius: '12px', maxWidth: '85%', alignSelf: 'flex-start' },
  messageBubbleUser: { backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' },
  messageBubbleAdmin: { backgroundColor: 'var(--hero-bg)', border: '1px solid var(--card-border)', alignSelf: 'flex-end' },
  messageSender: { fontSize: '0.8rem', fontWeight: '600', color: 'var(--header-text)', display: 'block', marginBottom: '0.25rem' },
  messageTime: { fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem', display: 'block' },
  replyForm: { padding: '1rem 1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  replyTextarea: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', resize: 'vertical' },
  replyBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: 'var(--button-bg)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-end' },
  emptyState: { padding: '2rem', textAlign: 'center', opacity: 0.6, margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-color)' },
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', fontSize: '1.2rem', gap: '1rem' },
};

export default Inbox;
