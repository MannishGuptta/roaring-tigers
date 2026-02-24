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
  const [teamStats, setTeamStats] = useState({
    totalRMs: 0,
    totalCPs: 0,
    activeCPs: 0,
    totalSales: 0,
    totalMeetings: 0,
    totalRevenue: 0,
    currentMonth: {
      cp_onboarding: 0,
      sales: 0,
      meetings: 0,
      revenue: 0
    }
  });
  const [loading, setLoading] = useState(true);
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
      
      console.log('Fetching data from:', baseUrl);
      
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
      
      console.log('RMs loaded:', rmsData.length);
      console.log('CPs loaded:', cpsData.length);
      console.log('Sales loaded:', salesData.length);
      
      setRms(rmsData);
      setCps(cpsData);
      setSales(salesData);
      setMeetings(meetingsData);
      setTargets(targetsData);
      
      // Calculate active CPs
      const cpWithSales = new Set();
      salesData.forEach(sale => {
        if (sale.cp_id) cpWithSales.add(String(sale.cp_id));
      });
      
      // Calculate current month stats
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const currentMonthCPs = cpsData.filter(cp => 
        cp.onboard_date && new Date(cp.onboard_date) >= monthStart
      ).length;
      
      const currentMonthSales = salesData.filter(sale => 
        sale.sale_date && new Date(sale.sale_date) >= monthStart
      );
      
      const currentMonthMeetings = meetingsData.filter(meeting => 
        meeting.meeting_date && new Date(meeting.meeting_date) >= monthStart
      ).length;
      
      const currentMonthRevenue = currentMonthSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0);
      
      setTeamStats({
        totalRMs: rmsData.length,
        totalCPs: cpsData.length,
        activeCPs: cpWithSales.size,
        totalSales: salesData.length,
        totalMeetings: meetingsData.length,
        totalRevenue: salesData.reduce((sum, s) => sum + (s.sale_amount || 0), 0),
        currentMonth: {
          cp_onboarding: currentMonthCPs,
          sales: currentMonthSales.length,
          meetings: currentMonthMeetings,
          revenue: currentMonthRevenue
        }
      });
      
      // Calculate RM performance
      const performance = rmsData.map(rm => {
        const rmId = String(rm.id);
        const rmCPs = cpsData.filter(cp => String(cp.rm_id) === rmId);
        const rmSales = salesData.filter(sale => String(sale.rm_id) === rmId);
        const rmMeetings = meetingsData.filter(meeting => String(meeting.rm_id) === rmId);
        
        const activeCPsForRM = new Set();
        rmSales.forEach(sale => {
          if (sale.cp_id) activeCPsForRM.add(String(sale.cp_id));
        });
        
        const currentMonthRMSales = rmSales.filter(sale => 
          sale.sale_date && new Date(sale.sale_date) >= monthStart
        );
        
        return {
          ...rm,
          stats: {
            totalCPs: rmCPs.length,
            activeCPs: activeCPsForRM.size,
            totalSales: rmSales.length,
            totalMeetings: rmMeetings.length,
            totalRevenue: rmSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0)
          },
          currentMonth: {
            cp_onboarding: rmCPs.filter(cp => cp.onboard_date && new Date(cp.onboard_date) >= monthStart).length,
            active_cp: activeCPsForRM.size,
            meetings: rmMeetings.filter(m => m.meeting_date && new Date(m.meeting_date) >= monthStart).length,
            revenue: currentMonthRMSales.reduce((sum, s) => sum + (s.sale_amount || 0), 0)
          }
        };
      });
      
      setRmPerformance(performance);
      
    } catch (err) {
      console.error('Error loading data:', err);
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

  const handleLogout = () => {
    sessionStorage.removeItem('admin');
    navigate('/admin');
  };

  const getCurrentPeriod = () => {
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' }).toLowerCase();
    const year = date.getFullYear();
    return `${month}-${year}`;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading dashboard data...</div>
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

      {/* Stats Overview */}
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
            <div style={styles.monthlyValue}>{teamStats.currentMonth.cp_onboarding}</div>
          </div>
          <div style={styles.monthlyCard}>
            <div style={styles.monthlyLabel}>Sales Closed</div>
            <div style={styles.monthlyValue}>{teamStats.currentMonth.sales}</div>
          </div>
          <div style={styles.monthlyCard}>
            <div style={styles.monthlyLabel}>Meetings Held</div>
            <div style={styles.monthlyValue}>{teamStats.currentMonth.meetings}</div>
          </div>
          <div style={styles.monthlyCard}>
            <div style={styles.monthlyLabel}>Revenue Generated</div>
            <div style={styles.monthlyValue}>{formatCurrency(teamStats.currentMonth.revenue)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('overview')} style={{...styles.tab, background: activeTab === 'overview' ? '#3498db' : '#f8f9fa', color: activeTab === 'overview' ? 'white' : '#333'}}>📊 Team Overview</button>
        <button onClick={() => setActiveTab('rms')} style={{...styles.tab, background: activeTab === 'rms' ? '#3498db' : '#f8f9fa', color: activeTab === 'rms' ? 'white' : '#333'}}>👥 RMs</button>
        <button onClick={() => setActiveTab('targets')} style={{...styles.tab, background: activeTab === 'targets' ? '#3498db' : '#f8f9fa', color: activeTab === 'targets' ? 'white' : '#333'}}>🎯 Targets</button>
        <button onClick={() => setActiveTab('cps')} style={{...styles.tab, background: activeTab === 'cps' ? '#3498db' : '#f8f9fa', color: activeTab === 'cps' ? 'white' : '#333'}}>🤝 CPs</button>
        <button onClick={() => setActiveTab('sales')} style={{...styles.tab, background: activeTab === 'sales' ? '#3498db' : '#f8f9fa', color: activeTab === 'sales' ? 'white' : '#333'}}>💰 Sales</button>
        <button onClick={() => setActiveTab('meetings')} style={{...styles.tab, background: activeTab === 'meetings' ? '#3498db' : '#f8f9fa', color: activeTab === 'meetings' ? 'white' : '#333'}}>📅 Meetings</button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Team Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={styles.sectionTitle}>Team Performance Summary</h2>
            {rmPerformance.length === 0 ? (
              <p style={styles.noData}>No RM data available</p>
            ) : (
              <div style={styles.teamSummary}>
                {rmPerformance.map(rm => (
                  <div key={rm.id} style={styles.teamRow}>
                    <div style={styles.teamRowHeader}>
                      <span style={styles.rmName}>{rm.name}</span>
                      <span style={{...styles.statusBadge, background: rm.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                        {rm.status}
                      </span>
                    </div>
                    <div style={styles.teamStats}>
                      <div>CPs: {rm.stats.totalCPs} | Active: {rm.stats.activeCPs}</div>
                      <div>Sales: {rm.stats.totalSales} | Revenue: {formatCurrency(rm.stats.totalRevenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RMs Tab */}
        {activeTab === 'rms' && (
          <div>
            <h2 style={styles.sectionTitle}>Relationship Managers</h2>
            {rms.length === 0 ? (
              <p style={styles.noData}>No RMs found</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rms.map(rm => (
                    <tr key={rm.id}>
                      <td>{rm.name}</td>
                      <td>{rm.phone}</td>
                      <td>{rm.email}</td>
                      <td>
                        <span style={{...styles.badge, background: rm.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                          {rm.status}
                        </span>
                      </td>
                      <td>
                        <button style={styles.actionBtn}>🎯 Set Target</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* CPs Tab */}
        {activeTab === 'cps' && (
          <div>
            <h2 style={styles.sectionTitle}>Channel Partners</h2>
            {cps.length === 0 ? (
              <p style={styles.noData}>No CPs found</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>RM</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cps.map(cp => {
                    const rm = rms.find(r => String(r.id) === String(cp.rm_id));
                    return (
                      <tr key={cp.id}>
                        <td>{cp.cp_name}</td>
                        <td>{cp.phone}</td>
                        <td>{rm?.name || cp.rm_id}</td>
                        <td>
                          <span style={{...styles.badge, background: cp.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                            {cp.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
    fontSize: '24px'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '11px',
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
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px'
  },
  monthlyValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333'
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    background: 'white',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    flexWrap: 'wrap'
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    minWidth: '80px'
  },
  content: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    padding: '40px'
  },
  teamSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
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
    fontWeight: 'bold'
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '12px'
  },
  teamStats: {
    fontSize: '13px',
    color: '#666'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '12px'
  },
  actionBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#3498db',
    color: 'white'
  }
};

export default AdminDashboard;
