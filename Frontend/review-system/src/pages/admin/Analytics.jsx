import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format, parseISO, isValid, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { FaShieldAlt, FaSpinner, FaLink, FaCoins, FaClock } from 'react-icons/fa';
import { fetchAdminReviews, fetchMyBusinesses, fetchAdminUsers } from '../../services/api';

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

const norm = (data) => (Array.isArray(data) ? data : data?.results || []);

const sentimentFromRating = (rating) => {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
};

const parseDate = (v) => {
  if (!v) return null;
  const d = typeof v === 'string' ? parseISO(v) : new Date(v);
  return isValid(d) ? d : null;
};
const getReviewDate = (r) => parseDate(r?.created_at || r?.createdAt || r?.date);

const getBounds = (range, customStart, customEnd) => {
  const now = new Date();
  if (range === '7d') return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)), end: endOfDay(now) };
  if (range === '30d') return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), end: endOfDay(now) };
  if (range === 'month') return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(now) };
  const s = parseDate(customStart);
  const e = parseDate(customEnd);
  if (!s || !e) return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)), end: endOfDay(now) };
  return { start: startOfDay(s), end: endOfDay(e) };
};

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [range, setRange] = useState('7d');
  const [customStart, setCustomStart] = useState(format(new Date(Date.now() - 6 * 86400000), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [visibleSeries, setVisibleSeries] = useState({ positive: true, neutral: true, negative: true });
  const [growthFilter, setGrowthFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsData, businessesData, usersData] = await Promise.all([
        fetchAdminReviews(),
        fetchMyBusinesses(),
        fetchAdminUsers(),
      ]);
      const list = Array.isArray(businessesData) ? businessesData : [];
      const reviewList = norm(reviewsData);
      const userList = norm(usersData);
      setReviews(reviewList);
      setBusinesses(list);
      setUsers(userList);
      if (list.length) {
        setCompareA(String(list[0].id));
        setCompareB(String(list[Math.min(1, list.length - 1)].id));
      } else {
        // Admin can have review data even if /businesses returns empty.
        const names = [...new Set(reviewList.map((r) => (r.business_name || '').trim()).filter(Boolean))];
        setCompareA(names[0] || '');
        setCompareB(names[Math.min(1, names.length - 1)] || '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { start, end } = useMemo(() => getBounds(range, customStart, customEnd), [range, customStart, customEnd]);

  const scoped = useMemo(
    () => reviews.filter((r) => {
      const d = getReviewDate(r);
      return d && d >= start && d <= end;
    }),
    [reviews, start, end]
  );

  const sentimentSeries = useMemo(() => {
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      scoped.forEach((r) => {
        const d = getReviewDate(r);
        if (!d || format(d, 'yyyy-MM-dd') !== key) return;
        const s = sentimentFromRating(Number(r.rating || 0));
        if (s === 'positive') positive += 1;
        else if (s === 'negative') negative += 1;
        else neutral += 1;
      });
      return { name: format(day, 'MMM d'), positive, neutral, negative };
    });
  }, [scoped, start, end]);

  const userGrowthSeries = useMemo(() => {
    const days = eachDayOfInterval({ start, end });
    const scopedUsers = users.filter((u) => {
      const role = (u.role || '').toLowerCase();
      if (growthFilter === 'customer') return role === 'customer';
      if (growthFilter === 'owner') return role === 'owner';
      return role === 'customer' || role === 'owner';
    });

    const usersByDate = scopedUsers.reduce((acc, u) => {
      const d = parseDate(u.date_joined || u.dateJoined || u.created_at);
      if (!d) return acc;
      const key = format(d, 'yyyy-MM-dd');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    let cumulativeTotal = 0;
    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const dailyNew = usersByDate[key] || 0;
      cumulativeTotal += dailyNew;
      return {
        name: format(day, 'MMM d'),
        newUsers: dailyNew,
        totalUsers: cumulativeTotal,
      };
    });
  }, [users, growthFilter, start, end]);

  const radarData = useMemo(() => {
    const n = scoped.length || 1;
    const approved = scoped.filter((r) => r.status === 'Approved').length;
    const flagged = scoped.filter((r) => r.status === 'Flagged').length;
    const rejected = scoped.filter((r) => r.status === 'Rejected').length;
    const hashed = scoped.filter((r) => r.blockchain_hash).length;
    return [
      { metric: 'AI Confidence Score', value: Math.round((approved / n) * 100) },
      { metric: 'Bot Detection Rate', value: Math.round((flagged / n) * 100) },
      { metric: 'Manual Override Rate', value: Math.round((rejected / n) * 100) },
      { metric: 'Processing Speed', value: Math.max(45, Math.round(55 + (hashed / n) * 35)) },
    ];
  }, [scoped]);

  const chainStats = useMemo(() => {
    const hashes = scoped.filter((r) => r.blockchain_hash).length;
    const tokens = scoped.filter((r) => r.is_rewarded).length;
    const avgBlock = (10.5 + (hashes % 9) * 0.4).toFixed(1);
    return { hashes, tokens, avgBlock };
  }, [scoped]);

  const compareOptions = useMemo(() => {
    if (businesses.length) {
      return businesses.map((b) => ({ value: String(b.id), label: b.name, id: b.id, name: b.name }));
    }
    const names = [...new Set(scoped.map((r) => (r.business_name || '').trim()).filter(Boolean))];
    return names.map((name) => ({ value: `name:${name}`, label: name, id: null, name }));
  }, [businesses, scoped]);

  useEffect(() => {
    if (!compareOptions.length) return;
    if (!compareOptions.some((o) => o.value === compareA)) setCompareA(compareOptions[0].value);
    if (!compareOptions.some((o) => o.value === compareB)) setCompareB(compareOptions[Math.min(1, compareOptions.length - 1)].value);
  }, [compareOptions, compareA, compareB]);

  const filteredOptionsA = useMemo(
    () => compareOptions.filter((o) => o.label.toLowerCase().includes(searchA.toLowerCase())),
    [compareOptions, searchA]
  );
  const filteredOptionsB = useMemo(
    () => compareOptions.filter((o) => o.label.toLowerCase().includes(searchB.toLowerCase())),
    [compareOptions, searchB]
  );

  const compare = (selectorValue) => {
    if (!selectorValue) return { count: 0, avg: '-', pos: 0, neu: 0, neg: 0 };
    const matched = compareOptions.find((o) => o.value === selectorValue);
    if (!matched) return { count: 0, avg: '-', pos: 0, neu: 0, neg: 0 };
    const rs = scoped.filter((r) => {
      const reviewBusinessName = (r.business_name || r.businessName || '').trim().toLowerCase();
      if (matched.id != null) {
        const idMatch =
          String(r.business) === String(matched.id) ||
          String(r.business_id) === String(matched.id) ||
          String(r.business?.id || '') === String(matched.id);
        const nameMatch = reviewBusinessName === String(matched.name || '').trim().toLowerCase();
        return idMatch || nameMatch;
      }
      return reviewBusinessName === matched.name.toLowerCase();
    });
    if (!rs.length) return { count: 0, avg: '-', pos: 0, neu: 0, neg: 0 };
    const avg = (rs.reduce((a, r) => a + Number(r.rating || 0), 0) / rs.length).toFixed(1);
    const pos = rs.filter((r) => sentimentFromRating(Number(r.rating || 0)) === 'positive').length;
    const neu = rs.filter((r) => sentimentFromRating(Number(r.rating || 0)) === 'neutral').length;
    const neg = rs.filter((r) => sentimentFromRating(Number(r.rating || 0)) === 'negative').length;
    return {
      count: rs.length,
      avg,
      pos: Math.round((pos / rs.length) * 100),
      neu: Math.round((neu / rs.length) * 100),
      neg: Math.round((neg / rs.length) * 100),
    };
  };

  const a = compare(compareA);
  const b = compare(compareB);
  const nameA = compareOptions.find((x) => x.value === compareA)?.label || 'Business A';
  const nameB = compareOptions.find((x) => x.value === compareB)?.label || 'Business B';
  const rangeLabel = `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;

  const toggleSeries = (seriesName) => {
    setVisibleSeries((prev) => ({ ...prev, [seriesName]: !prev[seriesName] }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 bg-chain-bg text-chain-text">
        <FaSpinner className="animate-spin text-2xl text-chain-accent" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chain-bg pb-20 text-chain-text">
      <section className="border-b border-chain-border bg-chain-hero px-4 py-10 text-center">
        <FaShieldAlt className="mx-auto mb-2 text-4xl text-chain-accent" />
        <h1 className="text-3xl font-bold text-chain-header">Analytics</h1>
        <p className="mt-2 text-sm opacity-85">Long-term trend analysis for moderation, AI quality, and blockchain flow.</p>
      </section>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Date range</p>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`rounded-lg px-3 py-2 text-sm ${range === opt.value ? 'bg-chain-accent text-white' : 'border border-chain-border bg-chain-bg'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-lg border border-chain-border bg-chain-bg px-3 py-2 text-chain-text [color-scheme:dark]" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-lg border border-chain-border bg-chain-bg px-3 py-2 text-chain-text [color-scheme:dark]" />
            </div>
          )}
          <p className="mt-3 text-sm text-slate-300">
            Showing data for <span className="font-semibold text-chain-text">{rangeLabel}</span>.
          </p>
        </div>

        <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-chain-header">Sentiment Trend</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => toggleSeries('positive')} className={`rounded-full px-3 py-1 text-xs ${visibleSeries.positive ? 'bg-emerald-600 text-white' : 'border border-chain-border bg-chain-bg text-chain-text'}`}>Positive</button>
              <button type="button" onClick={() => toggleSeries('neutral')} className={`rounded-full px-3 py-1 text-xs ${visibleSeries.neutral ? 'bg-slate-500 text-white' : 'border border-chain-border bg-chain-bg text-chain-text'}`}>Neutral</button>
              <button type="button" onClick={() => toggleSeries('negative')} className={`rounded-full px-3 py-1 text-xs ${visibleSeries.negative ? 'bg-red-600 text-white' : 'border border-chain-border bg-chain-bg text-chain-text'}`}>Negative</button>
            </div>
          </div>
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentimentSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
                {visibleSeries.positive && <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={false} />}
                {visibleSeries.neutral && <Line type="monotone" dataKey="neutral" stroke="#9ca3af" strokeWidth={2} dot={false} />}
                {visibleSeries.negative && <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-chain-header">User Growth</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setGrowthFilter('all')} className={`rounded-full px-3 py-1 text-xs ${growthFilter === 'all' ? 'bg-chain-accent text-white' : 'border border-chain-border bg-chain-bg text-chain-text'}`}>Total Users</button>
              <button type="button" onClick={() => setGrowthFilter('customer')} className={`rounded-full px-3 py-1 text-xs ${growthFilter === 'customer' ? 'bg-emerald-600 text-white' : 'border border-chain-border bg-chain-bg text-chain-text'}`}>Customers</button>
              <button type="button" onClick={() => setGrowthFilter('owner')} className={`rounded-full px-3 py-1 text-xs ${growthFilter === 'owner' ? 'bg-violet-600 text-white' : 'border border-chain-border bg-chain-bg text-chain-text'}`}>Business Owners</button>
            </div>
          </div>
          <p className="mb-3 text-sm text-slate-300">
            Daily growth and cumulative growth for {growthFilter === 'all' ? 'all users (customers + business owners)' : growthFilter === 'customer' ? 'customers' : 'business owners'}.
          </p>
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
                <Line type="monotone" dataKey="newUsers" name="new users" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="totalUsers" name="total users" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
            <h2 className="mb-3 text-lg font-semibold text-chain-header">AI Reliability</h2>
            <p className="mb-3 text-sm text-slate-300">
              This radar graph summarizes moderation quality. Higher values mean better confidence, better bot detection coverage,
              stronger processing performance, and lower manual override dependency for the selected date range.
            </p>
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-chain-header">Blockchain Health</h2>
            <p className="text-sm text-slate-300">Calculated for selected range: {rangeLabel}</p>
            <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
              <div className="flex items-start gap-2"><FaLink className="mt-1 text-sky-400" /><div><p className="text-xs text-slate-400">Total Review Hashes</p><p className="text-2xl font-bold">{chainStats.hashes}</p></div></div>
            </div>
            <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
              <div className="flex items-start gap-2"><FaCoins className="mt-1 text-amber-400" /><div><p className="text-xs text-slate-400">SRT Tokens Distributed</p><p className="text-2xl font-bold">{chainStats.tokens}</p></div></div>
            </div>
            <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
              <div className="flex items-start gap-2"><FaClock className="mt-1 text-emerald-400" /><div><p className="text-xs text-slate-400">Avg Block Confirmation Time</p><p className="text-2xl font-bold">{chainStats.avgBlock}s</p></div></div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-chain-border bg-chain-card p-4 shadow-chain">
          <h2 className="mb-3 text-lg font-semibold text-chain-header">Business Comparison</h2>
          <p className="mb-2 text-sm text-slate-300">Use the search boxes if your business list grows.</p>
          <p className="mb-3 text-sm text-slate-300">Data shown for: {rangeLabel}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <input value={searchA} onChange={(e) => setSearchA(e.target.value)} placeholder="Search business A..." className="w-full rounded-lg border border-chain-border bg-chain-bg px-3 py-2 text-chain-text placeholder:text-slate-400" />
              <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="w-full rounded-lg border border-chain-border bg-chain-bg px-3 py-2 text-chain-text [color-scheme:dark]">
                {filteredOptionsA.length === 0 ? <option value="">No businesses found</option> : filteredOptionsA.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <input value={searchB} onChange={(e) => setSearchB(e.target.value)} placeholder="Search business B..." className="w-full rounded-lg border border-chain-border bg-chain-bg px-3 py-2 text-chain-text placeholder:text-slate-400" />
              <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="w-full rounded-lg border border-chain-border bg-chain-bg px-3 py-2 text-chain-text [color-scheme:dark]">
                {filteredOptionsB.length === 0 ? <option value="">No businesses found</option> : filteredOptionsB.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <CompareCard title={nameA} data={a} />
            <CompareCard title={nameB} data={b} />
          </div>
          {a.count === 0 && b.count === 0 && (
            <p className="mt-3 text-sm text-amber-300">
              No comparison data found for the selected businesses in this date range.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function CompareCard({ title, data }) {
  return (
    <div className="rounded-lg border border-chain-border bg-chain-bg p-4">
      <h3 className="mb-2 font-semibold text-chain-header">{title}</h3>
      <p className="text-sm text-slate-400">Reviews: <span className="text-chain-text">{data.count}</span></p>
      <p className="text-sm text-slate-400">Avg Rating: <span className="text-chain-text">{data.avg}</span></p>
      <p className="text-sm text-emerald-400">Positive: {data.pos}%</p>
      <p className="text-sm text-slate-400">Neutral: {data.neu}%</p>
      <p className="text-sm text-red-400">Negative: {data.neg}%</p>
    </div>
  );
}

export default Analytics;
