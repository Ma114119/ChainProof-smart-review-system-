// =================================================================
// FILE: src/services/api.js
// Central API service layer with JWT token management.
// =================================================================

// In dev with proxy: use '' so requests go to same origin and get proxied to backend
// Otherwise use REACT_APP_API_URL or default backend URL
const BASE_URL = (typeof process.env.NODE_ENV !== 'undefined' && process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL)
  ? ''
  : (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000');

// --- Token Helpers ---
export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const saveAuthData = (data) => {
  localStorage.setItem('accessToken', data.access);
  localStorage.setItem('refreshToken', data.refresh);
  localStorage.setItem('userRole', data.role);
  localStorage.setItem('userId', data.user_id);
  localStorage.setItem('username', data.username);
  localStorage.setItem('email', data.email);
};

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('walletAddress');
};

// --- Core Fetch Wrapper ---
const apiFetch = async (endpoint, options = {}) => {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthData();
    window.location.href = '/login';
    return;
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (contentType.includes('text/html')) {
      const err = new Error('Server returned an error page. Please check the backend is running and the API URL is correct.');
      err.data = { detail: 'Invalid server response (expected JSON, got HTML).' };
      throw err;
    }
    throw e;
  }

  if (!response.ok) {
    const error = new Error(data?.detail || JSON.stringify(data) || 'API Error');
    error.data = data;
    throw error;
  }

  return data;
};

// Login fetch: do NOT redirect on 401 (wrong password) — let Login component show error
const loginFetch = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.detail || JSON.stringify(data) || 'API Error');
    error.data = data;
    throw error;
  }
  return data;
};

// =================================================================
// AUTH
// =================================================================

export const apiLogin = (email, password) =>
  loginFetch('/api/login/', {
    method: 'POST',
    body: JSON.stringify({ username: email, password }),
  });

export const apiRegister = (payload) =>
  apiFetch('/api/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// =================================================================
// PUBLIC BUSINESSES (no auth needed)
// =================================================================

export const fetchPublicBusinesses = (search = '', category = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);
  const query = params.toString();
  return apiFetch(`/api/public/businesses/${query ? `?${query}` : ''}`);
};

export const fetchPublicBusiness = (id) =>
  apiFetch(`/api/public/businesses/${id}/`);

export const fetchPublicReviews = (businessId) =>
  apiFetch(`/api/businesses/${businessId}/reviews/`);

// =================================================================
// BUSINESSES (owner / admin)
// =================================================================

export const fetchMyBusinesses = (search = '', status = '', category = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'All') params.append('status', status);
  if (category && category !== 'All') params.append('category', category);
  const query = params.toString();
  return apiFetch(`/api/businesses/${query ? `?${query}` : ''}`);
};

export const createBusiness = (data) =>
  apiFetch('/api/businesses/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateBusiness = (id, data) =>
  apiFetch(`/api/businesses/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteBusiness = (id) =>
  apiFetch(`/api/businesses/${id}/`, { method: 'DELETE' });

/** Admin: transfer business to another owner */
export const transferBusinessOwner = (businessId, newOwnerId) =>
  apiFetch(`/api/admin/businesses/${businessId}/transfer-owner/`, {
    method: 'POST',
    body: JSON.stringify({ new_owner_id: newOwnerId }),
  });

const _multipartFetch = (endpoint, method, formData) => {
  const token = getAccessToken();
  return fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  }).then(async (response) => {
    if (response.status === 401) { clearAuthData(); window.location.href = '/login'; return; }
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) { const error = new Error(data?.detail || JSON.stringify(data) || 'API Error'); error.data = data; throw error; }
    return data;
  });
};

export const createBusinessWithImages = (formData) =>
  _multipartFetch('/api/businesses/', 'POST', formData);

export const updateBusinessWithImages = (id, formData) =>
  _multipartFetch(`/api/businesses/${id}/`, 'PATCH', formData);

// =================================================================
// REVIEWS
// =================================================================

export const fetchReviews = (businessId) =>
  apiFetch(`/api/businesses/${businessId}/reviews/`);

export const submitReview = (businessId, data) =>
  apiFetch(`/api/businesses/${businessId}/reviews/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchMyReviews = () => apiFetch('/api/my-reviews/');

// =================================================================
// ADMIN: USER MANAGEMENT
// =================================================================

export const fetchAdminUsers = (search = '', role = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (role && role !== 'all') params.append('role', role);
  const query = params.toString();
  return apiFetch(`/api/admin/users/${query ? `?${query}` : ''}`);
};

export const updateUser = (id, data) =>
  apiFetch(`/api/admin/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteUser = (id) =>
  apiFetch(`/api/admin/users/${id}/`, { method: 'DELETE' });

// =================================================================
// ADMIN: REVIEW MODERATION
// =================================================================

export const fetchAdminReviews = (search = '', status = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'All') params.append('status', status);
  const query = params.toString();
  return apiFetch(`/api/admin/reviews/${query ? `?${query}` : ''}`);
};

export const updateReviewStatus = (id, reviewStatus) =>
  apiFetch(`/api/admin/reviews/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: reviewStatus }),
  });

export const deleteAdminReview = (id) =>
  apiFetch(`/api/admin/reviews/${id}/`, { method: 'DELETE' });

// =================================================================
// AI
// =================================================================

export const fetchAiSuggestion = (businessName, category, sentiment) =>
  apiFetch('/api/ai/suggest/', {
    method: 'POST',
    body: JSON.stringify({ business_name: businessName, category, sentiment }),
  });

// =================================================================
// MY PROFILE (authenticated user's own profile)
// =================================================================

export const fetchMyProfile = () => apiFetch('/api/me/');

export const updateMyProfile = (data) =>
  apiFetch('/api/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const updateMyProfileWithPicture = (formData) => {
  const token = getAccessToken();
  return fetch(`${BASE_URL}/api/me/`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  }).then(async (response) => {
    if (response.status === 401) {
      clearAuthData();
      window.location.href = '/login';
      return;
    }
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data?.detail || JSON.stringify(data) || 'API Error');
      error.data = data;
      throw error;
    }
    return data;
  });
};

export const changePassword = (data) =>
  apiFetch('/api/me/change-password/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteMyAccount = () =>
  apiFetch('/api/me/delete/', { method: 'DELETE' });

// =================================================================
// BOOKMARKS
// =================================================================

export const fetchMyBookmarks = () => apiFetch('/api/bookmarks/');

export const addBookmark = (businessId) =>
  apiFetch(`/api/bookmarks/${businessId}/`, { method: 'POST' });

export const removeBookmark = (businessId) =>
  apiFetch(`/api/bookmarks/${businessId}/remove/`, { method: 'DELETE' });

// =================================================================
// ADMIN WALLET
// =================================================================

export const fetchAdminWallet = () => apiFetch('/api/admin-wallet/');

export const setAdminWallet = (walletAddress) =>
  apiFetch('/api/admin-wallet/set/', {
    method: 'POST',
    body: JSON.stringify({ wallet_address: walletAddress }),
  });

// =================================================================
// ADMIN FINANCIALS
// =================================================================

export const fetchFinancials = () => apiFetch('/api/admin/financials/');

export const updateExchangeRate = (rate) =>
  apiFetch('/api/admin/financials/rate/', {
    method: 'POST',
    body: JSON.stringify({ exchange_rate: rate }),
  });

export const adminTransferCoins = (walletAddress, amount) =>
  apiFetch('/api/admin/financials/transfer/', {
    method: 'POST',
    body: JSON.stringify({ wallet_address: walletAddress, amount }),
  });

export const fetchAdminPaymentDetails = () => apiFetch('/api/admin/payment-details/');  // Public - owner/customer pages + admin load

export const saveAdminPaymentDetails = (data) =>
  apiFetch('/api/admin/payment-details/save/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const ownerRequestBuyCoins = (data, paymentProofFile = null) => {
  if (paymentProofFile) {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v != null ? v : ''));
    formData.append('payment_proof_image', paymentProofFile);
    const token = getAccessToken();
    return fetch(`${BASE_URL}/api/owner/buy-coins/`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    }).then(async (response) => {
      if (response.status === 401) { clearAuthData(); window.location.href = '/login'; return; }
      const resData = await response.json();
      if (!response.ok) { const err = new Error(resData?.detail || 'API Error'); err.data = resData; throw err; }
      return resData;
    });
  }
  return apiFetch('/api/owner/buy-coins/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const fetchOwnerWalletBalance = () => apiFetch('/api/owner/wallet-balance/');

export const fetchOwnerTransactions = () => apiFetch('/api/owner/transactions/');

export const customerRequestSellCoins = (data) =>
  apiFetch('/api/customer/sell-coins/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchAdminPurchaseRequests = () => apiFetch('/api/admin/purchase-requests/');

export const fetchAdminPayoutRequests = () => apiFetch('/api/admin/payout-requests/');

export const submitContactForm = async (data, attachmentFile = null) => {
  const url = `${BASE_URL || ''}/api/contact/`;
  if (attachmentFile) {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v != null ? String(v) : ''));
    formData.append('attachment', attachmentFile);
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    let d;
    try {
      d = await res.json();
    } catch (e) {
      throw new Error('Server returned invalid response. Is the backend running?');
    }
    if (!res.ok) {
      const err = new Error(d?.detail || Array.isArray(d?.message) ? d.message.join(' ') : 'Failed to send message');
      err.data = d;
      throw err;
    }
    return d;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  let d;
  try {
    d = await res.json();
  } catch (e) {
    throw new Error('Server returned invalid response. Is the backend running?');
  }
  if (!res.ok) {
    const err = new Error(d?.detail || Array.isArray(d?.message) ? d.message.join(' ') : 'Failed to send message');
    err.data = d;
    throw err;
  }
  return d;
};

export const fetchAdminContactSubmissions = () => apiFetch('/api/admin/contact-submissions/');

export const updateContactSubmissionStatus = (id, status) =>
  apiFetch(`/api/admin/contact-submissions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// Support messages (customer/owner <-> admin)
export const fetchMySupportMessages = () => apiFetch('/api/support/messages/');
export const sendSupportMessage = (message, attachmentFile = null) => {
  const url = `${BASE_URL || ''}/api/support/send/`;
  if (attachmentFile) {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('attachment', attachmentFile);
    return fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      body: formData,
    }).then(async (res) => {
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.detail || 'Failed to send');
      return d;
    });
  }
  return apiFetch('/api/support/send/', { method: 'POST', body: JSON.stringify({ message }) });
};
export const fetchCustomerBalance = () => apiFetch('/api/customer/balance/');
export const adminCreditCustomerCoins = (userId, amount) =>
  apiFetch(`/api/admin/credit-customer-coins/${userId}/`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
export const fetchUnreadSupportCount = () => apiFetch('/api/support/unread-count/');
export const fetchAdminSupportThreads = () => apiFetch('/api/admin/support-threads/');
export const fetchAdminThreadMessages = (threadId) =>
  apiFetch(`/api/admin/support-threads/${threadId}/messages/`);
export const adminReplySupport = (threadId, message) =>
  apiFetch(`/api/admin/support-threads/${threadId}/reply/`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

export const adminCompletePurchaseRequest = (id) =>
  apiFetch(`/api/admin/purchase-requests/${id}/complete/`, { method: 'POST' });

export const adminCompletePayoutRequest = (id) =>
  apiFetch(`/api/admin/payout-requests/${id}/complete/`, { method: 'POST' });

export const adminRejectPayoutRequest = (id) =>
  apiFetch(`/api/admin/payout-requests/${id}/reject/`, { method: 'POST' });

// =================================================================
// STATS (Admin + Owner Dashboards)
// =================================================================

export const fetchStats = () => apiFetch('/api/stats/');
