import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [rm, setRm] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [targets, setTargets] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [backlog, setBacklog] = useState({});
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
      const response = await fetch(`https://roaring-tigers-backend.onrender.com/targets?rm_id=${rmId}`);
      const allTargets = await response.json();
      const currentPeriod = getCurrentPeriod();
      const rmTarget = allTargets.find(t => t.period === currentPeriod);
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

  const calculatePredictions = (currentValue, targetValue, daysElapsed, totalDays) => {
    if (!targetValue) return null;
    
    const dailyRate = currentValue / daysElapsed;
    const projectedValue = dailyRate * totalDays;
    const projectedPercentage = (projectedValue / targetValue) * 100;
    const gap = targetValue - projectedValue;
    
    return {
      projectedValue: Math.round(projectedValue),
      projectedPercentage: Math.min(Math.round(projectedPercentage), 100),
      gap: Math.max(0, Math.round(gap)),
      dailyRate: dailyRate.toFixed(1),
      confidence: projectedPercentage >= 100 ? '✅ On Track' : 
                  projectedPercentage >= 80 ? '⚠️ At Risk' : '🔴 Behind Schedule'
    };
  };

  const calculateBacklog = (achieved, target) => {
    if (!target) return null;
    const percentage = (achieved / target) * 100;
    const remaining = target - achieved;
    return {
      percentage: Math.round(percentage),
      remaining,
      isBehind: achieved < target * 0.3 && new Date().getDate() > 10 // Behind if <30% by 10th day
    };
  };

  const getRecommendations = (kpiType, achieved, target, daysRemaining) => {
    if (!target) return null;
    
    const gap = target - achieved;
    const dailyNeeded = gap / Math.max(1, daysRemaining);
    
    const recommendations = {
      'cp_onboarding': [
        `Need to onboard ${Math.ceil(gap)} more CPs in ${daysRemaining} days`,
        `Daily target: ${dailyNeeded.toFixed(1)} CPs per day`,
        `💡 Tip: Focus on high-potential prospects and follow up with warm leads`
      ],
      'active_cp': [
        `Need ${Math.ceil(gap)} more active CPs (CPs with sales)`,
        `Convert ${dailyNeeded.toFixed(1)} CPs to active status daily`,
        `💡 Tip: Identify CPs close to first sale and provide support`
      ],
      'meetings': [
        `Need ${Math.ceil(gap)} more meetings in ${daysRemaining} days`,
        `Schedule ${dailyNeeded.toFixed(1)} meetings per day`,
        `💡 Tip: Block calendar for prospecting hours daily`
      ],
      'revenue': [
        `Need ₹${gap.toLocaleString()} more revenue`,
        `Daily revenue target: ₹${Math.round(dailyNeeded).toLocaleString()}`,
        `💡 Tip: Focus on high-value deals and follow up on pending proposals`
      ]
    };
    
    return recommendations[kpiType] || [];
  };

  const loadDashboardData = async (rmId, range) => {
    setLoading(true);
    try {
      const startDate = getDateRange(range);
      const baseUrl = 'https://roaring-tigers-backend.onrender.com';
      
      // Get all data
      const [cpRes, meetingRes, salesRes] = await Promise.all([
        fetch(`${baseUrl}/channel_partners`),
        fetch(`${baseUrl}/meetings`),
        fetch(`${baseUrl}/sales`)
      ]);
      
      const allCPs = await cpRes.json();
      const allMeetings = await meetingRes.json();
      const allSales = await salesRes.json();
      
      // Filter for this RM
      const rmCPs = allCPs.filter(cp => String(cp.rm_id) === String(rmId));
      const rmMeetings = allMeetings.filter(m => String(m.rm_id) === String(rmId) && new Date(m.meeting_date) >= startDate);
      const rmSales = allSales.filter(s => String(s.rm_id) === String(rmId) && new Date(s.sale_date) >= startDate);
      
      // Calculate Active CPs
      const cpWithSales = new Set();
      allSales.forEach(sale => {
        if (String(sale.rm_id) === String(rmId) && sale.cp_id) {
          cpWithSales.add(String(sale.cp_id));
        }
      });
      const activeCPs = rmCPs.filter(cp => cpWithSales.has(String(cp.id)));
      
      // Calculate totals
      const totalSalesValue = rmSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0);
      const totalCommission = rmSales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
      
      // Calculate days info for predictions
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysElapsed = Math.ceil((today - monthStart) / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysRemaining = totalDays - daysElapsed;
      
      // Generate predictions
      if (targets) {
        setPredictions({
          cp_onboarding: calculatePredictions(rmCPs.length, targets.cp_onboarding_target, daysElapsed, totalDays),
          active_cp: calculatePredictions(activeCPs.length, targets.active_cp_target, daysElapsed, totalDays),
          meetings: calculatePredictions(rmMeetings.length, targets.meetings_target, daysElapsed, totalDays),
          revenue: calculatePredictions(totalSalesValue, targets.revenue_target, daysElapsed, totalDays)
        });
        
        // Generate backlog analysis
        setBacklog({
          cp_onboarding: calculateBacklog(rmCPs.length, targets.cp_onboarding_target),
          active_cp: calculateBacklog(activeCPs.length, targets.active_cp_target),
          meetings: calculateBacklog(rmMeetings.length, targets.meetings_target),
          revenue: calculateBacklog(totalSalesValue, targets.revenue_target),
          recommendations: {
            cp_onboarding: getRecommendations('cp_onboarding', rmCPs.length, targets.cp_onboarding_target, daysRemaining),
            active_cp: getRecommendations('active_cp', activeCPs.length, targets.active_cp_target, daysRemaining),
            meetings: getRecommendations('meetings', rmMeetings.length, targets.meetings_target, daysRemaining),
            revenue: getRecommendations('revenue', totalSalesValue, targets.revenue_target, daysRemaining)
          }
        });
      }
      
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
        pendingFollowUps: 0,
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
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.welcome}>🦁 Welcome, {rm.name}!</h1>
          <p style={styles.subtitle}>{rm.phone} | {rm.email}</p>
        </div>
        <button onClick={() => navigate('/')} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Time Filters */}
      <div style={styles.filterBar}>
        <div style={styles.filterLabel}>Show stats for:</div>
        <div style={styles.filterButtons}>
          {['day', 'week', 'month', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                ...styles.filterBtn,
                background: timeRange === range ? '#667eea' : 'white',
                color: timeRange === range ? 'white' : '#495057',
                borderColor: timeRange === range ? '#667eea' : '#dee2e6'
              }}
            >
              {range === 'day' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
        <div style={styles.filterInfo}>Showing {getTimeRangeLabel()} stats</div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div>
                <div style={styles.statValue}>{stats.totalCPs}</div>
                <div style={styles.statLabel}>Total CPs</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div>
                <div style={styles.statValue}>{stats.activeCPs}</div>
                <div style={styles.statLabel}>Active CPs</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📅</div>
              <div>
                <div style={styles.statValue}>{stats.totalMeetings}</div>
                <div style={styles.statLabel}>Meetings</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div>
                <div style={styles.statValue}>{stats.totalSales}</div>
                <div style={styles.statLabel}>Sales</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💵</div>
              <div>
                <div style={styles.statValue}>{formatCurrency(stats.totalSalesValue)}</div>
                <div style={styles.statLabel}>Revenue</div>
              </div>
            </div>
          </div>

          {/* Target vs Achievement Section */}
          {targets && (
            <div style={styles.targetsSection}>
              <h2 style={styles.sectionTitle}>🎯 Monthly Targets ({getCurrentPeriod()})</h2>
              
              {/* Progress Bars */}
              <div style={styles.targetsGrid}>
                {/* CP Onboarding */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span>CP Onboarding</span>
                    <span>{stats.totalCPs} / {targets.cp_onboarding_target}</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.totalCPs, targets.cp_onboarding_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.totalCPs, targets.cp_onboarding_target))
                    }} />
                  </div>
                  
                  {/* Prediction */}
                  {predictions.cp_onboarding && (
                    <div style={styles.predictionBox}>
                      <div style={styles.predictionHeader}>
                        <span>📊 Projection</span>
                        <span style={{
                          color: predictions.cp_onboarding.confidence.includes('✅') ? '#28a745' :
                                 predictions.cp_onboarding.confidence.includes('⚠️') ? '#ffc107' : '#dc3545'
                        }}>
                          {predictions.cp_onboarding.confidence}
                        </span>
                      </div>
                      <div style={styles.predictionDetails}>
                        <div>Projected: {predictions.cp_onboarding.projectedValue} CPs</div>
                        <div>Gap: {predictions.cp_onboarding.gap} CPs</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Backlog & Recommendations */}
                  {backlog.cp_onboarding?.isBehind && (
                    <div style={styles.backlogBox}>
                      <div style={styles.backlogTitle}>⚠️ Behind Schedule</div>
                      <div style={styles.recommendations}>
                        {backlog.recommendations?.cp_onboarding?.map((rec, i) => (
                          <div key={i} style={styles.recommendation}>{rec}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active CP */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span>Active CPs</span>
                    <span>{stats.activeCPs} / {targets.active_cp_target}</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.activeCPs, targets.active_cp_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.activeCPs, targets.active_cp_target))
                    }} />
                  </div>
                  
                  {predictions.active_cp && (
                    <div style={styles.predictionBox}>
                      <div style={styles.predictionHeader}>
                        <span>📊 Projection</span>
                        <span style={{
                          color: predictions.active_cp.confidence.includes('✅') ? '#28a745' :
                                 predictions.active_cp.confidence.includes('⚠️') ? '#ffc107' : '#dc3545'
                        }}>
                          {predictions.active_cp.confidence}
                        </span>
                      </div>
                      <div style={styles.predictionDetails}>
                        <div>Projected: {predictions.active_cp.projectedValue} Active</div>
                        <div>Gap: {predictions.active_cp.gap} Active</div>
                      </div>
                    </div>
                  )}
                  
                  {backlog.active_cp?.isBehind && (
                    <div style={styles.backlogBox}>
                      <div style={styles.backlogTitle}>⚠️ Behind Schedule</div>
                      <div style={styles.recommendations}>
                        {backlog.recommendations?.active_cp?.map((rec, i) => (
                          <div key={i} style={styles.recommendation}>{rec}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Meetings */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span>Meetings</span>
                    <span>{stats.totalMeetings} / {targets.meetings_target}</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.totalMeetings, targets.meetings_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.totalMeetings, targets.meetings_target))
                    }} />
                  </div>
                  
                  {predictions.meetings && (
                    <div style={styles.predictionBox}>
                      <div style={styles.predictionHeader}>
                        <span>📊 Projection</span>
                        <span style={{
                          color: predictions.meetings.confidence.includes('✅') ? '#28a745' :
                                 predictions.meetings.confidence.includes('⚠️') ? '#ffc107' : '#dc3545'
                        }}>
                          {predictions.meetings.confidence}
                        </span>
                      </div>
                      <div style={styles.predictionDetails}>
                        <div>Projected: {predictions.meetings.projectedValue} Meetings</div>
                        <div>Gap: {predictions.meetings.gap} Meetings</div>
                      </div>
                    </div>
                  )}
                  
                  {backlog.meetings?.isBehind && (
                    <div style={styles.backlogBox}>
                      <div style={styles.backlogTitle}>⚠️ Behind Schedule</div>
                      <div style={styles.recommendations}>
                        {backlog.recommendations?.meetings?.map((rec, i) => (
                          <div key={i} style={styles.recommendation}>{rec}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Revenue */}
                <div style={styles.targetCard}>
                  <div style={styles.targetHeader}>
                    <span>Revenue</span>
                    <span>{formatCurrency(stats.totalSalesValue)} / {formatCurrency(targets.revenue_target)}</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${calculateProgress(stats.totalSalesValue, targets.revenue_target)}%`,
                      backgroundColor: getProgressColor(calculateProgress(stats.totalSalesValue, targets.revenue_target))
                    }} />
                  </div>
                  
                  {predictions.revenue && (
                    <div style={styles.predictionBox}>
                      <div style={styles.predictionHeader}>
                        <span>📊 Projection</span>
                        <span style={{
                          color: predictions.revenue.confidence.includes('✅') ? '#28a745' :
                                 predictions.revenue.confidence.includes('⚠️') ? '#ffc107' : '#dc3545'
                        }}>
                          {predictions.revenue.confidence}
                        </span>
                      </div>
                      <div style={styles.predictionDetails}>
                        <div>Projected: {formatCurrency(predictions.revenue.projectedValue)}</div>
                        <div>Gap: {formatCurrency(predictions.revenue.gap)}</div>
                      </div>
                    </div>
                  )}
                  
                  {backlog.revenue?.isBehind && (
                    <div style={styles.backlogBox}>
                      <div style={styles.backlogTitle}>⚠️ Behind Schedule</div>
                      <div style={styles.recommendations}>
                        {backlog.recommendations?.revenue?.map((rec, i) => (
                          <div key={i} style={styles.recommendation}>{rec}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={styles.actionsSection}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <div style={styles.actionGrid}>
              <button onClick={() => navigate('/onboard-cp')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>➕</span> Onboard CP
              </button>
              <button onClick={() => navigate('/my-cps')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>👥</span> My CPs
              </button>
              <button onClick={() => navigate('/log-meeting')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>📝</span> Log Meeting
              </button>
              <button onClick={() => navigate('/record-sale')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>💰</span> Record Sale
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.recentSection}>
            <h2 style={styles.sectionTitle}>Recent Activity</h2>
            <div style={styles.recentGrid}>
              <div style={styles.recentCard}>
                <h3 style={styles.recentTitle}>📅 Recent Meetings</h3>
                {stats.recentMeetings.length === 0 ? (
                  <p style={styles.noData}>No meetings this period</p>
                ) : (
                  stats.recentMeetings.map(m => (
                    <div key={m.id} style={styles.recentItem}>
                      <div>{formatDate(m.meeting_date)} - {m.notes?.substring(0, 30)}...</div>
                    </div>
                  ))
                )}
              </div>
              <div style={styles.recentCard}>
                <h3 style={styles.recentTitle}>💰 Recent Sales</h3>
                {stats.recentSales.length === 0 ? (
                  <p style={styles.noData}>No sales this period</p>
                ) : (
                  stats.recentSales.map(s => (
                    <div key={s.id} style={styles.recentItem}>
                      <div>{formatDate(s.sale_date)} - {formatCurrency(s.sale_amount)}</div>
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
    cursor: 'pointer'
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
    cursor: 'pointer'
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
    gap: '15px',
    marginBottom: '20px'
  },
  statCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statIcon: {
    fontSize: '30px'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666'
  },
  targetsSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
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
    marginBottom: '10px',
    fontWeight: 'bold'
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
  predictionBox: {
    marginTop: '10px',
    padding: '8px',
    background: '#e7f3ff',
    borderRadius: '4px',
    fontSize: '12px'
  },
  predictionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  predictionDetails: {
    color: '#495057'
  },
  backlogBox: {
    marginTop: '10px',
    padding: '8px',
    background: '#fff3cd',
    borderRadius: '4px',
    border: '1px solid #ffeeba'
  },
  backlogTitle: {
    color: '#856404',
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '12px'
  },
  recommendations: {
    fontSize: '11px',
    color: '#495057'
  },
  recommendation: {
    marginBottom: '3px'
  },
  actionsSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px'
  },
  actionBtn: {
    padding: '15px',
    background: '#f8f9fa',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  actionIcon: {
    fontSize: '18px'
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
  recentTitle: {
    fontSize: '16px',
    margin: '0 0 10px 0'
  },
  noData: {
    color: '#999',
    fontStyle: 'italic'
  },
  recentItem: {
    padding: '8px',
    background: 'white',
    borderRadius: '4px',
    marginBottom: '5px',
    fontSize: '13px'
  }
};

export default Dashboard;
