import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats } from '../../services/api';
import { 
    FaUsers, FaBuilding, FaComments, FaCoins, FaExclamationTriangle, FaTicketAlt, 
    FaSpinner, FaChartLine, FaUserCheck, FaClock, FaSearch,
    FaBolt, FaServer, FaUserShield, FaHistory, FaCheck, FaBan, FaCog, FaBullhorn, FaMoneyBillWave, FaDownload, FaTimes
} from 'react-icons/fa';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#10B981', '#FFBB28', '#FF8042', '#8884D8'];

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const buildChartsFromStats = (stats) => {
    const userGrowth = (stats.userGrowth || []).map(d => ({
      name: d.label || d.date,
      customers: d.customers ?? 0,
      owners: d.owners ?? 0,
    }));
    const reviewActivity = (stats.reviewActivity || []).map(d => ({
      name: d.label || d.date,
      positive: d.positive ?? 0,
      negative: d.negative ?? 0,
      flagged: d.flagged ?? 0,
    }));
    return { userGrowth, reviewActivity };
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const stats = await fetchStats();
      const { userGrowth, reviewActivity } = buildChartsFromStats(stats);
      setDashboardData({
        totalUsers: stats.totalUsers || { customers: 0, owners: 0 },
        businessStats: stats.businessStats || { active: 0, pending: 0, flagged: 0, total: 0 },
        reviewStats: { today: stats.reviewStats?.today || 0, flagged: stats.reviewStats?.flagged || 0, total: stats.reviewStats?.total || 0 },
        payoutStats: stats.payoutStats || { pending: 0, processed: 0 },
        supportStats: stats.supportStats || { newTickets: 0, unresolved: 0 },
        userGrowth,
        reviewActivity,
        businessStatus: [
          { name: 'Active', value: stats.businessStats?.active || 0 },
          { name: 'Pending', value: stats.businessStats?.pending || 0 },
          { name: 'Flagged', value: stats.businessStats?.flagged || 0 },
          { name: 'Inactive', value: Math.max(0, (stats.businessStats?.total || 0) - (stats.businessStats?.active || 0)) },
        ],
        pendingBusinesses: [],
        adminActivities: [],
      });
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };
  
  const handlePublishAnnouncement = () => {
      if(!announcement.trim()) {
          alert("Announcement text cannot be empty.");
          return;
      }
      console.log("Publishing announcement:", announcement);
      alert(`Announcement Published: "${announcement}"`);
      setAnnouncement('');
  };

  const handlePendingBusinessAction = (businessId, action) => {
      console.log(`Action: ${action} on business ID: ${businessId}`);
      // In a real app, this would be an API call. For now, we just remove it from the list.
      setDashboardData(prev => ({
          ...prev,
          pendingBusinesses: prev.pendingBusinesses.filter(b => b.id !== businessId)
      }));
  };

  const hoverStyles = `
    .stat-card-hover { transition: all 0.3s ease; }
    .stat-card-hover:hover { 
        transform: translateY(-5px); 
        box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
        border-color: var(--button-bg);
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  if (loading) {
    return <div style={styles.loader}><FaSpinner className="spin" /> Loading Admin Dashboard...</div>;
  }

  if (error || !dashboardData) {
    return (
        <div style={styles.errorContainer}>
            <FaExclamationTriangle style={styles.errorIcon} />
            <p>{error || 'Failed to load dashboard data.'}</p>
            <button onClick={() => window.location.reload()} style={styles.retryButton}>Retry</button>
        </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)", minHeight: "100vh" }}>
      <style>{hoverStyles}</style>
      
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>Admin Dashboard</h1>
          <div style={styles.timeRangeSelector}>
            <FaClock style={styles.timeRangeIcon} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={styles.timeRangeSelect}>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
        <div style={styles.headerRight}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input type="text" placeholder="Search users, businesses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.searchInput}/>
            <button type="submit" style={styles.searchButton}><FaSearch /></button>
          </form>
        </div>
      </header>

      <main style={styles.main}>
        {/* KPI Cards */}
        <div style={styles.kpiGrid}>
            <Link to="/admin/users" style={styles.kpiCard} className="stat-card-hover"><div style={styles.kpiHeader}><FaUsers style={styles.kpiIcon} /><h3 style={styles.kpiTitle}>Total Users</h3></div><div style={styles.kpiValue}>{dashboardData.totalUsers.customers + dashboardData.totalUsers.owners}</div><div style={styles.kpiBreakdown}><span>Customers: {dashboardData.totalUsers.customers}</span><span>Owners: {dashboardData.totalUsers.owners}</span></div></Link>
            <Link to="/admin/businesses" style={styles.kpiCard} className="stat-card-hover"><div style={styles.kpiHeader}><FaBuilding style={styles.kpiIcon} /><h3 style={styles.kpiTitle}>Businesses</h3></div><div style={styles.kpiValue}>{dashboardData.businessStats.active}</div><div style={styles.kpiBreakdown}><span>Pending: {dashboardData.businessStats.pending}</span><span>Flagged: {dashboardData.businessStats.flagged}</span></div></Link>
            <Link to="/admin/reviews" style={styles.kpiCard} className="stat-card-hover"><div style={styles.kpiHeader}><FaComments style={styles.kpiIcon} /><h3 style={styles.kpiTitle}>Reviews Today</h3></div><div style={styles.kpiValue}>{dashboardData.reviewStats.today}</div><div style={styles.kpiBreakdown}><span>Flagged: {dashboardData.reviewStats.flagged}</span></div></Link>
            <Link to="/admin/wallet" style={styles.kpiCard} className="stat-card-hover"><div style={styles.kpiHeader}><FaCoins style={styles.kpiIcon} /><h3 style={styles.kpiTitle}>Pending Payouts</h3></div><div style={styles.kpiValue}>{dashboardData.payoutStats.pending}</div><div style={styles.kpiBreakdown}><span>Processed: {dashboardData.payoutStats.processed}</span></div></Link>
            <Link to="/admin/inbox" style={styles.kpiCard} className="stat-card-hover"><div style={styles.kpiHeader}><FaTicketAlt style={styles.kpiIcon} /><h3 style={styles.kpiTitle}>Support Tickets</h3></div><div style={styles.kpiValue}>{dashboardData.supportStats.newTickets}</div><div style={styles.kpiBreakdown}><span>Unresolved: {dashboardData.supportStats.unresolved}</span></div></Link>
        </div>

        <div style={styles.contentGrid}>
          {/* Left Column */}
          <div style={styles.mainColumn}>
            <div style={styles.chartCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}><FaChartLine /> User Growth</h3>
                <div style={styles.legend}>
                    <span style={{...styles.legendItem, color: '#0088FE'}}><span style={{...styles.legendColor, backgroundColor: '#0088FE'}}></span>Users</span>
                    <span style={{...styles.legendItem, color: '#00C49F'}}><span style={{...styles.legendColor, backgroundColor: '#00C49F'}}></span>Owners</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="name" stroke="var(--text-color)" />
                  <YAxis stroke="var(--text-color)"/>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}/>
                  <Bar dataKey="customers" stackId="a" fill="#0088FE" name="Customers" />
                  <Bar dataKey="owners" stackId="a" fill="#00C49F" name="Business Owners" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.chartCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}><FaComments /> Review Activity</h3>
                <div style={styles.legend}>
                    <span style={{...styles.legendItem, color: '#00C49F'}}><span style={{...styles.legendColor, backgroundColor: '#00C49F'}}></span>Positive</span>
                    <span style={{...styles.legendItem, color: '#FF8042'}}><span style={{...styles.legendColor, backgroundColor: '#FF8042'}}></span>Negative</span>
                    <span style={{...styles.legendItem, color: '#FF0000'}}><span style={{...styles.legendColor, backgroundColor: '#FF0000'}}></span>Flagged</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.reviewActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="name" stroke="var(--text-color)" />
                  <YAxis stroke="var(--text-color)"/>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}/>
                  <Line type="monotone" dataKey="positive" stroke="#00C49F" strokeWidth={2} name="Positive" />
                  <Line type="monotone" dataKey="negative" stroke="#FF8042" strokeWidth={2} name="Negative" />
                  <Line type="monotone" dataKey="flagged" stroke="#FF0000" strokeWidth={2} name="Flagged" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column */}
          <div style={styles.sideColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}><h3 style={styles.cardTitle}><FaUserCheck /> Pending Businesses</h3><Link to="/admin/businesses" style={styles.viewAllLink}>View All</Link></div>
              {dashboardData.pendingBusinesses.map(biz => (
                <div key={biz.id} style={styles.listItem}>
                    <div>
                        <p style={{fontWeight: '600', margin: 0}}>{biz.name}</p>
                        <p style={{fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0'}}>{biz.category} - Submitted {biz.submitted}</p>
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button onClick={() => handlePendingBusinessAction(biz.id, 'reject')} style={{...styles.actionButton, color: '#EF4444'}}><FaTimes/></button>
                        <button onClick={() => handlePendingBusinessAction(biz.id, 'approve')} style={{...styles.actionButton, color: '#10B981'}}><FaCheck/></button>
                    </div>
                </div>
              ))}
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}><h3 style={styles.cardTitle}><FaBuilding /> Business Status</h3></div>
              <div style={styles.pieChartContainer}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dashboardData.businessStatus} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {dashboardData.businessStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}><h3 style={styles.cardTitle}><FaHistory /> Recent Admin Activities</h3></div>
              <div style={styles.activityList}>
                {dashboardData.adminActivities.map(activity => (
                  <div key={activity.id} style={styles.activityItem}>
                    <div style={styles.activityIcon}><FaUserShield /></div>
                    <div style={styles.activityContent}><div style={styles.activityText}><strong>{activity.admin}</strong> {activity.action} <strong>{activity.target}</strong></div><div style={styles.activityTime}>{activity.time}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', backgroundColor: 'var(--hero-bg)', borderBottom: '1px solid var(--card-border)' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '2rem' },
    headerTitle: { fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: 'var(--hero-text)' },
    timeRangeSelector: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' },
    timeRangeIcon: { color: 'var(--button-bg)' },
    timeRangeSelect: { backgroundColor: 'transparent', border: 'none', color: 'var(--text-color)', outline: 'none', cursor: 'pointer' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    searchForm: { display: 'flex', alignItems: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' },
    searchInput: { padding: '0.5rem 1rem', border: 'none', outline: 'none', backgroundColor: 'transparent', color: 'var(--text-color)', minWidth: '300px' },
    searchButton: { padding: '0.5rem 1rem', border: 'none', backgroundColor: 'var(--button-bg)', color: 'white', cursor: 'pointer' },
    
    // Main Content
    main: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    kpiCard: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--card-border)', textDecoration: 'none', color: 'var(--text-color)' },
    kpiHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
    kpiIcon: { fontSize: '1.5rem', color: 'var(--button-bg)' },
    kpiTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '600' },
    kpiValue: { fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: 'var(--header-text)' },
    kpiBreakdown: { display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.8 },
    
    // Content Grid
    contentGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '120px' },
    
    // Cards
    card: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--card-border)' },
    chartCard: { backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow)', border: '1px solid var(--card-border)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    cardTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' },
    legend: { display: 'flex', gap: '1rem', fontSize: '0.9rem' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    legendColor: { width: '12px', height: '12px', borderRadius: '50%' },
    
    // Quick Actions
    quickActions: { display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' },
    actionButton: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'var(--hero-bg)', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-color)', border: '1px solid var(--card-border)', cursor: 'pointer' },
    
    // Pie Chart
    pieChartContainer: { width: '100%', height: '200px', marginTop: '1rem' },
    
    // Activity List
    activityList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    activityItem: { display: 'flex', gap: '1rem', alignItems: 'flex-start' },
    activityIcon: { backgroundColor: 'var(--hero-bg)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--button-bg)', flexShrink: 0 },
    activityContent: { flex: 1 },
    activityText: { fontSize: '0.95rem' },
    activityTime: { fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--card-border)' },
    viewAllLink: { color: 'var(--button-bg)', textDecoration: 'none', fontWeight: '500' },

    // Loader and Error
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem', fontSize: '1.2rem' },
    errorContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem', padding: '2rem', textAlign: 'center' },
    errorIcon: { fontSize: '3rem', color: '#ef4444' },
    retryButton: { padding: '0.8rem 1.5rem', backgroundColor: "var(--button-bg)", color: "white", border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem' }
};

export default AdminDashboard;
