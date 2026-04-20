import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAdminWallet,
  setAdminWallet,
  fetchMyProfile,
  updateMyProfile,
  updateMyProfileWithPicture,
  fetchPlatformPolicies,
  savePlatformPolicies,
} from '../../services/api';
import { requestMetaMaskAccounts } from '../../utils/walletConnection';
import {
  FaEthereum,
  FaCopy,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaWallet,
  FaUser,
  FaCamera,
  FaSave,
  FaChevronDown,
  FaShieldAlt,
  FaFileContract,
  FaUserSecret,
  FaGift,
} from 'react-icons/fa';

const parsePolicyContent = (rawText = '') => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = [];
  let intro = '';
  let current = null;

  lines.forEach((line) => {
    if (/^\d+\.\s+/.test(line)) {
      if (current) sections.push(current);
      current = { title: line, body: '' };
      return;
    }
    if (current) {
      current.body = current.body ? `${current.body}\n${line}` : line;
    } else {
      intro = intro ? `${intro}\n${line}` : line;
    }
  });

  if (current) sections.push(current);
  return { intro, sections };
};

function PolicyPreview({ value }) {
  const parsed = parsePolicyContent(value);
  if (!value?.trim()) {
    return <p className="text-sm text-slate-400">No policy text yet.</p>;
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
      <aside className="rounded-xl border border-chain-border bg-chain-card p-4">
        <p className="mb-2 text-base font-semibold text-chain-header">Table of Contents</p>
        <ul className="space-y-2 text-sm text-slate-300">
          {parsed.sections.length ? parsed.sections.map((section) => <li key={section.title}>{section.title}</li>) : <li>Overview</li>}
        </ul>
      </aside>
      <div className="space-y-3">
        {parsed.intro && (
          <div className="rounded-xl border border-chain-border bg-chain-card p-4">
            <p className="text-sm leading-relaxed text-chain-text">{parsed.intro}</p>
          </div>
        )}
        {parsed.sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-chain-border bg-chain-card">
            <div className="border-b border-chain-border px-4 py-3 text-lg font-semibold text-chain-header">{section.title}</div>
            <div className="px-4 py-3 text-sm leading-relaxed text-chain-text whitespace-pre-wrap">{section.body || 'No details added.'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PolicyBlock({ icon, title, value, onChange }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-xl border border-chain-border bg-chain-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium text-chain-header hover:bg-chain-hero/60"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <FaChevronDown className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-chain-border p-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={14}
              className="w-full resize-y rounded-lg border border-chain-border bg-chain-bg px-3 py-2 text-sm leading-relaxed text-chain-text outline-none focus:border-chain-accent"
              placeholder={`Enter ${title.toLowerCase()}...`}
            />
            <PolicyPreview value={value} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [adminWallet, setAdminWalletState] = useState('');
  const [walletLoading, setWalletLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletSaving, setWalletSaving] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', username: '', phone: '' });
  const [fullName, setFullName] = useState('');
  const [emailReadonly, setEmailReadonly] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const profileFileInputRef = useRef(null);

  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [rewardRules, setRewardRules] = useState('');
  const [policiesLoading, setPoliciesLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [errorBanner, setErrorBanner] = useState('');
  const [savingAll, setSavingAll] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadWallet = useCallback(async () => {
    try {
      setWalletLoading(true);
      const data = await fetchAdminWallet();
      const addr = data.admin_wallet_address || '';
      setAdminWalletState(addr);
      setManualAddress(addr);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const data = await fetchMyProfile();
      const p = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        username: data.username || '',
        phone: data.phone || '',
      };
      setProfileForm(p);
      setFullName(`${p.first_name} ${p.last_name}`.trim());
      setEmailReadonly(data.email || '');
      setProfilePicturePreview(data.profile_picture_url || null);
      setProfilePictureFile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadPolicies = useCallback(async () => {
    try {
      setPoliciesLoading(true);
      const data = await fetchPlatformPolicies();
      setTerms(data.terms || '');
      setPrivacy(data.privacy || '');
      setRewardRules(data.reward_rules || '');
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
    loadProfile();
    loadPolicies();
  }, [loadWallet, loadProfile, loadPolicies]);

  const handleFullNameChange = (e) => {
    const v = e.target.value;
    setFullName(v);
    const parts = v.trim().split(/\s+/);
    setProfileForm((prev) => ({ ...prev, first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' }));
  };

  const handleProfileField = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    setErrorBanner('');
    try {
      const accounts = await requestMetaMaskAccounts();
      if (!accounts?.length) {
        setErrorBanner('No accounts found in MetaMask.');
        return;
      }
      const address = accounts[0];
      await setAdminWallet(address);
      setAdminWalletState(address);
      setManualAddress(address);
      showToast(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (e) {
      setErrorBanner('MetaMask connection cancelled or failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = () => {
    if (adminWallet) {
      navigator.clipboard.writeText(adminWallet);
      showToast('Address copied to clipboard');
    }
  };

  const saveManualWallet = async () => {
    if (!manualAddress?.trim() || manualAddress.trim().length < 10) {
      setErrorBanner('Enter a valid wallet address.');
      return;
    }
    setWalletSaving(true);
    setErrorBanner('');
    try {
      await setAdminWallet(manualAddress.trim());
      setAdminWalletState(manualAddress.trim());
      showToast('Wallet address saved');
    } catch (e) {
      setErrorBanner('Failed to save wallet address.');
    } finally {
      setWalletSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setErrorBanner('');
    try {
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('first_name', profileForm.first_name);
        formData.append('last_name', profileForm.last_name);
        formData.append('username', profileForm.username);
        formData.append('phone', profileForm.phone);
        formData.append('profile_picture', profilePictureFile);
        await updateMyProfileWithPicture(formData);
      } else {
        await updateMyProfile(profileForm);
      }

      if (manualAddress?.trim() && manualAddress.trim() !== adminWallet) {
        await setAdminWallet(manualAddress.trim());
        setAdminWalletState(manualAddress.trim());
      }

      await savePlatformPolicies({ terms, privacy, reward_rules: rewardRules });
      setProfilePictureFile(null);
      await loadProfile();
      await loadWallet();
      await loadPolicies();
      showToast('All changes saved successfully');
    } catch (err) {
      const msg = err?.data?.detail || err?.data?.username?.[0] || err?.message || 'Could not save all changes.';
      setErrorBanner(msg);
    } finally {
      setSavingAll(false);
    }
  };

  const busy = profileLoading || walletLoading || policiesLoading;

  return (
    <div className="relative min-h-screen bg-chain-bg pb-32 text-chain-text">
      <section className="border-b border-chain-border bg-chain-hero px-4 py-10 sm:py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <FaShieldAlt className="text-4xl text-chain-accent sm:text-5xl" />
          <div>
            <h1 className="text-3xl font-bold text-chain-header">Settings</h1>
            <p className="mt-1 text-sm opacity-90 sm:text-base">
              Admin identity, blockchain connectivity, and platform policies for ChainProof.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {errorBanner && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <FaExclamationCircle />
            {errorBanner}
          </div>
        )}

        {toast && (
          <div
            className={`fixed left-1/2 top-20 z-[1020] flex -translate-x-1/2 items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <FaCheckCircle />
            {toast.message}
          </div>
        )}

        <section className="rounded-2xl border border-chain-border bg-chain-card p-5 shadow-chain sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <FaUser className="text-2xl text-chain-accent" />
            <div>
              <h2 className="text-xl font-semibold text-chain-header">Admin profile</h2>
              <p className="text-sm opacity-75">Full name, username, phone, and profile picture.</p>
            </div>
          </div>

          {busy ? (
            <div className="flex justify-center py-12 text-chain-accent">
              <FaSpinner className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-8 md:flex-row">
              <div className="flex flex-col items-center gap-3">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-chain-border bg-chain-bg">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <FaUser className="text-4xl" />
                    </div>
                  )}
                </div>
                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setProfilePictureFile(f || null);
                    if (f) setProfilePicturePreview(URL.createObjectURL(f));
                  }}
                />
                <button
                  type="button"
                  onClick={() => profileFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-chain-border bg-chain-bg px-4 py-2 text-sm font-medium text-chain-text hover:border-chain-accent/50"
                >
                  <FaCamera />
                  Change profile picture
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Full name
                  <input
                    type="text"
                    value={fullName}
                    onChange={handleFullNameChange}
                    className="mt-1 w-full rounded-xl border-2 border-chain-border bg-chain-bg px-4 py-3 text-chain-text outline-none focus:border-chain-accent"
                    placeholder="e.g. Muhammad Anas"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-300">
                  Username
                  <input
                    type="text"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileField}
                    className="mt-1 w-full rounded-xl border-2 border-chain-border bg-chain-bg px-4 py-3 text-chain-text outline-none focus:border-chain-accent"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-300">
                  Phone
                  <input
                    type="text"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileField}
                    className="mt-1 w-full rounded-xl border-2 border-chain-border bg-chain-bg px-4 py-3 text-chain-text outline-none focus:border-chain-accent"
                    placeholder="e.g. 0300-1234567"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-300">
                  Email
                  <input
                    type="text"
                    value={emailReadonly}
                    disabled
                    className="mt-1 w-full cursor-not-allowed rounded-xl border-2 border-chain-border bg-chain-hero px-4 py-3 opacity-70"
                  />
                  <span className="mt-1 block text-xs text-slate-500">Email cannot be changed.</span>
                </label>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-chain-border bg-chain-card p-5 shadow-chain sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <FaWallet className="text-2xl text-amber-500" />
            <div>
              <h2 className="text-xl font-semibold text-chain-header">Blockchain configuration</h2>
              <p className="text-sm opacity-75">Admin MetaMask wallet visible to users for payments.</p>
            </div>
          </div>

          {walletLoading ? (
            <div className="flex justify-center py-8 text-chain-accent">
              <FaSpinner className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {adminWallet && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Current admin wallet</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="min-w-0 flex-1 break-all text-sm text-chain-text">{adminWallet}</code>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-chain-accent px-3 py-2 text-sm font-medium text-white"
                    >
                      <FaCopy />
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-chain-header">
                  <FaEthereum className="text-orange-400" />
                  Reconnect with MetaMask
                </h3>
                <button
                  type="button"
                  onClick={handleConnectMetaMask}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f6851b] px-5 py-3 font-semibold text-white shadow transition hover:brightness-110 disabled:opacity-60"
                >
                  {isConnecting ? <FaSpinner className="animate-spin" /> : <FaEthereum />}
                  {adminWallet ? 'Reconnect / change wallet' : 'Connect MetaMask'}
                </button>
              </div>

              <div className="border-t border-chain-border pt-6">
                <h3 className="mb-2 text-sm font-semibold text-chain-header">Or set address manually</h3>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="0x..."
                    className="min-w-0 flex-1 rounded-xl border-2 border-chain-border bg-chain-bg px-4 py-3 text-chain-text outline-none focus:border-chain-accent"
                  />
                  <button
                    type="button"
                    onClick={saveManualWallet}
                    disabled={walletSaving}
                    className="rounded-xl bg-slate-700 px-5 py-3 font-medium text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    {walletSaving ? 'Saving...' : 'Save address'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-chain-border bg-chain-card p-5 shadow-chain sm:p-8">
          <h2 className="mb-2 text-xl font-semibold text-chain-header">Platform policies (CMS)</h2>
          <p className="mb-6 text-sm opacity-75">Editable copy for public pages.</p>

          {policiesLoading ? (
            <div className="flex justify-center py-8 text-chain-accent">
              <FaSpinner className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <PolicyBlock icon={<FaFileContract className="text-sky-400" />} title="Terms & Conditions" value={terms} onChange={setTerms} />
              <PolicyBlock icon={<FaUserSecret className="text-violet-400" />} title="Privacy Policy" value={privacy} onChange={setPrivacy} />
              <PolicyBlock icon={<FaGift className="text-amber-400" />} title="Reward eligibility rules (SRT)" value={rewardRules} onChange={setRewardRules} />
              <div className="rounded-xl border border-chain-border bg-chain-bg px-4 py-3 text-sm text-slate-300">
                SRT rules are displayed publicly in the Terms/Policy pages and used by admin/business wallet and rewards flows.
              </div>
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={handleSaveAll}
        disabled={savingAll || busy}
        className="fixed bottom-6 right-4 z-[1020] inline-flex items-center gap-2 rounded-full bg-chain-accent px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/40 transition hover:brightness-110 disabled:opacity-50 sm:bottom-8 sm:right-8"
      >
        {savingAll ? <FaSpinner className="animate-spin" /> : <FaSave />}
        Save all changes
      </button>
    </div>
  );
}
