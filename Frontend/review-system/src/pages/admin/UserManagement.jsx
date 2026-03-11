import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminUsers, updateUser, deleteUser } from '../../services/api';
import { 
    FaUsers, FaUser, FaUserShield, FaUserCheck, FaUserSlash, FaUserClock,
    FaSearch, FaFilter, FaEnvelope, FaCheck, FaTimes,
    FaSpinner, FaChevronLeft, FaChevronRight, FaTrashAlt, FaExclamationTriangle
} from 'react-icons/fa';

// --- Reusable Components ---

// Email Modal Component
const EmailModal = ({ user, onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSendEmail = (e) => {
        e.preventDefault();
        console.log(`Sending email to ${user.email}:`, { subject, message });
        alert(`Email sent to ${user.name}!`);
        onClose();
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Send Email to {user.name}</h3>
                    <button onClick={onClose} style={styles.closeModalButton}><FaTimes/></button>
                </div>
                <form onSubmit={handleSendEmail}>
                    <div style={styles.modalContent}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Subject</label>
                            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Message</label>
                            <textarea value={message} onChange={(e) => setMessage(e.target.value)} style={{...styles.input, minHeight: '150px'}} required />
                        </div>
                    </div>
                    <div style={styles.modalActions}>
                        <button type="button" onClick={onClose} style={styles.cancelButton}>Cancel</button>
                        <button type="submit" style={styles.saveButton}>Send Email</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ user, onConfirm, onCancel }) => (
    <div style={styles.modalOverlay}>
        <div style={styles.modal}>
            <FaExclamationTriangle style={styles.modalIcon} />
            <h3 style={styles.modalTitle}>Delete User?</h3>
            <p>Are you sure you want to permanently delete <strong>{user.name}</strong>? This action is irreversible.</p>
            <div style={styles.modalActions}>
                <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
                <button onClick={() => onConfirm(user.id)} style={{...styles.deleteButton, ...styles.modalDeleteButton}}>Delete User</button>
            </div>
        </div>
    </div>
);

// Main Page Component
function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [filters, setFilters] = useState({ role: 'all', status: 'all' });
    const [sortConfig, setSortConfig] = useState({ key: 'signupDate', direction: 'desc' });
    const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTarget, setEmailTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const normalizeUser = (u) => ({
        id: u.id,
        name: u.display_name || u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        signupDate: new Date(u.date_joined),
        profilePic: u.profile_picture_url || null,
        is_active: u.is_active,
    });

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAdminUsers();
            setUsers((data || []).map(normalizeUser));
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        return users
            .filter(user => (filters.role === 'all' || user.role === filters.role) && (filters.status === 'all' || user.status === filters.status))
            .filter(user => `${user.name} ${user.email}`.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
    }, [users, searchQuery, filters, sortConfig]);

    const paginatedUsers = filteredUsers.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize);
    const totalPages = Math.ceil(filteredUsers.length / pagination.pageSize);

    const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    const handleSelectAll = (e) => setSelectedUsers(e.target.checked ? paginatedUsers.map(user => user.id) : []);
    const handleSelect = (id) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]);
    
    const handleStatusUpdate = async (userId, newStatus) => {
        try {
            await updateUser(userId, { is_active: newStatus === 'Active' });
            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus, is_active: newStatus === 'Active' } : u));
        } catch (err) {
            alert('Failed to update user status.');
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = async (userId) => {
        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Failed to delete user.');
        } finally {
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const renderStatusChip = (status) => {
        const statusMap = {
            Active: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
            Suspended: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
            Pending: { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
        };
        return <span style={{...styles.statusBadge, color: statusMap[status]?.color, backgroundColor: statusMap[status]?.bg}}>{status}</span>;
    };

    const hoverStyles = `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .input-focus:focus-within { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
    `;

    if (loading) {
        return <div style={styles.loader}><FaSpinner className="spin" /> Loading Users...</div>;
    }

    return (
        <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
            <style>{hoverStyles}</style>
            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.heroTitle}>User Management</h1>
                        <p style={styles.heroSubtitle}>Oversee all registered users on the platform.</p>
                    </div>
                </div>
            </section>
            <main style={styles.main}>
                <div style={styles.userListContainer}>
                    <div style={styles.listHeader}>
                        <div style={styles.searchContainer} className="input-focus">
                            <FaSearch style={styles.searchIcon} />
                            <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.searchInput}/>
                        </div>
                        <div style={styles.filterControls}>
                            <select value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})} style={styles.select}><option value="all">All Roles</option><option value="customer">Customer</option><option value="owner">Owner</option></select>
                            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={styles.select}><option value="all">All Statuses</option><option value="Active">Active</option><option value="Suspended">Suspended</option><option value="Pending">Pending</option></select>
                        </div>
                    </div>
                    
                    {selectedUsers.length > 0 && (
                        <div style={styles.bulkActionsBar}>
                            <span>{selectedUsers.length} selected</span>
                            <div style={styles.bulkActionButtons}>
                                <button><FaCheck/> Activate</button>
                                <button><FaUserSlash/> Suspend</button>
                                <button><FaEnvelope/> Email</button>
                                <button><FaTrashAlt/> Delete</button>
                            </div>
                        </div>
                    )}

                    <div style={styles.userTable}>
                        <div style={styles.tableHeader}>
                            <div style={{flex: 0.5}}><input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}/></div>
                            <div style={{flex: 3}} onClick={() => handleSort('name')}>User</div>
                            <div style={{flex: 2}} onClick={() => handleSort('role')}>Role</div>
                            <div style={{flex: 1}} onClick={() => handleSort('status')}>Status</div>
                            <div style={{flex: 2}} onClick={() => handleSort('signupDate')}>Joined Date</div>
                            <div style={{flex: 2, textAlign: 'right'}}>Actions</div>
                        </div>
                        {paginatedUsers.map(user => (
                            <div key={user.id} style={styles.tableRow}>
                                <div style={{flex: 0.5}} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleSelect(user.id)}/></div>
                                <div style={{flex: 3, display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt={user.name} style={styles.avatar} />
                                    ) : (
                                        <div style={{...styles.avatar, backgroundColor: 'var(--button-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem'}}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{fontWeight: '600'}}>{user.name}</div>
                                        <div style={{fontSize: '0.9rem', opacity: 0.7}}>{user.email}</div>
                                    </div>
                                </div>
                                <div style={{flex: 2}}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                                <div style={{flex: 1}}>{renderStatusChip(user.status)}</div>
                                <div style={{flex: 2}}>{new Date(user.signupDate).toLocaleDateString()}</div>
                                <div style={{flex: 2, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem'}}>
                                    {user.status === 'Active' && <button onClick={(e) => {e.stopPropagation(); handleStatusUpdate(user.id, 'Suspended')}} style={styles.actionButton} title="Suspend User"><FaUserSlash/></button>}
                                    {user.status !== 'Active' && <button onClick={(e) => {e.stopPropagation(); handleStatusUpdate(user.id, 'Active')}} style={styles.actionButton} title="Activate User"><FaUserCheck/></button>}
                                    <button onClick={(e) => {e.stopPropagation(); setEmailTarget(user); setShowEmailModal(true);}} style={styles.actionButton} title="Email User"><FaEnvelope/></button>
                                    <button onClick={(e) => {e.stopPropagation(); handleDeleteClick(user)}} style={{...styles.actionButton, color: '#ef4444'}} title="Delete User"><FaTrashAlt/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div style={styles.pagination}>
                        <button onClick={() => setPagination(p => ({...p, page: p.page - 1}))} disabled={pagination.page === 1} style={styles.pageButton}><FaChevronLeft/></button>
                        <span>Page {pagination.page} of {totalPages}</span>
                        <button onClick={() => setPagination(p => ({...p, page: p.page + 1}))} disabled={pagination.page === totalPages} style={styles.pageButton}><FaChevronRight/></button>
                    </div>
                </div>
            </main>
            {showEmailModal && <EmailModal user={emailTarget} onClose={() => setShowEmailModal(false)} />}
            {showDeleteModal && <DeleteConfirmationModal user={userToDelete} onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />}
        </div>
    );
}

const styles = {
    // Hero
    hero: { padding: "3rem 2rem", backgroundColor: "var(--hero-bg)", borderBottom: "1px solid var(--card-border)" },
    heroContent: { maxWidth: "1200px", margin: "0 auto" },
    heroTitle: { fontSize: "2.2rem", fontWeight: "bold", color: "var(--hero-text)", margin: "0 0 0.5rem 0" },
    heroSubtitle: { fontSize: "1rem", color: "var(--text-color)", opacity: 0.9, margin: 0 },
    // Main
    main: { maxWidth: "1200px", margin: "2rem auto", padding: "0 2rem" ,marginBottom: '0rem',
        padding: "0 2rem 2rem 2rem", },
    // User List
    userListContainer: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '2rem' },
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    searchContainer: { display: "flex", alignItems: "center", gap: "0.5rem", width: "300px", backgroundColor: "var(--bg-color)", borderRadius: "8px", padding: "0.5rem 1rem", border: '2px solid var(--card-border)' },
    searchInput: { flex: 1, border: "none", outline: "none", backgroundColor: "transparent", color: "var(--text-color)", fontSize: "0.9rem" },
    searchIcon: { opacity: 0.5 },
    filterControls: { display: 'flex', gap: '1rem' },
    select: { backgroundColor: "var(--bg-color)", border: "1px solid var(--card-border)", padding: "0.75rem", borderRadius: "8px", color: 'var(--text-color)'},
    bulkActionsBar: { backgroundColor: 'var(--hero-bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    bulkActionButtons: { display: 'flex', gap: '0.5rem' },
    userTable: { width: '100%', overflowX: 'auto' },
    tableHeader: { display: 'flex', padding: '0 1rem 1rem 1rem', borderBottom: '1px solid var(--card-border)', fontWeight: '600', opacity: 0.8 },
    tableRow: { display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--card-border)' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
    statusBadge: { padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
    activeStatus: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' },
    inactiveStatus: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' },
    actionButton: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", backgroundColor: "transparent", color: "var(--text-color)", border: "none", borderRadius: "8px", cursor: 'pointer' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '1rem' },
    pageButton: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)'},
    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', width: '500px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1rem' },
    modalTitle: { margin: 0, color: 'var(--header-text)', fontSize: '1.5rem' },
    closeModalButton: { background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.2rem', cursor: 'pointer' },
    modalContent: { padding: '1rem 0' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' },
    cancelButton: { padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', cursor: 'pointer' },
    saveButton: { padding: '0.75rem 1.5rem', backgroundColor: 'var(--button-bg)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' },
    deleteButton: { padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' },
    inputGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500' },
    input: { width: '90%', padding: '0.8rem 1rem', backgroundColor: 'var(--bg-color)', border: '2px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '1rem', outline: 'none' },
    // Loader and Error
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' },
    errorContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' },
    errorIcon: { fontSize: '3rem', color: '#ef4444' },
    retryButton: { padding: '0.8rem 1.5rem', backgroundColor: "var(--button-bg)", color: "white", border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default AdminUserManagement;
