import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchMyBusinesses, updateBusiness as apiUpdateBusiness, deleteBusiness as apiDeleteBusiness, transferBusinessOwner, fetchAdminUsers } from '../../services/api';
import { 
    FaBuilding, 
    FaSpinner,
    FaExclamationTriangle,
    FaSave,
    FaTimes,
    FaTrashAlt,
    FaCamera,
    FaSearch,
    FaStar,
    FaEdit,
    FaChevronLeft,
    FaChevronRight,
    FaEllipsisV,
    FaEnvelope
} from 'react-icons/fa';

// --- Reusable Components ---

// Transfer Owner Modal
const TransferOwnerModal = ({ business, owners, onConfirm, onCancel, loading }) => {
    const [selectedOwnerId, setSelectedOwnerId] = useState('');
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <h3 style={styles.modalTitle}>Transfer Business Owner</h3>
                <p style={{ marginBottom: '0.5rem', opacity: 0.9 }}>
                    Reassign <strong>{business?.name}</strong> to a different owner.
                </p>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    <strong>What this does:</strong> Changes who owns this business. The new owner will see it in their dashboard and can manage it. Current owner: {business?.ownerEmail}.
                </p>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>New Owner</label>
                    <select
                        value={selectedOwnerId}
                        onChange={(e) => setSelectedOwnerId(Number(e.target.value))}
                        style={styles.input}
                        className="input-focus"
                    >
                        <option value="">Select owner...</option>
                        {owners.filter(o => o.id !== business?.ownerId).map(o => (
                            <option key={o.id} value={o.id}>{o.username} ({o.email})</option>
                        ))}
                    </select>
                </div>
                <div style={styles.modalActions}>
                    <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
                    <button
                        onClick={() => onConfirm(selectedOwnerId)}
                        disabled={!selectedOwnerId || loading}
                        style={{...styles.saveButton, opacity: !selectedOwnerId || loading ? 0.7 : 1}}
                    >
                        {loading ? 'Transferring...' : 'Transfer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ onConfirm, onCancel, count }) => (
    <div style={styles.modalOverlay}>
        <div style={styles.modal}>
            <FaExclamationTriangle style={styles.modalIcon} />
            <h3 style={styles.modalTitle}>{count > 1 ? `Delete ${count} Businesses?` : 'Delete Business?'}</h3>
            <p>This action is irreversible. All selected businesses will be permanently deleted.</p>
            <div style={styles.modalActions}>
                <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
                <button onClick={onConfirm} style={{...styles.deleteButton, ...styles.modalDeleteButton}}>
                    {count > 1 ? `Delete ${count} Businesses` : 'Delete Business'}
                </button>
            </div>
        </div>
    </div>
);

// Add/Edit Form Component
const BusinessForm = ({ business, onSave, onCancel, isEditing, onStatusToggle }) => {
    const [formData, setFormData] = useState(business);
    const [previewImage, setPreviewImage] = useState(business.image);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(business);
        setPreviewImage(business.image);
    }, [business]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Business name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.type.trim()) newErrors.type = 'Type is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB validation
                setErrors(prev => ({...prev, image: 'Image must be less than 5MB'}));
                return;
            }
            setFormData({...formData, image: file});
            setPreviewImage(URL.createObjectURL(file));
            setErrors(prev => ({...prev, image: ''}));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSubmitting(true);
        try {
            await onSave(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.formPanel}>
            <form onSubmit={handleSubmit}>
                <div style={{...styles.formGrid, ...styles.formGridResponsive}}>
                    <div style={styles.formSection}>
                        <h2 style={styles.sectionTitle}>Edit Business</h2>
                        
                        {isEditing && (
                            <div style={{...styles.inputGroup, marginBottom: '2rem'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <div>
                                        <span style={styles.label}>Status: </span>
                                        <span style={{...styles.statusBadge, ...(formData.status === 'Active' ? styles.activeStatus : styles.inactiveStatus)}}>
                                            {formData.status}
                                        </span>
                                    </div>
                                    <label style={styles.switch}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.status === 'Active'} 
                                            onChange={() => {
                                                const newStatus = formData.status === 'Active' ? 'Inactive' : 'Active';
                                                setFormData(prev => ({...prev, status: newStatus}));
                                                onStatusToggle(newStatus);
                                            }}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Business Name*</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                style={{...styles.input, ...(errors.name && styles.inputError)}} 
                                className="input-focus" 
                            />
                            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Business Description*</label>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                style={{...styles.input, minHeight: '120px', ...(errors.description && styles.inputError)}} 
                                className="input-focus" 
                            />
                            {errors.description && <span style={styles.errorText}>{errors.description}</span>}
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Business Type*</label>
                                <select 
                                    name="type" 
                                    value={formData.type} 
                                    onChange={handleChange} 
                                    style={{...styles.input, ...(errors.type && styles.inputError)}} 
                                    className="input-focus"
                                >
                                    <option value="">Select type</option>
                                    <option value="Restaurant">Restaurant</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Services">Services</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.type && <span style={styles.errorText}>{errors.type}</span>}
                            </div>
                            
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Location*</label>
                                <input 
                                    type="text" 
                                    name="location" 
                                    value={formData.location} 
                                    onChange={handleChange} 
                                    style={{...styles.input, ...(errors.location && styles.inputError)}} 
                                    className="input-focus" 
                                    placeholder="City, Country" 
                                />
                                {errors.location && <span style={styles.errorText}>{errors.location}</span>}
                            </div>
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Contact Number*</label>
                                <input 
                                    type="tel" 
                                    name="contactNumber" 
                                    value={formData.contactNumber} 
                                    onChange={handleChange} 
                                    style={{...styles.input, ...(errors.contactNumber && styles.inputError)}} 
                                    className="input-focus" 
                                />
                                {errors.contactNumber && <span style={styles.errorText}>{errors.contactNumber}</span>}
                            </div>
                            
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Owner Email</label>
                                <input 
                                    type="email" 
                                    name="ownerEmail" 
                                    value={formData.ownerEmail} 
                                    onChange={handleChange} 
                                    style={styles.input} 
                                    className="input-focus" 
                                />
                            </div>
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Website URL (optional)</label>
                            <input 
                                type="url" 
                                name="website" 
                                value={formData.website} 
                                onChange={handleChange} 
                                style={styles.input} 
                                className="input-focus" 
                                placeholder="https://example.com" 
                            />
                        </div>
                    </div>
                    
                    <div style={styles.formSection}>
                        <h2 style={styles.sectionTitle}>Business Images</h2>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Main Profile Picture</label>
                            <label htmlFor="image-upload" style={styles.imageUploader}>
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" style={styles.imagePreview}/>
                                ) : (
                                    <div style={{textAlign: 'center'}}>
                                        <FaCamera style={{fontSize: '2rem', marginBottom: '0.5rem'}}/>
                                        <div>Upload Image</div>
                                    </div>
                                )}
                                <div style={styles.uploadOverlay}><FaCamera/> Change Photo</div>
                            </label>
                            <input 
                                type="file" 
                                id="image-upload" 
                                onChange={handleImageChange} 
                                style={{display: 'none'}} 
                                accept="image/png, image/jpeg" 
                            />
                            {errors.image && <span style={styles.errorText}>{errors.image}</span>}
                        </div>
                        
                        {isEditing && (
                            <div style={{...styles.inputGroup, marginTop: '2rem'}}>
                                <h3 style={{...styles.sectionTitle, fontSize: '1.2rem', marginBottom: '1rem'}}>Business Stats</h3>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                    <FaStar style={{color: 'var(--button-bg)', fontSize: '1.2rem'}}/> 
                                    <span>Average Rating: {business.avgRating || 'N/A'}</span>
                                </div>
                                <div style={{marginTop: '0.5rem'}}>
                                    <span>Total Reviews: {business.totalReviews || 0}</span>
                                </div>
                                <div style={{marginTop: '0.5rem'}}>
                                    <span>Created: {new Date(business.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={styles.formActions}>
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        style={styles.cancelButton}
                        disabled={isSubmitting}
                    >
                        <FaTimes/> Cancel
                    </button>
                    <button 
                        type="submit" 
                        style={styles.saveButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <FaSpinner className="spin" style={{marginRight: '0.5rem'}}/> 
                                Saving...
                            </>
                        ) : (
                            <>
                                <FaSave/> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Toast Notification Component
const Toast = ({ message, type, onClose }) => (
    <div style={{...styles.toast, ...(type === 'success' ? styles.toastSuccess : styles.toastError)}}>
        <div style={styles.toastMessage}>{message}</div>
        <button onClick={onClose} style={styles.toastClose}>
            <FaTimes/>
        </button>
    </div>
);

// Main Page Component
function AdminBusinessManagement() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [businessToTransfer, setBusinessToTransfer] = useState(null);
    const [owners, setOwners] = useState([]);
    const [transferLoading, setTransferLoading] = useState(false);
    const [selectedBusinesses, setSelectedBusinesses] = useState([]);
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [toast, setToast] = useState(null);
    const businessesPerPage = 10; // Changed to show 10 businesses per page

    const normalizeBusiness = (b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        type: b.category,
        category: b.category,
        location: b.address,
        contactNumber: b.phone_number,
        ownerId: b.owner_id,
        ownerEmail: b.owner_email,
        website: b.website_url,
        establishmentYear: b.establishment_year,
        status: b.status,
        avgRating: b.avg_rating,
        totalReviews: b.total_reviews,
        createdAt: b.created_at,
        image: null,
    });

    const fetchBusinesses = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchMyBusinesses();
            setBusinesses((data || []).map(normalizeBusiness));
            setError(null);
        } catch (err) {
            setError("Failed to load businesses. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBusinessApi = async (businessData) => {
        const payload = {
            name: businessData.name,
            description: businessData.description,
            category: businessData.type,
            address: businessData.location,
            phone_number: businessData.contactNumber,
            website_url: businessData.website,
            status: businessData.status,
        };
        return await apiUpdateBusiness(businessData.id, payload);
    };

    const deleteBusinessApi = async (id) => {
        await apiDeleteBusiness(id);
        return true;
    };

    const updateBusinessStatus = async (id, status) => {
        await apiUpdateBusiness(id, { status });
        return status;
    };

    const sendEmailToOwner = (email) => {
        // In a real app, this would open an email client or trigger an API call
        window.open(`mailto:${email}?subject=Regarding Your Business`, '_blank');
        showToast(`Email composer opened for ${email}`);
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleStatusToggle = async (id) => {
        try {
            const business = businesses.find(b => b.id === id);
            const newStatus = business.status === 'Active' ? 'Inactive' : 'Active';
            
            await updateBusinessStatus(id, newStatus);
            
            setBusinesses(businesses.map(b => 
                b.id === id ? {...b, status: newStatus} : b
            ));
            
            if (editingBusiness?.id === id) {
                setEditingBusiness(prev => ({...prev, status: newStatus}));
            }
            
            showToast(`Business status updated to ${newStatus}`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleTransferClick = async (business) => {
        setBusinessToTransfer(business);
        try {
            const users = await fetchAdminUsers('', 'owner');
            setOwners(users || []);
        } catch (err) {
            showToast('Failed to load owners', 'error');
            return;
        }
        setShowTransferModal(true);
    };

    const confirmTransfer = async (newOwnerId) => {
        if (!businessToTransfer || !newOwnerId) return;
        setTransferLoading(true);
        try {
            await transferBusinessOwner(businessToTransfer.id, newOwnerId);
            const newOwner = owners.find(o => o.id === newOwnerId);
            setBusinesses(businesses.map(b =>
                b.id === businessToTransfer.id ? { ...b, ownerEmail: newOwner?.email, ownerId: newOwnerId } : b
            ));
            if (editingBusiness?.id === businessToTransfer.id) {
                setEditingBusiness(prev => ({ ...prev, ownerEmail: newOwner?.email, ownerId: newOwnerId }));
            }
            showToast(`Business transferred to ${newOwner?.username}`);
            setShowTransferModal(false);
            setBusinessToTransfer(null);
        } catch (err) {
            showToast(err?.data?.detail || err?.message || 'Transfer failed', 'error');
        } finally {
            setTransferLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        if (Array.isArray(id)) {
            setBusinessToDelete(id);
        } else {
            setBusinessToDelete([id]);
        }
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const idsToDelete = businessToDelete;
            const isMultiple = idsToDelete.length > 1;
            
            await Promise.all(idsToDelete.map(id => deleteBusinessApi(id)));
            
            setBusinesses(businesses.filter(b => !idsToDelete.includes(b.id)));
            
            if (editingBusiness && idsToDelete.includes(editingBusiness.id)) {
                setEditingBusiness(null);
            }
            
            setSelectedBusinesses(prev => prev.filter(id => !idsToDelete.includes(id)));
            
            setShowDeleteModal(false);
            setBusinessToDelete(null);
            
            showToast(isMultiple ? 
                `${idsToDelete.length} businesses deleted successfully` : 
                'Business deleted successfully'
            );
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleSave = async (formData) => {
        try {
            await updateBusinessApi(formData);
            setBusinesses(businesses.map(b => b.id === formData.id ? { ...b, ...formData } : b));
            showToast('Business updated successfully');
            setEditingBusiness(null);
        } catch (err) {
            showToast(err.message || 'Failed to update business', 'error');
            throw err;
        }
    };

    const handleEditClick = (business) => {
        setEditingBusiness(business);
        document.querySelector('#business-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingBusiness(null);
    };

    const toggleSelectBusiness = (id) => {
        setSelectedBusinesses(prev => 
            prev.includes(id) 
                ? prev.filter(bId => bId !== id) 
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedBusinesses.length === currentBusinesses.length) {
            setSelectedBusinesses([]);
        } else {
            setSelectedBusinesses(currentBusinesses.map(b => b.id));
        }
    };

    const bulkUpdateStatus = async (status) => {
        if (selectedBusinesses.length === 0) return;
        
        try {
            await Promise.all(
                selectedBusinesses.map(id => updateBusinessStatus(id, status))
            );
            
            setBusinesses(businesses.map(b => 
                selectedBusinesses.includes(b.id) ? {...b, status} : b
            ));
            
            if (editingBusiness && selectedBusinesses.includes(editingBusiness.id)) {
                setEditingBusiness(prev => ({...prev, status}));
            }
            
            showToast(`${selectedBusinesses.length} businesses set to ${status}`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const filteredBusinesses = useMemo(() => businesses
        .filter(b => filterStatus === 'All' || b.status === filterStatus)
        .filter(b => filterCategory === 'All' || b.type === filterCategory)
        .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [businesses, searchTerm, filterStatus, filterCategory]
    );

    const currentBusinesses = filteredBusinesses.slice(
        (currentPage - 1) * businessesPerPage, 
        currentPage * businessesPerPage
    );
    
    const totalPages = Math.ceil(filteredBusinesses.length / businessesPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const analytics = useMemo(() => {
        const activeCount = businesses.filter(b => b.status === 'Active').length;
        const inactiveCount = businesses.length - activeCount;
        const avgRating = businesses.length > 0 
            ? (businesses.reduce((sum, b) => sum + b.avgRating, 0) / businesses.length)
            : 0;
            
        return {
            total: businesses.length,
            active: activeCount,
            inactive: inactiveCount,
            avgRating: avgRating.toFixed(1)
        };
    }, [businesses]);

    const hoverStyles = `
        .input-focus:focus-within { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.3); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--card-border); transition: .4s; border-radius: 28px; }
        .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--button-bg); }
        input:checked + .slider:before { transform: translateX(22px); }
        
        @media (max-width: 768px) {
            .form-grid-responsive { grid-template-columns: 1fr !important; }
            .table-header-responsive, .table-row-responsive { display: none; }
            .mobile-card-view { display: block !important; }
        }
    `;

    if (loading && businesses.length === 0) {
        return <div style={styles.loader}><FaSpinner className="spin"/> Loading Businesses...</div>;
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <FaExclamationTriangle style={styles.errorIcon}/>
                <p>{error}</p>
                <button onClick={fetchBusinesses} style={styles.retryButton}>Retry</button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
            <style>{hoverStyles}</style>
            
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
            
            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <div>
                        <h1 style={styles.heroTitle}>Manage Businesses</h1>
                        <p style={styles.heroSubtitle}>Edit or update the status of business profiles.</p>
                    </div>
                </div>
            </section>
            
            <main style={styles.main}>
                <div style={styles.analyticsContainer}>
                    <div style={styles.analyticsTile}>
                        <h3 style={styles.analyticsTitle}>Total Businesses</h3>
                        <div style={styles.analyticsValue}>{analytics.total}</div>
                    </div>
                    <div style={styles.analyticsTile}>
                        <h3 style={styles.analyticsTitle}>Active</h3>
                        <div style={{...styles.analyticsValue, color: '#10B981'}}>{analytics.active}</div>
                    </div>
                    <div style={styles.analyticsTile}>
                        <h3 style={styles.analyticsTitle}>Inactive</h3>
                        <div style={{...styles.analyticsValue, color: '#EF4444'}}>{analytics.inactive}</div>
                    </div>
                    <div style={styles.analyticsTile}>
                        <h3 style={styles.analyticsTitle}>Avg. Rating</h3>
                        <div style={styles.analyticsValue}>
                            <FaStar style={{color: 'var(--button-bg)', marginRight: '0.3rem'}}/> 
                            {analytics.avgRating}
                        </div>
                    </div>
                </div>
                
                {editingBusiness && (
                    <div id="business-form">
                        <BusinessForm 
                            business={editingBusiness}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            isEditing={true}
                            onStatusToggle={(newStatus) => {
                                handleStatusToggle(editingBusiness.id);
                            }}
                        />
                    </div>
                )}
                
                <div style={styles.businessListContainer}>
                    <div style={styles.listHeader}>
                        <div style={styles.searchContainer} className="input-focus">
                            <FaSearch style={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Search by name..." 
                                value={searchTerm} 
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }} 
                                style={styles.searchInput}
                                aria-label="Search businesses"
                            />
                        </div>
                        
                        <div style={styles.filterControls}>
                            <select 
                                value={filterCategory} 
                                onChange={e => {
                                    setFilterCategory(e.target.value);
                                    setCurrentPage(1);
                                }} 
                                style={styles.select}
                                aria-label="Filter by category"
                            >
                                <option value="All">All Categories</option>
                                <option value="Restaurant">Restaurant</option>
                                <option value="Services">Services</option>
                                <option value="Retail">Retail</option>
                                <option value="Other">Other</option>
                            </select>
                            
                            <select 
                                value={filterStatus} 
                                onChange={e => {
                                    setFilterStatus(e.target.value);
                                    setCurrentPage(1);
                                }} 
                                style={styles.select}
                                aria-label="Filter by status"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                            
                            {selectedBusinesses.length > 0 && (
                                <div style={{position: 'relative'}}>
                                    <button 
                                        style={{...styles.addNewButton, backgroundColor: 'var(--card-bg)', color: 'var(--text-color)'}}
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                    >
                                        <FaEllipsisV/> Actions
                                    </button>
                                    <div style={styles.bulkActionsMenu}>
                                        <button 
                                            style={styles.bulkActionItem}
                                            onClick={() => bulkUpdateStatus('Active')}
                                        >
                                            Set as Active
                                        </button>
                                        <button 
                                            style={styles.bulkActionItem}
                                            onClick={() => bulkUpdateStatus('Inactive')}
                                        >
                                            Set as Inactive
                                        </button>
                                        <button 
                                            style={{...styles.bulkActionItem, color: '#EF4444'}}
                                            onClick={() => handleDeleteClick(selectedBusinesses)}
                                        >
                                            Delete Selected
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div style={styles.businessTable}>
                        <div style={{...styles.tableHeader, ...styles.tableHeaderResponsive}}>
                            <div style={{flex: 0.5}}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedBusinesses.length > 0 && selectedBusinesses.length === currentBusinesses.length}
                                    onChange={toggleSelectAll}
                                    aria-label="Select all businesses"
                                />
                            </div>
                            <div style={{flex: 3}}>Business Name</div>
                            <div style={{flex: 2}}>Owner Email</div>
                            <div style={{flex: 1}}>Status</div>
                            <div style={{flex: 2}}>Avg. Rating</div>
                            <div style={{flex: 2, textAlign: 'right'}}>Actions</div>
                        </div>
                        
                        {currentBusinesses.length > 0 ? (
                            currentBusinesses.map(biz => (
                                <div key={biz.id} style={{...styles.tableRow, ...styles.tableRowResponsive}}>
                                    <div style={{flex: 0.5}}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedBusinesses.includes(biz.id)}
                                            onChange={() => toggleSelectBusiness(biz.id)}
                                            aria-label={`Select ${biz.name}`}
                                        />
                                    </div>
                                    <div style={{flex: 3, fontWeight: '600'}}>{biz.name}</div>
                                    <div style={{flex: 2}}>
                                        <button 
                                            onClick={() => sendEmailToOwner(biz.ownerEmail)}
                                            style={{...styles.actionButton, padding: '0.3rem 0.5rem'}}
                                        >
                                            <FaEnvelope/> {biz.ownerEmail}
                                        </button>
                                    </div>
                                    <div style={{flex: 1}}>
                                        <span style={{...styles.statusBadge, ...(biz.status === 'Active' ? styles.activeStatus : styles.inactiveStatus)}}>
                                            {biz.status}
                                        </span>
                                    </div>
                                    <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <FaStar style={{color: 'var(--button-bg)'}}/> {biz.avgRating} ({biz.totalReviews})
                                    </div>
                                    <div style={{...styles.actionsCell, ...styles.actionsResponsive}}>
                                        <label style={styles.switch}>
                                            <input 
                                                type="checkbox" 
                                                checked={biz.status === 'Active'} 
                                                onChange={() => handleStatusToggle(biz.id)}
                                                aria-label={`Toggle ${biz.name} status`}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                        <button 
                                            onClick={() => handleEditClick(biz)} 
                                            style={styles.actionButton}
                                            aria-label={`Edit ${biz.name}`}
                                        >
                                            <FaEdit/> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleTransferClick(biz)} 
                                            style={{...styles.actionButton, color: 'var(--button-bg)'}}
                                            aria-label={`Transfer ${biz.name}`}
                                            title="Transfer to another owner"
                                        >
                                            Transfer
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(biz.id)} 
                                            style={{...styles.actionButton, color: '#ef4444'}}
                                            aria-label={`Delete ${biz.name}`}
                                        >
                                            <FaTrashAlt/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={styles.noResults}>
                                No businesses found matching your criteria
                            </div>
                        )}
                    </div>
                    
                    {totalPages > 1 && (
                        <div style={styles.pagination}>
                            <button 
                                onClick={() => paginate(currentPage - 1)} 
                                disabled={currentPage === 1} 
                                style={styles.pageButton}
                                aria-label="Previous page"
                            >
                                <FaChevronLeft/>
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    style={{
                                        ...styles.pageButton,
                                        backgroundColor: currentPage === number ? 'var(--button-bg)' : 'var(--card-bg)',
                                        color: currentPage === number ? 'white' : 'var(--text-color)'
                                    }}
                                    aria-label={`Go to page ${number}`}
                                >
                                    {number}
                                </button>
                            ))}
                            
                            <button 
                                onClick={() => paginate(currentPage + 1)} 
                                disabled={currentPage === totalPages} 
                                style={styles.pageButton}
                                aria-label="Next page"
                            >
                                <FaChevronRight/>
                            </button>
                        </div>
                    )}
                </div>
            </main>
            
            {showDeleteModal && (
                <DeleteConfirmationModal 
                    onConfirm={confirmDelete} 
                    onCancel={() => setShowDeleteModal(false)} 
                    count={businessToDelete?.length || 0}
                />
            )}

            {showTransferModal && businessToTransfer && (
                <TransferOwnerModal
                    business={businessToTransfer}
                    owners={owners}
                    onConfirm={confirmTransfer}
                    onCancel={() => { setShowTransferModal(false); setBusinessToTransfer(null); }}
                    loading={transferLoading}
                />
            )}
        </div>
    );
};

const styles = {
    // Common Styles
    hero: { padding: "3rem 2rem", backgroundColor: "var(--hero-bg)", borderBottom: "1px solid var(--card-border)" },
    heroTitle: { fontSize: "2.2rem", fontWeight: "bold", color: "var(--hero-text)", margin: "0 0 0.5rem 0", textAlign: 'center' },
    heroSubtitle: { fontSize: "1rem", color: "var(--text-color)", opacity: 0.9, margin: 0, textAlign: 'center' },
    heroContent: { maxWidth: "1200px", margin: "0 auto", display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    main: { maxWidth: "1200px", margin: "2rem auto", padding: "0 2rem" },
    loader: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        gap: '1rem',
        fontSize: '1.2rem'
    },
    spin: { animation: 'spin 1s linear infinite' },
    errorContainer: { 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
    },
    errorIcon: { fontSize: '3rem', color: '#ef4444' },
    retryButton: { 
        padding: '0.8rem 1.5rem', 
        backgroundColor: "var(--button-bg)", 
        color: "white", 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'pointer',
        marginTop: '1rem'
    },
    noResults: {
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-color)',
        opacity: 0.7,
        fontSize: '1.1rem'
    },
    
    // Analytics Styles
    analyticsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    },
    analyticsTile: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow)'
    },
    analyticsTitle: {
        fontSize: '0.9rem',
        color: 'var(--text-color)',
        opacity: 0.8,
        margin: '0 0 0.5rem 0',
        fontWeight: '500'
    },
    analyticsValue: {
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: 'var(--header-text)',
        display: 'flex',
        alignItems: 'center'
    },
    
    // Business List Styles
    businessListContainer: { 
        backgroundColor: 'var(--card-bg)', 
        borderRadius: '12px', 
        boxShadow: 'var(--shadow)', 
        padding: '2rem',
        marginTop: '1rem'
    },
    listHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    filterControls: { 
        display: 'flex', 
        gap: '1rem',
        flexWrap: 'wrap'
    },
    select: { 
        backgroundColor: "var(--bg-color)", 
        border: "1px solid var(--card-border)", 
        padding: "0.75rem", 
        borderRadius: "8px", 
        color: 'var(--text-color)',
        minWidth: '150px'
    },
    searchContainer: { 
        display: "flex", 
        alignItems: "center", 
        gap: "0.5rem", 
        width: "300px", 
        maxWidth: '100%',
        backgroundColor: "var(--bg-color)", 
        borderRadius: "8px", 
        padding: "0.5rem 1rem", 
        border: '2px solid var(--card-border)' 
    },
    searchInput: { 
        flex: 1, 
        border: "none", 
        outline: "none", 
        backgroundColor: "transparent", 
        color: "var(--text-color)", 
        fontSize: "0.9rem" 
    },
    searchIcon: { opacity: 0.5 },
    businessTable: { width: '100%', overflowX: 'auto' },
    tableHeader: { 
        display: 'flex', 
        padding: '0 1rem 1rem 1rem', 
        borderBottom: '1px solid var(--card-border)', 
        fontWeight: '600', 
        opacity: 0.8 
    },
    tableHeaderResponsive: {
        '@media (max-width: 768px)': {
            display: 'none'
        }
    },
    tableRow: { 
        display: 'flex', 
        alignItems: 'center', 
        padding: '1rem',
        borderBottom: '1px solid var(--card-border)',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: 'var(--hover-bg)'
        }
    },
    tableRowResponsive: {
        '@media (max-width: 768px)': {
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '1.5rem'
        }
    },
    statusBadge: { 
        padding: '0.3rem 0.8rem', 
        borderRadius: '20px', 
        fontSize: '0.8rem', 
        fontWeight: 'bold',
        display: 'inline-block'
    },
    activeStatus: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' },
    inactiveStatus: { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280' },
    actionButton: { 
        display: "flex", 
        alignItems: "center", 
        gap: "0.5rem", 
        padding: "0.5rem 1rem", 
        backgroundColor: "var(--card-bg)", 
        color: "var(--text-color)", 
        border: "1px solid var(--card-border)", 
        borderRadius: "8px", 
        cursor: 'pointer', 
        fontWeight: '500',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: 'var(--button-bg)',
            color: 'white',
            borderColor: 'var(--button-bg)'
        }
    },
    actionsCell: {
        flex: 2, 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '0.5rem'
    },
    actionsResponsive: {
        '@media (max-width: 768px)': {
            justifyContent: 'flex-start',
            marginTop: '1rem',
            width: '100%'
        }
    },
    pagination: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '1rem', 
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--card-border)'
    },
    pageButton: { 
        background: 'var(--card-bg)', 
        border: '1px solid var(--card-border)', 
        borderRadius: '50%', 
        width: '40px', 
        height: '40px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'var(--text-color)',
        transition: 'all 0.2s',
        ':hover:not(:disabled)': {
            backgroundColor: 'var(--button-bg)',
            color: 'white',
            borderColor: 'var(--button-bg)'
        },
        ':disabled': {
            opacity: 0.5,
            cursor: 'not-allowed'
        }
    },
    addNewButton: { 
        display: "flex", 
        alignItems: "center", 
        gap: "0.5rem", 
        padding: "0.8rem 1.5rem", 
        backgroundColor: "var(--button-bg)", 
        color: "white", 
        borderRadius: "8px", 
        textDecoration: "none", 
        fontWeight: "600", 
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: 'var(--button-hover)'
        }
    },
    bulkActionsMenu: {
        position: 'absolute',
        right: 0,
        top: '100%',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 10,
        minWidth: '200px',
        overflow: 'hidden',
        border: '1px solid var(--card-border)'
    },
    bulkActionItem: {
        width: '100%',
        textAlign: 'left',
        padding: '0.75rem 1rem',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--text-color)',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: 'var(--hover-bg)'
        }
    },
    
    // Business Form Styles
    formPanel: { 
        backgroundColor: 'var(--card-bg)', 
        padding: '2rem', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        boxShadow: 'var(--shadow)'
    },
    formGrid: { 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '2.5rem',
        '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr'
        }
    },
    formSection: {},
    sectionTitle: { 
        fontSize: "1.5rem", 
        fontWeight: "bold", 
        color: "var(--header-text)", 
        marginBottom: "1.5rem", 
        paddingBottom: '1rem', 
        borderBottom: '1px solid var(--card-border)' 
    },
    inputGroup: { 
        marginBottom: '1.5rem' 
    },
    label: { 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontWeight: '500',
        color: 'var(--text-color)'
    },
    input: { 
        width: '100%', 
        padding: '0.8rem 1rem', 
        backgroundColor: 'var(--bg-color)', 
        border: '2px solid var(--card-border)', 
        borderRadius: '8px', 
        color: 'var(--text-color)', 
        fontSize: '1rem', 
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    inputError: {
        borderColor: '#EF4444',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)'
    },
    errorText: {
        display: 'block',
        marginTop: '0.5rem',
        color: '#EF4444',
        fontSize: '0.85rem'
    },
    imageUploader: { 
        width: '100%', 
        height: '200px', 
        borderRadius: '12px', 
        border: '2px dashed var(--card-border)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        cursor: 'pointer', 
        position: 'relative', 
        overflow: 'hidden', 
        backgroundColor: 'var(--hero-bg)', 
        color: 'var(--card-border)', 
        fontSize: '3rem',
        transition: 'border-color 0.2s'
    },
    imagePreview: { 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover' 
    },
    uploadOverlay: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '30%', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        opacity: 0, 
        transition: 'opacity 0.2s', 
        gap: '0.5rem',
        ':hover': {
            opacity: 1
        }
    },
    formActions: { 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '1rem', 
        marginTop: '2rem', 
        paddingTop: '1.5rem', 
        borderTop: '1px solid var(--card-border)' 
    },
    cancelButton: { 
        padding: '0.8rem 1.5rem', 
        backgroundColor: 'transparent', 
        border: '1px solid var(--card-border)', 
        borderRadius: '8px', 
        color: 'var(--text-color)', 
        cursor: 'pointer', 
        fontWeight: '500',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: 'var(--hover-bg)'
        },
        ':disabled': {
            opacity: 0.7,
            cursor: 'not-allowed'
        }
    },
    saveButton: { 
        padding: '0.8rem 1.5rem', 
        backgroundColor: 'var(--button-bg)', 
        border: 'none', 
        borderRadius: '8px', 
        color: 'white', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        transition: 'background-color 0.2s',
        ':hover:not(:disabled)': {
            backgroundColor: 'var(--button-hover)'
        },
        ':disabled': {
            opacity: 0.7,
            cursor: 'not-allowed'
        }
    },
    deleteButton: { 
        padding: '0.8rem 1.5rem', 
        backgroundColor: '#ef4444', 
        border: 'none', 
        borderRadius: '8px', 
        color: 'white', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#dc2626'
        }
    },
    switch: { 
        position: 'relative', 
        display: 'inline-block', 
        width: '50px', 
        height: '28px',
        marginRight: '0.5rem'
    },
    
    // Modal Styles
    modalOverlay: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 100 
    },
    modal: { 
        backgroundColor: 'var(--card-bg)', 
        padding: '2rem', 
        borderRadius: '12px', 
        textAlign: 'center', 
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    },
    modalIcon: { 
        fontSize: '3rem', 
        color: '#ef4444', 
        marginBottom: '1rem' 
    },
    modalTitle: { 
        color: 'var(--header-text)', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
    },
    modalActions: { 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '1rem', 
        marginTop: '1.5rem' 
    },
    modalDeleteButton: { 
        padding: '0.8rem 1.5rem', 
        backgroundColor: '#ef4444', 
        border: 'none', 
        borderRadius: '8px', 
        color: 'white', 
        cursor: 'pointer', 
        fontWeight: 'bold' 
    },
    
    // Toast Styles
    toast: {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '400px',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out'
    },
    toastSuccess: {
        backgroundColor: '#10B981',
        color: 'white'
    },
    toastError: {
        backgroundColor: '#EF4444',
        color: 'white'
    },
    toastMessage: {
        marginRight: '1rem'
    },
    toastClose: {
        background: 'none',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        padding: '0.2rem'
    }
};

export default AdminBusinessManagement;
