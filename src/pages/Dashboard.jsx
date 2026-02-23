import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [rm, setRm] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [targets, setTargets] = useState(null);
  const [stats, setStats] = useState({
    totalCPs: 0,
    activeCPs: 0,
    totalMeetings: 0,
    totalSales: 0,
    totalSalesValue: 0,
    totalCommission: 0,
    pendingFollowUps: 0,
    recentMeetings: [],
    recentSales: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const rmData = sessionStorage.getItem('rm');
    if (!rmData) {
      navigate('/');
      return;
    }
    const rm = JSON.parse(rmData);
    setRm(rm);
  }, [navigate]);

  useEffect(() => {
    if (rm) {
      loadDashboardData(rm.id, timeRange);
      loadTargets(rm.id);
    }
  }, [rm, timeRange]);

  const loadTargets = async (rmId) => {
    try {
      const response = await fetch('http://localhost:3002/targets');
      const allTargets = await response.json();
      const currentPeriod = getCurrentPeriod();
      const rmTarget = allTargets.find(t => 
        String(t.rm_id) === String(rmId) && 
        t.period === currentPeriod
      );
      setTargets(rmTarget || null);
    } catch (err) {
      console.error('Error loading targets:', err);
    }
  };

  const getCurrentPeriod = () => {
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' }).toLowerCase();
    const year = date.getFullYear();
    return `${month}-${year}`;
  };

  const getDateRange = (range) => {
    const today = new Date();
    let startDate = new Date();
    
    switch(range) {
      case 'day':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(today.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(2000, 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    return startDate;
  };

  const loadDashboardData = async (rmId, range) => {
    setLoading(true);
    try {
      const startDate = getDateRange(range);
      
      // Get all CPs
      const cpRes = await fetch('http://localhost:3002/channel_partners');
      const allCPs = await cpRes.json();
      const rmCPs = allCPs.filter(cp => String(cp.rm_id) === String(rmId));
      
      // Calculate Active CPs (CPs with at least one sale)
      const salesRes = await fetch('http://localhost:3002/sales');
      const allSales = await salesRes.json();
      
      // Get unique CPs that have made sales
      const cpWithSales = new Set();
      allSales.forEach(sale => {
        if (String(sale.rm_id) === String(rmId) && sale.cp_id) {
          cpWithSales.add(String(sale.cp_id));
        }
      });
      const activeCPs = rmCPs.filter(cp => cpWithSales.has(String(cp.id)));
      
      // Get meetings filtered by date
      const meetingRes = await fetch('http://localhost:3002/meetings');
      const allMeetings = await meetingRes.json();
      const rmMeetings = allMeetings.filter(m => 
        String(m.rm_id) === String(rmId) && 
        new Date(m.meeting_date) >= startDate
      );
      
      // Get pending follow-ups
      const today = new Date().toISOString();
      const pendingFollowUps = allMeetings.filter(m => 
        String(m.rm_id) === String(rmId) &&
        m.follow_up_date && 
        new Date(m.follow_up_date) > new Date() && 
        m.status === 'follow_up_pending'
      );
      
      // Get sales filtered by date
      const rmSales = allSales.filter(s => 
        String(s.rm_id) === String(rmId) && 
        new Date(s.sale_date) >= startDate
      );
      
      // Calculate totals
      const totalSalesValue = rmSales.reduce((sum, sale) => sum + (sale.sale_amount || 0), 0);
      const totalCommission = rmSales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
      
      // Get recent items
      const recentMeetings = [...rmMeetings]
        .sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date))
        .slice(0, 5);
      
      const recentSales = [...rmSales]
        .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
        .slice(0, 5);
      
      setStats({
        totalCPs: rmCPs.length,
        activeCPs: activeCPs.length,
        totalMeetings: rmMeetings.length,
        totalSales: rmSales.length,
        totalSalesValue,
        totalCommission,
        pendingFollowUps: pendingFollowUps.length,
        recentMeetings,
        recentSales
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'all': return 'All Time';
      default: return 'This Month';
    }
  };

  const calculateProgress = (achieved, target) => {
    if (!target) return 0;
    return Math.min(Math.round((achieved / target) * 100), 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#4caf50';
    if (percentage >= 75) return '#8bc34a';
    if (percentage >= 50) return '#ffc107';
    if (percentage >= 25) return '#ff9800';
    return '#f44336';
  };

  if (!rm) return null;

  return (
    <div style={styles.container}>
      {/* Welcome Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.welcome}>🛡️ Welcome, {rm.name}!</h1>
          <p style={styles.subtitle}>
            {rm.phone} | {rm.email}
          </p>
        </div>
        <button onClick={() => navigate('/')} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* Time Range Filter */}
      <div style={styles.filterBar}>
        <div style={styles.filterLabel}>Show stats for:</div>
        <div style={styles.filterButtons}>
          <button 
            onClick={() => setTimeRange('day')}
            style={{
              ...styles.filterBtn,
              background: timeRange === 'day' ? '#667eea' : 'white',
              color: timeRange === 'day' ? 'white' : '#495057',
              borderColor: timeRange === 'day' ? '#667eea' : '#dee2e6'
            }}
          >
            Today
          </button>
          <button 
            onClick={() => setTimeRange('week')}
            style={{
              ...styles.filterBtn,
              background: timeRange === 'week' ? '#667eea' : 'white',
              color: timeRange === 'week' ? 'white' : '#495057',
              borderColor: timeRange === 'week' ? '#667eea' : '#dee2e6'
            }}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            style={{
              ...styles.filterBtn,
              background: timeRange === 'month' ? '#667eea' : 'white',
              color: timeRange === 'month' ? 'white' : '#495057',
              borderColor: timeRange === 'month' ? '#667eea' : '#dee2e6'
            }}
          >
            This Month
          </button>
          <button 
            onClick={() => setTimeRange('all')}
            style={{
              ...styles.filterBtn,
              background: timeRange === 'all' ? '#667eea' : 'white',
              color: timeRange === 'all' ? 'white' : '#495057',
              borderColor: timeRange === 'all' ? '#667eea' : '#dee2e6'
            }}
          >
            All Time
          </button>
        </div>
        <div style={styles.filterInfo}>
          Showing {getTimeRangeLabel()} stats
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div style={styles.loading}>Loading your dashboard...</div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.totalCPs}</div>
                <div style={styles.statLabel}>Total CPs</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.activeCPs}</div>
                <div style={styles.statLabel}>Active CPs (with sales)</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📅</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.totalMeetings}</div>
                <div style={styles.statLabel}>Meetings {getTimeRangeLabel()}</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.totalSales}</div>
                <div style={styles.statLabel}>Sales {getTimeRangeLabel()}</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💵</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{formatCurrency(stats.totalSalesValue)}</div>
                <div style={styles.statLabel}>Revenue {getTimeRangeLabel()}</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🏆</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{formatCurrency(stats.totalCommission)}</div>
                <div style={styles.statLabel}>Commission {getTimeRangeLabel()}</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏰</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.pendingFollowUps}</div>
                <div style={styles.statLabel}>Pending Follow-ups</div>
              </div>
            </div>
          </div>

          {/* Target vs Achievement Section */}
          {targets && (
            <div style={styles.targetsSection}>
              <h2 style={styles.sectionTitle}>
                🎯 Monthly Targets ({getCurrentPeriod()})
              </h2>
              
              <div style={styles.targetsGrid}>
                {/* CP Onboarding Target */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span style={styles.targetLabel}>CP Onboarding</span>
                    <span style={styles.targetValues}>
                      {stats.totalCPs} / {targets.cp_onboarding_target || 0}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.totalCPs, targets.cp_onboarding_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.totalCPs, targets.cp_onboarding_target))
                    }} />
                  </div>
                  <div style={styles.targetFooter}>
                    <span>{calculateProgress(stats.totalCPs, targets.cp_onboarding_target)}% achieved</span>
                    {stats.totalCPs >= targets.cp_onboarding_target ? (
                      <span style={styles.targetAchieved}>✅ Target achieved!</span>
                    ) : (
                      <span style={styles.targetRemaining}>
                        Need {targets.cp_onboarding_target - stats.totalCPs} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Active CP Target */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span style={styles.targetLabel}>Active CPs</span>
                    <span style={styles.targetValues}>
                      {stats.activeCPs} / {targets.active_cp_target || 0}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.activeCPs, targets.active_cp_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.activeCPs, targets.active_cp_target))
                    }} />
                  </div>
                  <div style={styles.targetFooter}>
                    <span>{calculateProgress(stats.activeCPs, targets.active_cp_target)}% achieved</span>
                    {stats.activeCPs >= targets.active_cp_target ? (
                      <span style={styles.targetAchieved}>✅ Target achieved!</span>
                    ) : (
                      <span style={styles.targetRemaining}>
                        Need {targets.active_cp_target - stats.activeCPs} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Meetings Target */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span style={styles.targetLabel}>Meetings</span>
                    <span style={styles.targetValues}>
                      {stats.totalMeetings} / {targets.meetings_target || 0}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.totalMeetings, targets.meetings_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.totalMeetings, targets.meetings_target))
                    }} />
                  </div>
                  <div style={styles.targetFooter}>
                    <span>{calculateProgress(stats.totalMeetings, targets.meetings_target)}% achieved</span>
                    {stats.totalMeetings >= targets.meetings_target ? (
                      <span style={styles.targetAchieved}>✅ Target achieved!</span>
                    ) : (
                      <span style={styles.targetRemaining}>
                        Need {targets.meetings_target - stats.totalMeetings} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Revenue Target */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span style={styles.targetLabel}>Revenue</span>
                    <span style={styles.targetValues}>
                      {formatCurrency(stats.totalSalesValue)} / {formatCurrency(targets.revenue_target || 0)}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.totalSalesValue, targets.revenue_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.totalSalesValue, targets.revenue_target))
                    }} />
                  </div>
                  <div style={styles.targetFooter}>
                    <span>{calculateProgress(stats.totalSalesValue, targets.revenue_target)}% achieved</span>
                    {stats.totalSalesValue >= targets.revenue_target ? (
                      <span style={styles.targetAchieved}>✅ Target achieved!</span>
                    ) : (
                      <span style={styles.targetRemaining}>
                        Need {formatCurrency(targets.revenue_target - stats.totalSalesValue)} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={styles.actionsSection}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <div style={styles.actionGrid}>
              <button onClick={() => navigate('/onboard-cp')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>➕</span>
                Onboard CP
              </button>
              <button onClick={() => navigate('/my-cps')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>👥</span>
                My CPs
              </button>
              <button onClick={() => navigate('/log-meeting')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>📝</span>
                Log Meeting
              </button>
              <button onClick={() => navigate('/record-sale')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>💰</span>
                Record Sale
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.recentSection}>
            <h2 style={styles.sectionTitle}>Recent Activity</h2>
            
            <div style={styles.recentGrid}>
              {/* Recent Meetings */}
              <div style={styles.recentCard}>
                <h3 style={styles.recentCardTitle}>📅 Recent Meetings</h3>
                {stats.recentMeetings.length === 0 ? (
                  <p style={styles.noData}>No meetings in this period</p>
                ) : (
                  stats.recentMeetings.map(meeting => (
                    <div key={meeting.id} style={styles.recentItem}>
                      <div style={styles.recentItemHeader}>
                        <span style={styles.recentItemDate}>{formatDate(meeting.meeting_date)}</span>
                        <span style={{
                          ...styles.outcomeBadge,
                          background: meeting.outcome === 'deal_win' ? '#d4edda' :
                                     meeting.outcome === 'follow_up' ? '#fff3cd' : 
                                     meeting.outcome === 'interested' ? '#cce5ff' : '#f8f9fa'
                        }}>
                          {meeting.outcome?.replace('_', ' ') || 'completed'}
                        </span>
                      </div>
                      <div style={styles.recentItemDetails}>
                        {meeting.notes?.substring(0, 50)}...
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Recent Sales */}
              <div style={styles.recentCard}>
                <h3 style={styles.recentCardTitle}>💰 Recent Sales</h3>
                {stats.recentSales.length === 0 ? (
                  <p style={styles.noData}>No sales in this period</p>
                ) : (
                  stats.recentSales.map(sale => (
                    <div key={sale.id} style={styles.recentItem}>
                      <div style={styles.recentItemHeader}>
                        <span style={styles.recentItemDate}>{formatDate(sale.sale_date)}</span>
                        <span style={styles.saleAmount}>{formatCurrency(sale.sale_amount)}</span>
                      </div>
                      <div style={styles.recentItemDetails}>
                        {sale.applicant_name} - {sale.project_name || 'Project'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '20px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  welcome: {
    fontSize: '24px',
    color: '#333',
    margin: '0 0 5px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  filterBar: {
    background: 'white',
    padding: '15px 20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#495057'
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '8px 16px',
    border: '2px solid',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  filterInfo: {
    fontSize: '14px',
    color: '#666',
    marginLeft: 'auto'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  statIcon: {
    fontSize: '32px'
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  targetsSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#333',
    margin: '0 0 20px 0'
  },
  targetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  targetCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px'
  },
  targetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  targetLabel: {
    fontWeight: 'bold',
    color: '#495057'
  },
  targetValues: {
    color: '#666'
  },
  progressBar: {
    height: '8px',
    background: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  targetFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  targetAchieved: {
    color: '#28a745',
    fontWeight: 'bold'
  },
  targetRemaining: {
    color: '#dc3545'
  },
  actionsSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  actionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '20px',
    background: '#f8f9fa',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#495057',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  actionIcon: {
    fontSize: '24px'
  },
  recentSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  recentCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px'
  },
  recentCardTitle: {
    fontSize: '16px',
    margin: '0 0 15px 0',
    color: '#495057'
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    padding: '20px'
  },
  recentItem: {
    padding: '10px',
    background: 'white',
    borderRadius: '5px',
    marginBottom: '10px'
  },
  recentItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px'
  },
  recentItemDate: {
    fontSize: '12px',
    color: '#666'
  },
  outcomeBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '3px',
    textTransform: 'capitalize'
  },
  saleAmount: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#28a745'
  },
  recentItemDetails: {
    fontSize: '13px',
    color: '#333'
  }
};

export default Dashboard;
