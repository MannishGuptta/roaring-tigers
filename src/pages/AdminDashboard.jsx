import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('rms');
  const [rms, setRms] = useState([]);
  const [cps, setCps] = useState([]);
  const [sales, setSales] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState(null);
  const navigate = useNavigate();
  
  const API_URL = 'https://roaring-tigers-backend.onrender.com';

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
      const [rmsRes, cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
        fetch(`${API_URL}/rms`),
        fetch(`${API_URL}/channel_partners`),
        fetch(`${API_URL}/sales`),
        fetch(`${API_URL}/meetings`),
        fetch(`${API_URL}/targets`)
      ]);
      
      setRms(await rmsRes.json() || []);
      setCps(await cpsRes.json() || []);
      setSales(await salesRes.json() || []);
      setMeetings(await meetingsRes.json() || []);
      setTargets(await targetsRes.json() || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      await fetch(`${API_URL}/${type}/${id}`, {
        method: 'DELETE'
      });
      loadAllData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleSetTarget = async (rmId) => {
    const period = prompt("Enter period (e.g., march-2026):");
    if (!period) return;
    
    const cpTarget = prompt("Enter CP Onboarding Target:");
    const activeTarget = prompt("Enter Active CP Target:");
    const meetingsTarget = prompt("Enter Meetings Target:");
    const revenueTarget = prompt("Enter Revenue Target (in rupees):");
    
    const targetData = {
      rm_id: rmId,
      period,
      cp_onboarding_target: parseInt(cpTarget) || 0,
      active_cp_target: parseInt(activeTarget) || 0,
      meetings_target: parseInt(meetingsTarget) || 0,
      revenue_target: parseInt(revenueTarget) || 0
    };

    try {
      await fetch(`${API_URL}/targets`, {
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
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStats = () => ({
    totalRMs: rms.length,
    totalCPs: cps.length,
    totalSales: sales.length,
    totalMeetings: meetings.length,
    totalRevenue: sales.reduce((sum, s) => sum + (s.sale_amount || 0), 0)
  });

  const stats = getStats();

  if (loading) {
    return <div style={styles.loading}>Loading admin dashboard...</div>;
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
            <div style={styles.statValue}>{stats.totalRMs}</div>
            <div style={styles.statLabel}>Total RMs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🤝</div>
          <div>
            <div style={styles.statValue}>{stats.totalCPs}</div>
            <div style={styles.statLabel}>Total CPs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statValue}>{stats.totalSales}</div>
            <div style={styles.statLabel}>Total Sales</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div>
            <div style={styles.statValue}>{stats.totalMeetings}</div>
            <div style={styles.statLabel}>Total Meetings</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💵</div>
          <div>
            <div style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
            <div style={styles.statLabel}>Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('rms')} style={{...styles.tab, background: activeTab === 'rms' ? '#3498db' : '#f8f9fa', color: activeTab === 'rms' ? 'white' : '#333'}}>👥 RMs ({rms.length})</button>
        <button onClick={() => setActiveTab('cps')} style={{...styles.tab, background: activeTab === 'cps' ? '#3498db' : '#f8f9fa', color: activeTab === 'cps' ? 'white' : '#333'}}>🤝 CPs ({cps.length})</button>
        <button onClick={() => setActiveTab('sales')} style={{...styles.tab, background: activeTab === 'sales' ? '#3498db' : '#f8f9fa', color: activeTab === 'sales' ? 'white' : '#333'}}>💰 Sales ({sales.length})</button>
        <button onClick={() => setActiveTab('meetings')} style={{...styles.tab, background: activeTab === 'meetings' ? '#3498db' : '#f8f9fa', color: activeTab === 'meetings' ? 'white' : '#333'}}>📅 Meetings ({meetings.length})</button>
        <button onClick={() => setActiveTab('targets')} style={{...styles.tab, background: activeTab === 'targets' ? '#3498db' : '#f8f9fa', color: activeTab === 'targets' ? 'white' : '#333'}}>🎯 Targets ({targets.length})</button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* RMs Tab */}
        {activeTab === 'rms' && (
          <div>
            <h2 style={styles.sectionTitle}>Relationship Managers</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
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
                    <td>{rm.id}</td>
                    <td>{rm.name}</td>
                    <td>{rm.phone}</td>
                    <td>{rm.email}</td>
                    <td>
                      <span style={{...styles.badge, background: rm.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                        {rm.status}
                      </span>
                    </td>
                    <td>
                      <button style={styles.actionBtn} onClick={() => handleSetTarget(rm.id)}>🎯 Set Target</button>
                      <button style={{...styles.actionBtn, background: '#dc3545'}} onClick={() => handleDelete('rms', rm.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
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
                        <span style={{...styles.badge, background: cp.status === 'active' ? '#d4edda' : '#f8d7da'}}>
                          {cp.status}
                        </span>
                      </td>
                      <td>
                        <button style={{...styles.actionBtn, background: '#dc3545'}} onClick={() => handleDelete('channel_partners', cp.id)}>🗑️</button>
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
            <h2 style={styles.sectionTitle}>Sales Records</h2>
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
                        <button style={{...styles.actionBtn, background: '#dc3545'}} onClick={() => handleDelete('sales', sale.id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div>
            <h2 style={styles.sectionTitle}>Meeting Logs</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>RM</th>
                  <th>CP</th>
                  <th>Date</th>
                  <th>Outcome</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(meeting => {
                  const rm = rms.find(r => String(r.id) === String(meeting.rm_id));
                  const cp = cps.find(c => String(c.id) === String(meeting.cp_id));
                  return (
                    <tr key={meeting.id}>
                      <td>{meeting.id}</td>
                      <td>{rm?.name || meeting.rm_id}</td>
                      <td>{cp?.cp_name || meeting.cp_id}</td>
                      <td>{new Date(meeting.meeting_date).toLocaleDateString()}</td>
                      <td>{meeting.outcome}</td>
                      <td>
                        <button style={{...styles.actionBtn, background: '#dc3545'}} onClick={() => handleDelete('meetings', meeting.id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <div>
            <h2 style={styles.sectionTitle}>Monthly Targets</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>RM</th>
                  <th>Period</th>
                  <th>CP Target</th>
                  <th>Active CP</th>
                  <th>Meetings</th>
                  <th>Revenue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map(target => {
                  const rm = rms.find(r => String(r.id) === String(target.rm_id));
                  return (
                    <tr key={target.id}>
                      <td>{rm?.name || target.rm_id}</td>
                      <td>{target.period}</td>
                      <td>{target.cp_onboarding_target}</td>
                      <td>{target.active_cp_target}</td>
                      <td>{target.meetings_target}</td>
                      <td>{formatCurrency(target.revenue_target)}</td>
                      <td>
                        <button style={{...styles.actionBtn, background: '#dc3545'}} onClick={() => handleDelete('targets', target.id)}>🗑️</button>
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
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px'
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
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 20px 0'
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
    margin: '0 5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#3498db',
    color: 'white'
  }
};

export default AdminDashboard;
