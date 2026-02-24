import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [rms, setRms] = useState([]);
  const [cps, setCps] = useState([]);
  const [sales, setSales] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [targets, setTargets] = useState([]);
  const [rmPerformance, setRmPerformance] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const navigate = useNavigate();

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      navigate('/admin');
      return;
    }
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const baseUrl = 'https://roaring-tigers-api.onrender.com';
      
      const [rmsRes, cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
        fetch(`${baseUrl}/rms`),
        fetch(`${baseUrl}/channel_partners`),
        fetch(`${baseUrl}/sales`),
        fetch(`${baseUrl}/meetings`),
        fetch(`${baseUrl}/targets`)
      ]);
      
      const rmsData = await rmsRes.json() || [];
      const cpsData = await cpsRes.json() || [];
      const salesData = await salesRes.json() || [];
      const meetingsData = await meetingsRes.json() || [];
      const targetsData = await targetsRes.json() || [];
      
      setRms(rmsData);
      setCps(cpsData);
      setSales(salesData);
      setMeetings(meetingsData);
      setTargets(targetsData);
      
      // Calculate RM-wise performance
      calculateRmPerformance(rmsData, cpsData, salesData, meetingsData, targetsData);
      
      // Calculate team stats
      calculateTeamStats(rmsData, cpsData, salesData, meetingsData);
      
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRmPerformance = (rmsData, cpsData, salesData, meetingsData, targetsData) => {
    const performance = rmsData.map(rm => {
      const rmId = String(rm.id);
      
      // Get RM's CPs
      const rmCPs = cpsData.filter(cp => String(cp.rm_id) === rmId);
      
      // Get RM's sales
      const rmSales = salesData.filter(sale => String(sale.rm_id) === rmId);
      
      // Get RM's meetings
      const rmMeetings = meetingsData.filter(meeting => String(meeting.rm_id) === rmId);
      
      // Calculate active CPs (CPs with sales)
      const cpWithSales = new Set();
      rmSales.forEach(sale => {
        if (sale.cp_id) cpWithSales.add(String(sale.cp_id));
      });
      const activeCPs = rmCPs.filter(cp => cpWithSales.has(String(cp.id)));
      
      // Calculate current month stats
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const currentMonthSales = rmSales.filter(sale => new Date(sale.sale_date) >= monthStart);
      const currentMonthMeetings = rmMeetings.filter(meeting => new Date(meeting.meeting_date) >= monthStart);
      const currentMonthCPs = rmCPs.filter(cp => new Date(cp.onboard_date) >= monthStart);
      
      // Get current month target
      const currentPeriod = getCurrentPeriod();
      const rmTarget = targetsData.find(t => String(t.rm_id) === rmId && t.period === currentPeriod);
      
      // Calculate achievements vs targets
      const achievements = {
        cp_onboarding: currentMonthCPs.length,
        active_cp: activeCPs.length,
        meetings: currentMonthMeetings.length,
        revenue: currentMonthSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0)
      };
      
      // Calculate percentages
      const percentages = {
        cp_onboarding: rmTarget ? Math.round((achievements.cp_onboarding / rmTarget.cp_onboarding_target) * 100) : 0,
        active_cp: rmTarget ? Math.round((achievements.active_cp / rmTarget.active_cp_target) * 100) : 0,
        meetings: rmTarget ? Math.round((achievements.meetings / rmTarget.meetings_target) * 100) : 0,
        revenue: rmTarget ? Math.round((achievements.revenue / rmTarget.revenue_target) * 100) : 0
      };
      
      // Determine status
      const avgPercentage = Object.values(percentages).reduce((a, b) => a + b, 0) / 4;
      let status = '🔴 Off Track';
      if (avgPercentage >= 80) status = '✅ On Track';
      else if (avgPercentage >= 50) status = '⚠️ At Risk';
      
      return {
        ...rm,
        stats: {
          totalCPs: rmCPs.length,
          activeCPs: activeCPs.length,
          totalSales: rmSales.length,
          totalMeetings: rmMeetings.length,
          totalRevenue: rmSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0)
        },
        currentMonth: {
          cp_onboarding: currentMonthCPs.length,
          active_cp: activeCPs.length,
          meetings: currentMonthMeetings.length,
          revenue: currentMonthSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0)
        },
        targets: rmTarget || null,
        percentages,
        status,
        avgPercentage
      };
    });
    
    setRmPerformance(performance);
  };

  const calculateTeamStats = (rmsData, cpsData, salesData, meetingsData) => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = {
      totalRMs: rmsData.length,
      totalCPs: cpsData.length,
      totalSales: salesData.length,
      totalMeetings: meetingsData.length,
      totalRevenue: salesData.reduce((sum, s) => sum + (s.sale_amount || 0), 0),
      
      currentMonth: {
        cp_onboarding: cpsData.filter(cp => new Date(cp.onboard_date) >= monthStart).length,
        sales: salesData.filter(sale => new Date(sale.sale_date) >= monthStart).length,
        meetings: meetingsData.filter(meeting => new Date(meeting.meeting_date) >= monthStart).length,
        revenue: salesData.filter(sale => new Date(sale.sale_date) >= monthStart)
                         .reduce((sum, s) => sum + (s.sale_amount || 0), 0)
      },
      
      activeCPs: new Set(salesData.map(s => s.cp_id)).size,
      
      topPerformer: null,
      needsAttention: []
    };
    
    // Find top performer and those needing attention
    if (rmPerformance.length > 0) {
      const sorted = [...rmPerformance].sort((a, b) => b.avgPercentage - a.avgPercentage);
      stats.topPerformer = sorted[0];
      stats.needsAttention = sorted.filter(rm => rm.avgPercentage < 50);
    }
    
    setTeamStats(stats);
  };

  const getCurrentPeriod = () => {
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' }).toLowerCase();
    const year = date.getFullYear();
    return `${month}-${year}`;
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const baseUrl = 'https://roaring-tigers-api.onrender.com';
      await fetch(`${baseUrl}/${type}/${id}`, {
        method: 'DELETE'
      });
      loadAllData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleSetTarget = async (rmId) => {
    const period = prompt("Enter period (e.g., march-2026):", getCurrentPeriod());
    if (!period) return;
    
    const cpTarget = prompt("Enter CP Onboarding Target:", "5");
    const activeTarget = prompt("Enter Active CP Target:", "3");
    const meetingsTarget = prompt("Enter Meetings Target:", "15");
    const revenueTarget = prompt("Enter Revenue Target (in rupees):", "5000000");
    
    const targetData = {
      rm_id: rmId,
      period,
      cp_onboarding_target: parseInt(cpTarget) || 0,
      active_cp_target: parseInt(activeTarget) || 0,
      meetings_target: parseInt(meetingsTarget) || 0,
      revenue_target: parseInt(revenueTarget) || 0
    };

    try {
      const baseUrl = 'https://roaring-tigers-api.onrender.com';
      await fetch(`${baseUrl}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetData)
      });
      loadAllData();
    } catch (err) {
      console.error('Error setting target:', err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin');
    navigate('/admin');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#4caf50';
    if (percentage >= 75) return '#8bc34a';
    if (percentage >= 50) return '#ffc107';
    if (percentage >= 25) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👑 Admin Dashboard</h1>
          <p style={styles.subtitle}>Roaring Tigers CRM Management</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Team Overview Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalRMs}</div>
            <div style={styles.statLabel}>Total RMs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🤝</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalCPs}</div>
            <div style={styles.statLabel}>Total CPs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statValue}>{teamStats.activeCPs}</div>
            <div style={styles.statLabel}>Active CPs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalSales}</div>
            <div style={styles.statLabel}>Total Sales</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalMeetings}</div>
            <div style={styles.statLabel}>Total Meetings</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💵</div>
          <div>
            <div style={styles.statValue}>{formatCurrency(teamStats.totalRevenue)}</div>
            <div style={styles.statLabel}>Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Current Month Performance */}
      <div style={styles.monthlyStats}>
        <h2 style={styles.sectionTitle}>📊 {getCurrentPeriod().toUpperCase()} Performance</h2>
        <div style={styles.monthlyGrid}>
          <div style={styles.monthlyCard}>
            <div style={styles.monthlyLabel}>CPs Onboarded</div>
            <div style={styles.monthlyValue}>{teamStats.currentMonth?.cp_onboarding || 0}</div>
          </div>
          <div style={styles.monthlyCard}>
            <div style={styles.monthlyLabel}>Sales Closed</div>
            <div style={styles.monthlyValue}>{teamStats.currentMonth?.sales || 0}</div>
          </div>
          <div style={styles.monthlyCard}>
            <div style={styles.monthlyLabel}>Meetings Held</div>
            <div style={styles.monthlyValue}>{teamStats.currentMonth?.meetings || 0}</div>
          </div>
          <div style={styles.monthlyCard}>
            <div style={styles.monthlyLabel}>Revenue Generated</div>
            <div style={styles.monthlyValue}>{formatCurrency(teamStats.currentMonth?.revenue || 0)}</div>
          </div>
        </div>
      </div>

      {/* Team Alerts */}
      {teamStats.needsAttention?.length > 0 && (
        <div style={styles.alertsSection}>
          <h2 style={styles.sectionTitle}>🚨 RMs Needing Attention</h2>
          <div style={styles.alertsGrid}>
            {teamStats.needsAttention.map(rm => (
              <div key={rm.id} style={styles.alertCard}>
                <div style={styles.alertHeader}>
                  <strong>{rm.name}</strong>
                  <span style={styles.alertBadge}>{Math.round(rm.avgPercentage)}%</span>
                </div>
                <div style={styles.alertDetails}>
                  <div>CPs: {rm.currentMonth.cp_onboarding}/{rm.targets?.cp_onboarding_target || 0}</div>
                  <div>Revenue: {formatCurrency(rm.currentMonth.revenue)}/{formatCurrency(rm.targets?.revenue_target || 0)}</div>
                </div>
                <button style={styles.coachBtn} onClick={() => setActiveTab('rms')}>View Details</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performer */}
      {teamStats.topPerformer && (
        <div style={styles.topPerformerSection}>
          <h2 style={styles.sectionTitle}>🏆 Top Performer of the Month</h2>
          <div style={styles.topPerformerCard}>
            <div style={styles.topPerformerHeader}>
              <span style={styles.topPerformerName}>{teamStats.topPerformer.name}</span>
              <span style={styles.topPerformerScore}>{Math.round(teamStats.topPerformer.avgPercentage)}%</span>
            </div>
            <div style={styles.topPerformerStats}>
              <div>📊 {teamStats.topPerformer.currentMonth.cp_onboarding} CPs onboarded</div>
              <div>💰 {formatCurrency(teamStats.topPerformer.currentMonth.revenue)} revenue</div>
              <div>📅 {teamStats.topPerformer.currentMonth.meetings} meetings</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('overview')} style={{...styles.tab, background: activeTab === 'overview' ? '#3498db' : '#f8f9fa', color: activeTab === 'overview' ? 'white' : '#333'}}>📊 Team Overview</button>
        <button onClick={() => setActiveTab('rms')} style={{...styles.tab, background: activeTab === 'rms' ? '#3498db' : '#f8f9fa', color: activeTab === 'rms' ? 'white' : '#333'}}>👥 RM Performance</button>
        <button onClick={() => setActiveTab('targets')} style={{...styles.tab, background: activeTab === 'targets' ? '#3498db' : '#f8f9fa', color: activeTab === 'targets' ? 'white' : '#333'}}>🎯 Targets</button>
        <button onClick={() => setActiveTab('cps')} style={{...styles.tab, background: activeTab === 'cps' ? '#3498db' : '#f8f9fa', color: activeTab === 'cps' ? 'white' : '#333'}}>🤝 CPs</button>
        <button onClick={() => setActiveTab('sales')} style={{...styles.tab, background: activeTab === 'sales' ? '#3498db' : '#f8f9fa', color: activeTab === 'sales' ? 'white' : '#333'}}>💰 Sales</button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Team Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={styles.sectionTitle}>Team Performance Summary</h2>
            <div style={styles.teamSummary}>
              {rmPerformance.map(rm => (
                <div key={rm.id} style={styles.teamRow}>
                  <div style={styles.teamRowHeader}>
                    <span style={styles.rmName}>{rm.name}</span>
                    <span style={{...styles.rmStatus, background: rm.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                      {rm.status}
                    </span>
                  </div>
                  <div style={styles.teamProgress}>
                    <div style={styles.progressLabels}>
                      <span>CP Onboarding: {rm.percentages.cp_onboarding}%</span>
                      <span>Active CP: {rm.percentages.active_cp}%</span>
                      <span>Meetings: {rm.percentages.meetings}%</span>
                      <span>Revenue: {rm.percentages.revenue}%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${rm.avgPercentage}%`,
                        backgroundColor: getProgressColor(rm.avgPercentage)
                      }} />
                      <span style={styles.progressText}>{Math.round(rm.avgPercentage)}% Overall</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RM Performance Tab */}
        {activeTab === 'rms' && (
          <div>
            <h2 style={styles.sectionTitle}>RM-wise Performance</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>RM</th>
                  <th>Phone</th>
                  <th>Total CPs</th>
                  <th>Active CPs</th>
                  <th>Meetings</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rmPerformance.map(rm => (
                  <tr key={rm.id}>
                    <td><strong>{rm.name}</strong></td>
                    <td>{rm.phone}</td>
                    <td>{rm.stats.totalCPs}</td>
                    <td>{rm.stats.activeCPs}</td>
                    <td>{rm.stats.totalMeetings}</td>
                    <td>{rm.stats.totalSales}</td>
                    <td>{formatCurrency(rm.stats.totalRevenue)}</td>
                    <td>
                      <span style={{
                        ...styles.statusBadge,
                        background: rm.status === 'active' ? '#d4edda' : '#f8d7da',
                        color: rm.status === 'active' ? '#155724' : '#721c24'
                      }}>
                        {rm.status}
                      </span>
                    </td>
                    <td>
                      <button style={styles.actionBtn} onClick={() => handleSetTarget(rm.id)}>🎯 Set Target</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <div>
            <h2 style={styles.sectionTitle}>Monthly Targets vs Achievement</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>RM</th>
                  <th>Period</th>
                  <th>CP Target</th>
                  <th>CP Achieved</th>
                  <th>Active CP Target</th>
                  <th>Active CP Achieved</th>
                  <th>Meetings Target</th>
                  <th>Meetings Achieved</th>
                  <th>Revenue Target</th>
                  <th>Revenue Achieved</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {rmPerformance.map(rm => {
                  const target = rm.targets;
                  if (!target) return null;
                  return (
                    <tr key={rm.id}>
                      <td>{rm.name}</td>
                      <td>{target.period}</td>
                      <td>{target.cp_onboarding_target}</td>
                      <td>{rm.currentMonth.cp_onboarding}</td>
                      <td>{target.active_cp_target}</td>
                      <td>{rm.currentMonth.active_cp}</td>
                      <td>{target.meetings_target}</td>
                      <td>{rm.currentMonth.meetings}</td>
                      <td>{formatCurrency(target.revenue_target)}</td>
                      <td>{formatCurrency(rm.currentMonth.revenue)}</td>
                      <td>
                        <div style={styles.smallProgress}>
                          <div style={{
                            ...styles.smallProgressFill,
                            width: `${rm.avgPercentage}%`,
                            backgroundColor: getProgressColor(rm.avgPercentage)
                          }} />
                          <span>{Math.round(rm.avgPercentage)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CPs Tab */}
        {activeTab === 'cps' && (
          <div>
            <h2 style={styles.sectionTitle}>Channel Partners</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>RM</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cps.map(cp => {
                  const rm = rms.find(r => String(r.id) === String(cp.rm_id));
                  return (
                    <tr key={cp.id}>
                      <td>{cp.id}</td>
                      <td>{cp.cp_name}</td>
                      <td>{cp.phone}</td>
                      <td>{rm?.name || cp.rm_id}</td>
                      <td>{cp.cp_type}</td>
                      <td>
                        <span style={{...styles.statusBadge, background: cp.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                          {cp.status}
                        </span>
                      </td>
                      <td>
                        <button style={{...styles.deleteBtn}} onClick={() => handleDelete('channel_partners', cp.id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div>
            <h2 style={styles.sectionTitle}>All Sales</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>RM</th>
                  <th>CP</th>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const rm = rms.find(r => String(r.id) === String(sale.rm_id));
                  const cp = cps.find(c => String(c.id) === String(sale.cp_id));
                  return (
                    <tr key={sale.id}>
                      <td>{sale.id}</td>
                      <td>{rm?.name || sale.rm_id}</td>
                      <td>{cp?.cp_name || sale.cp_id}</td>
                      <td>{sale.applicant_name}</td>
                      <td>{formatCurrency(sale.sale_amount)}</td>
                      <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                      <td>
                        <button style={{...styles.deleteBtn}} onClick={() => handleDelete('sales', sale.id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  loading: {
    fontSize: '18px',
    color: '#666'
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
  title: {
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
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
  monthlyStats: {
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
  monthlyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  monthlyCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  monthlyLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  monthlyValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  alertsSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  alertsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  alertCard: {
    background: '#fff3cd',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ffeeba'
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  alertBadge: {
    padding: '3px 8px',
    background: '#856404',
    color: 'white',
    borderRadius: '3px',
    fontSize: '12px'
  },
  alertDetails: {
    fontSize: '13px',
    marginBottom: '10px'
  },
  coachBtn: {
    padding: '5px 10px',
    background: '#856404',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  topPerformerSection: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  topPerformerCard: {
    background: '#d4edda',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #c3e6cb'
  },
  topPerformerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  topPerformerName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#155724'
  },
  topPerformerScore: {
    padding: '5px 10px',
    background: '#155724',
    color: 'white',
    borderRadius: '5px',
    fontSize: '14px'
  },
  topPerformerStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px'
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    background: 'white',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  content: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  teamSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  teamRow: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px'
  },
  teamRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  rmName: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  rmStatus: {
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '12px'
  },
  teamProgress: {
    marginTop: '10px'
  },
  progressLabels: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginBottom: '10px',
    fontSize: '12px'
  },
  progressBar: {
    position: 'relative',
    height: '20px',
    background: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  progressText: {
    position: 'absolute',
    left: '10px',
    top: '2px',
    fontSize: '12px',
    color: 'white',
    fontWeight: 'bold'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '12px'
  },
  actionBtn: {
    padding: '5px 10px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#3498db',
    color: 'white'
  },
  deleteBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#dc3545',
    color: 'white'
  },
  smallProgress: {
    position: 'relative',
    width: '80px',
    height: '16px',
    background: '#e9ecef',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  smallProgressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  }
};

export default AdminDashboard;
