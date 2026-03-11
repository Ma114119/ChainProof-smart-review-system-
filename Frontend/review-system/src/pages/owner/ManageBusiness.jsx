import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaBuilding, FaSpinner, FaExclamationTriangle, FaSave, FaTimes, 
    FaTrashAlt, FaCamera, FaPlus, FaSearch, FaStar, FaEdit, 
    FaInfoCircle, FaImage
} from 'react-icons/fa';
import { fetchMyBusinesses, updateBusiness, createBusinessWithImages, updateBusinessWithImages } from '../../services/api';

// =================================================================
// Reusable Child Components
// =================================================================

const Notification = ({ message, type, onDismiss }) => (
    <div style={{ ...styles.notification, ...(type === 'error' ? styles.notificationError : styles.notificationSuccess) }}>
        <FaInfoCircle style={{ marginRight: '0.75rem' }} />
        <span>{message}</span>
        <button onClick={onDismiss} style={styles.notificationDismiss}>&times;</button>
    </div>
);

const ImageUploader = ({ label, name, currentImage, onChange, error }) => {
    return (
        <div style={styles.inputGroup}>
            <label style={styles.label}>{label}</label>
            <label htmlFor={name} style={{...styles.imageUploader, ...(error && styles.inputError)}}>
                {currentImage ? (
                    <img src={currentImage} alt="Preview" style={styles.imagePreview}/>
                ) : (
                    <div style={{textAlign: 'center', color: 'var(--text-color)', opacity: 0.7}}>
                        <FaImage style={{fontSize: '2rem', marginBottom: '0.5rem'}}/>
                        <div>Upload Image</div>
                    </div>
                )}
                <div style={styles.uploadOverlay}><FaCamera/> Change Photo</div>
            </label>
            <input type="file" id={name} name={name} onChange={onChange} style={{display: 'none'}} accept="image/*" />
            {error && <span style={styles.errorText}>{error}</span>}
        </div>
    );
};


// =================================================================
// Business Form Component (for Add/Edit)
// =================================================================
const GALLERY_KEYS = ['galleryImage1', 'galleryImage2', 'galleryImage3', 'galleryImage4'];

const BusinessForm = ({ initialData, onSave, onCancel, onStatusToggle, isSaving }) => {
    const [formData, setFormData] = useState(initialData);
    const [previews, setPreviews] = useState({
        profileImageUrl: initialData.profileImageUrl || null,
        coverImageUrl: initialData.coverImageUrl || null,
        galleryImage1: initialData.galleryImage1Preview || null,
        galleryImage2: initialData.galleryImage2Preview || null,
        galleryImage3: initialData.galleryImage3Preview || null,
        galleryImage4: initialData.galleryImage4Preview || null,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setFormData(initialData);
        setPreviews({
            profileImageUrl: initialData.profileImageUrl || null,
            coverImageUrl: initialData.coverImageUrl || null,
            galleryImage1: initialData.galleryImage1Preview || null,
            galleryImage2: initialData.galleryImage2Preview || null,
            galleryImage3: initialData.galleryImage3Preview || null,
            galleryImage4: initialData.galleryImage4Preview || null,
        });
        setErrors({});
    }, [initialData]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Business name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category.trim()) newErrors.category = 'Category is required';
        if (!formData.address.trim()) newErrors.address = 'Location is required';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Contact number is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
    };

    const handleImageChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({...prev, [name]: 'Image must be less than 5MB'}));
                return;
            }
            setFormData(prev => ({...prev, [name]: file}));
            setPreviews(prev => ({...prev, [name]: URL.createObjectURL(file)}));
            setErrors(prev => ({...prev, [name]: ''}));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        await onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} style={styles.formPanel}>
            <div style={styles.formHeader}>
                <h2 style={styles.sectionTitle}>{formData.id ? 'Edit Business Profile' : 'Add New Business'}</h2>
                {formData.id && (
                    <div style={styles.statusToggleContainer}>
                         <span style={{...styles.statusBadge, ...(formData.status === 'Active' ? styles.activeStatus : styles.inactiveStatus)}}>
                            {formData.status}
                        </span>
                        <label style={styles.switch}>
                            <input 
                                type="checkbox" 
                                checked={formData.status === 'Active'} 
                                onChange={() => onStatusToggle(formData.id, formData.status === 'Active' ? 'Inactive' : 'Active')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                )}
            </div>
            
            <div style={styles.formGrid}>
                {/* Left Column: Text Fields */}
                <div>
                    <div style={styles.inputGroup}><label style={styles.label}>Business Name*</label><input name="name" value={formData.name} onChange={handleChange} style={{...styles.input, ...(errors.name && styles.inputError)}} className="input-focus" />{errors.name && <span style={styles.errorText}>{errors.name}</span>}</div>
                    <div style={styles.inputGroup}><label style={styles.label}>Business Description*</label><textarea name="description" value={formData.description} onChange={handleChange} style={{...styles.input, minHeight: '120px', ...(errors.description && styles.inputError)}} className="input-focus" />{errors.description && <span style={styles.errorText}>{errors.description}</span>}</div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                        <div style={styles.inputGroup}><label style={styles.label}>Category*</label><select name="category" value={formData.category} onChange={handleChange} style={{...styles.input, ...(errors.category && styles.inputError)}} className="input-focus"><option value="">Select type</option><option value="Restaurant">Restaurant</option><option value="Retail">Retail</option><option value="Services">Services</option><option value="Other">Other</option></select>{errors.category && <span style={styles.errorText}>{errors.category}</span>}</div>
                        <div style={styles.inputGroup}><label style={styles.label}>Location*</label><input name="address" value={formData.address} onChange={handleChange} style={{...styles.input, ...(errors.address && styles.inputError)}} className="input-focus" placeholder="City, Country" />{errors.address && <span style={styles.errorText}>{errors.address}</span>}</div>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                        <div style={styles.inputGroup}><label style={styles.label}>Contact Number*</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} style={{...styles.input, ...(errors.phoneNumber && styles.inputError)}} className="input-focus" />{errors.phoneNumber && <span style={styles.errorText}>{errors.phoneNumber}</span>}</div>
                        <div style={styles.inputGroup}><label style={styles.label}>Establishment Year</label><input type="number" name="establishmentYear" value={formData.establishmentYear} onChange={handleChange} style={styles.input} className="input-focus" min="1900" max={new Date().getFullYear()} /></div>
                    </div>
                    <div style={styles.inputGroup}><label style={styles.label}>Business Email (optional)</label><input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} className="input-focus" placeholder="contact@yourbusiness.com" /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Website URL (optional)</label><input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} style={styles.input} className="input-focus" placeholder="https://example.com" /></div>
                </div>

                {/* Right Column: Image Fields */}
                <div>
                    <ImageUploader label="Profile Picture" name="profileImageUrl" currentImage={previews.profileImageUrl} onChange={handleImageChange} error={errors.profileImageUrl} />
                    <ImageUploader label="Cover Image" name="coverImageUrl" currentImage={previews.coverImageUrl} onChange={handleImageChange} error={errors.coverImageUrl} />
                </div>
            </div>

            {/* Gallery Section */}
            <div style={{padding: '0 2rem 1.5rem'}}>
                <h3 style={{...styles.sectionTitle, fontSize: '1.1rem', marginBottom: '1rem'}}>Photo Gallery (up to 4 photos)</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                    {GALLERY_KEYS.map((key, idx) => (
                        <ImageUploader key={key} label={`Gallery ${idx + 1}`} name={key} currentImage={previews[key]} onChange={handleImageChange} error={errors[key]} />
                    ))}
                </div>
            </div>
            
            <div style={styles.formActions}>
                <button type="button" onClick={onCancel} style={styles.cancelButton} disabled={isSaving}><FaTimes/> Cancel</button>
                <button type="submit" style={styles.saveButton} disabled={isSaving}>
                    {isSaving ? <><FaSpinner className="spin"/> Saving...</> : <><FaSave/> Save Changes</>}
                </button>
            </div>
        </form>
    );
};


// =================================================================
// Main ManageBusiness Component
// =================================================================
function ManageBusiness() {
    // --- State Management ---
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState({ view: 'welcome', data: null }); // welcome, add, edit
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    // --- Data Fetching ---
    const fetchBusinesses = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchMyBusinesses();
            const normalized = data.map(b => ({
                id: b.id,
                name: b.name,
                description: b.description,
                category: b.category,
                address: b.address,
                phoneNumber: b.phone_number,
                email: b.email || '',
                websiteUrl: b.website_url || '',
                establishmentYear: b.establishment_year || '',
                status: b.status,
                avgRating: b.avg_rating || 0,
                totalReviews: b.total_reviews || 0,
                createdAt: b.created_at,
                profileImageUrl: b.profile_picture_url || null,
                coverImageUrl: b.cover_image_url || null,
                galleryImage1Preview: b.gallery_image_urls?.[0] || null,
                galleryImage2Preview: b.gallery_image_urls?.[1] || null,
                galleryImage3Preview: b.gallery_image_urls?.[2] || null,
                galleryImage4Preview: b.gallery_image_urls?.[3] || null,
            }));
            setBusinesses(normalized);
        } catch (err) {
            setError("Failed to load businesses. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBusinesses();
    }, [fetchBusinesses]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    // --- Event Handlers ---
    const handleSave = async (formData) => {
        setIsSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('description', formData.description);
            fd.append('category', formData.category);
            fd.append('address', formData.address);
            fd.append('phone_number', formData.phoneNumber);
            fd.append('email', formData.email || '');
            fd.append('website_url', formData.websiteUrl || '');
            if (formData.establishmentYear) fd.append('establishment_year', formData.establishmentYear);
            fd.append('status', formData.status || 'Active');

            if (formData.profileImageUrl instanceof File) fd.append('profile_picture', formData.profileImageUrl);
            if (formData.coverImageUrl instanceof File) fd.append('cover_image', formData.coverImageUrl);
            if (formData.galleryImage1 instanceof File) fd.append('gallery_image_1', formData.galleryImage1);
            if (formData.galleryImage2 instanceof File) fd.append('gallery_image_2', formData.galleryImage2);
            if (formData.galleryImage3 instanceof File) fd.append('gallery_image_3', formData.galleryImage3);
            if (formData.galleryImage4 instanceof File) fd.append('gallery_image_4', formData.galleryImage4);

            if (formData.id) {
                await updateBusinessWithImages(formData.id, fd);
                await fetchBusinesses();
                showNotification('Business updated successfully');
            } else {
                await createBusinessWithImages(fd);
                await fetchBusinesses();
                showNotification('Business created successfully');
            }
            setActiveView({ view: 'welcome' });
        } catch (err) {
            showNotification(err.message || 'Failed to save business.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusToggle = async (id, newStatus) => {
        try {
            await updateBusiness(id, { status: newStatus });
            const updatedBusinesses = businesses.map(b => b.id === id ? {...b, status: newStatus} : b);
            setBusinesses(updatedBusinesses);
            if (activeView.data?.id === id) {
                setActiveView(prev => ({ ...prev, data: { ...prev.data, status: newStatus } }));
            }
            showNotification(`Business status updated to ${newStatus}`);
        } catch (err) {
            showNotification('Failed to update status.', 'error');
        }
    };

    const filteredBusinesses = useMemo(() => businesses.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())), [businesses, searchTerm]);
    
    // --- Render Logic ---
    const renderActiveView = () => {
        switch (activeView.view) {
            case 'add':
                return <BusinessForm 
                    initialData={{ name: "", description: "", category: "", address: "", phoneNumber: "", email: "", websiteUrl: "", establishmentYear: "", profileImageUrl: null, coverImageUrl: null, galleryImage1: null, galleryImage2: null, galleryImage3: null, galleryImage4: null, status: 'Active' }}
                    onSave={handleSave}
                    onCancel={() => setActiveView({ view: 'welcome' })}
                    isSaving={isSaving}
                    onStatusToggle={handleStatusToggle}
                />;
            case 'edit':
                return <BusinessForm 
                    initialData={activeView.data}
                    onSave={handleSave}
                    onCancel={() => setActiveView({ view: 'welcome' })}
                    isSaving={isSaving}
                    onStatusToggle={handleStatusToggle}
                />;
            default:
                return (
                    <div style={styles.welcomePanel}>
                        <FaBuilding style={styles.welcomeIcon}/>
                        <h2 style={styles.welcomeTitle}>Manage Your Businesses</h2>
                        <p style={styles.welcomeText}>Select a business from the list to edit, or add a new one.</p>
                    </div>
                );
        }
    };

    if (loading) {
        return <div style={styles.loader}><FaSpinner className="spin"/> Loading Businesses...</div>;
    }
    
    if (error) {
        return <div style={styles.errorContainer}><FaExclamationTriangle style={styles.errorIcon}/><p>{error}</p><button onClick={fetchBusinesses} style={styles.retryButton}>Retry</button></div>;
    }

    return (
        <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--card-border); transition: .4s; border-radius: 28px; }
                .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
                input:checked + .slider { background-color: var(--button-bg); }
                input:checked + .slider:before { transform: translateX(22px); }
            `}</style>
            {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
            
            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <FaBuilding style={styles.heroIcon} />
                    <h1 style={styles.heroTitle}>Manage Business Profiles</h1>
                    <p style={styles.heroSubtitle}>Add, edit, or update your business listings.</p>
                </div>
            </section>
            
            <main style={styles.main}>
                <div style={styles.mainGrid}>
                    {/* Left Column: Business List */}
                    <div style={styles.listColumn}>
                        <div style={styles.listHeader}>
                            <div style={styles.searchContainer} className="input-focus">
                                <FaSearch style={styles.searchIcon} />
                                <input type="text" placeholder="Search businesses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                            </div>
                            <button onClick={() => setActiveView({ view: 'add' })} style={styles.addNewButton}><FaPlus /> Add New</button>
                        </div>
                        <div style={styles.businessList}>
                            {filteredBusinesses.length > 0 ? filteredBusinesses.map(biz => (
                                <div 
                                    key={biz.id} 
                                    style={activeView.data?.id === biz.id ? {...styles.businessCard, ...styles.businessCardActive} : styles.businessCard} 
                                    onClick={() => setActiveView({ view: 'edit', data: biz })}
                                >
                                    <img src={biz.profileImageUrl || `https://ui-avatars.com/api/?name=${biz.name.replace(/\s/g, '+')}&background=random`} alt={biz.name} style={styles.businessCardImage} />
                                    <div style={styles.businessCardContent}>
                                        <h4 style={activeView.data?.id === biz.id ? {...styles.businessCardTitle, ...styles.businessCardTitleActive} : styles.businessCardTitle}>
                                            {biz.name}
                                        </h4>
                                        <p style={styles.businessCardCategory}>{biz.category}</p>
                                    </div>
                                    <div style={{...styles.statusIndicator, backgroundColor: biz.status === 'Active' ? '#10B981' : '#6B7280'}}></div>
                                </div>
                            )) : (
                                <p style={{textAlign: 'center', opacity: 0.7, paddingTop: '2rem'}}>No businesses found.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Active View (Welcome, Add, or Edit) */}
                    <div style={styles.formColumn}>
                        {renderActiveView()}
                    </div>
                </div>
            </main>
        </div>
    );
};

// =================================================================
// Styles Object
// =================================================================
const styles = {
    // --- Page Layout ---
    hero: { padding: "4rem 2rem", backgroundColor: "var(--hero-bg)", borderBottom: "1px solid var(--card-border)", textAlign: "center" },
    heroContent: { maxWidth: "1400px", margin: "0 auto" },
    heroIcon: { fontSize: "3.5rem", color: "var(--hero-text)", marginBottom: "1rem", opacity: 0.9 },
    heroTitle: { fontSize: "2.8rem", fontWeight: "bold", color: "var(--hero-text)", margin: "0 0 0.5rem 0" },
    heroSubtitle: { fontSize: "1.1rem", color: "var(--text-color)", opacity: 0.9, margin: 0 },
    main: {         maxWidth: "1200px",
        margin: "2rem auto",
        padding: "0 2rem",
        padding: "0 2rem 2rem 2rem",
        marginBottom: '0rem', },
    mainGrid: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem', alignItems: 'start' },
    listColumn: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignSelf: 'stretch' },
    formColumn: {},
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem', fontSize: '1.2rem' },
    errorContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' },
    errorIcon: { fontSize: '3rem', color: '#ef4444' },
    retryButton: { padding: '0.8rem 1.5rem', backgroundColor: "var(--button-bg)", color: "white", border: 'none', borderRadius: '8px', cursor: 'pointer' },
    
    // --- Business List (Left Column) ---
    listHeader: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' },
    searchContainer: { display: "flex", alignItems: "center", gap: "0.5rem", width: "90%", backgroundColor: "var(--bg-color)", borderRadius: "8px", padding: "0.5rem 1rem", border: '2px solid var(--card-border)' },
    searchInput: { flex: 1, border: "none", outline: "none", backgroundColor: "transparent", color: "var(--text-color)", fontSize: "0.9rem" },
    searchIcon: { opacity: 0.5 },
    addNewButton: { display: "flex", alignItems: "center", justifyContent: 'center', gap: "0.5rem", padding: "0.8rem", backgroundColor: "var(--button-bg)", color: "white", borderRadius: "8px", fontWeight: "600", border: 'none', cursor: 'pointer' },
    businessList: { overflowY: 'auto', flex: 1, paddingRight: '10px' },
    businessCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '8px', cursor: 'pointer', border: '2px solid transparent', position: 'relative', overflow: 'hidden', transition: 'all 0.2s ease-in-out' },
    businessCardActive: { borderColor: 'var(--button-bg)', backgroundColor: 'var(--hero-bg)' },
    businessCardImage: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--card-border)' },
    businessCardContent: { flex: 1 },
    businessCardTitle: { fontWeight: '700', fontSize: '1.05rem', margin: '0 0 0.3rem 0', color: 'var(--header-text)', transition: 'color 0.2s ease-in-out' },
    businessCardTitleActive: { color: 'var(--button-bg)' },
    businessCardCategory: { fontSize: '0.85rem', opacity: 0.7, margin: '0.25rem 0 0 0' },
    statusIndicator: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '4px', height: '50%', borderRadius: '0 2px 2px 0' },
    
    // --- Form Panel (Right Column) ---
    formPanel: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)' },
    formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', paddingTop: '2rem' },
    sectionTitle: { fontSize: "1.5rem", fontWeight: "bold", color: "var(--header-text)", margin: "0" },
    formGrid: { padding: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' },
    inputGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500' },
    input: { width: '100%', padding: '0.8rem 1rem', backgroundColor: 'var(--bg-color)', border: '2px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '1rem', outline: 'none' },
    inputError: { borderColor: '#EF4444' },
    errorText: { display: 'block', marginTop: '0.5rem', color: '#EF4444', fontSize: '0.85rem' },
    imageUploader: { width: '100%', height: '160px', borderRadius: '12px', border: '2px dashed var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--hero-bg)' },
    imagePreview: { width: '100%', height: '100%', objectFit: 'cover' },
    uploadOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', gap: '0.5rem' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--card-border)', backgroundColor: 'var(--hero-bg)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' },
    cancelButton: { padding: '0.8rem 1.5rem', backgroundColor: 'transparent', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', cursor: 'pointer', fontWeight: '500' },
    saveButton: { padding: '0.8rem 1.5rem', backgroundColor: 'var(--button-bg)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    statusToggleContainer: { display: 'flex', alignItems: 'center', gap: '1rem' },
    statusBadge: { padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
    activeStatus: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' },
    inactiveStatus: { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280' },
    switch: { position: 'relative', display: 'inline-block', width: '50px', height: '28px' },
    
    // --- Welcome View ---
    welcomePanel: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '600px' }, // Set a min-height
    welcomeIcon: { fontSize: '4rem', color: 'var(--button-bg)', opacity: 0.7, marginBottom: '1.5rem' },
    welcomeTitle: { fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--header-text)', margin: '0 0 1rem 0' },
    welcomeText: { fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6, maxWidth: '400px' },

    // --- Notification ---
    notification: { position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', zIndex: 1000 },
    notificationSuccess: { backgroundColor: '#10B981', color: 'white' },
    notificationError: { backgroundColor: '#EF4444', color: 'white' },
    notificationDismiss: { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '1rem', fontSize: '1.2rem' },
};

export default ManageBusiness;

