import React, { useEffect, useRef, useState } from 'react';
import { fetchUnreadSupportCount, fetchAdminContactSubmissions, fetchAdminSupportThreads } from '../services/api';

const POLL_INTERVAL = 45000; // 45 seconds

export default function MessageNotificationPoller() {
  const prevCountRef = useRef(null);
  const [role, setRole] = useState(() => localStorage.getItem('userRole'));

  useEffect(() => {
    const sync = () => setRole(localStorage.getItem('userRole'));
    window.addEventListener('authChanged', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('authChanged', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!role || role === 'public') return;

    const poll = async () => {
      try {
        if (role === 'admin') {
          const [contacts, threads] = await Promise.all([
            fetchAdminContactSubmissions().catch(() => []),
            fetchAdminSupportThreads().catch(() => []),
          ]);
          const openContact = (contacts || []).filter(c => c.status === 'Open').length;
          const unreadSupport = (threads || []).reduce((s, t) => s + (t.unread_count || 0), 0);
          const total = openContact + unreadSupport;
          if (prevCountRef.current !== null && total > prevCountRef.current && total > 0) {
            notify('ChainProof', `You have ${total} new message(s) in your inbox.`);
          }
          prevCountRef.current = total;
        } else if (role === 'customer' || role === 'owner') {
          const res = await fetchUnreadSupportCount();
          const count = res?.count ?? 0;
          if (prevCountRef.current !== null && count > prevCountRef.current && count > 0) {
            notify('ChainProof', `You have ${count} new message(s) from admin.`);
          }
          prevCountRef.current = count;
        }
      } catch (e) {
        // ignore
      }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [role]);

  return null;
}

function notify(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/chainproof-logo.png' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body, icon: '/chainproof-logo.png' });
    });
  }
}
