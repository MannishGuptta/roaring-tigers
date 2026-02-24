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
  const [error, setError] = useState(null);
  
  // Modal states
  const [showRMModal, setShowRMModal] = useState(false);
  const [showCPModal, setShowCPModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [rmForm, setRmForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    status: 'active'
  });
  
  const [cpForm, setCpForm] = useState({
    cp_name: '',
    phone: '',
    email: '',
    address: '',
    cp_type: 'individual',
    operating_markets: '',
    industry: '',
    expected_monthly_business: '',
    rm_id: '',
    status: 'active'
  });
  
  const [targetForm, setTargetForm] = useState({
    rm_id: '',
    period: '',
    cp_onboarding_target: '',
    active_cp_target: '',
    meetings_target: '',
    revenue_target: ''
  });

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
    setError(null);
    try {
      const [rmsRes, cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
        fetch(`${API_URL}/rms`),
        fetch(`${API_URL}/channel_partners`),
        fetch(`${API_URL}/sales`),
        fetch(`${API_URL}/meetings`),
        fetch(`${API_URL}/targets`)
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
      
      // Calculate RM performance
      calculateRmPerformance(rmsData, cpsData, salesData, meetingsData, targetsData);
      
      // Calculate team stats
      calculateTeamStats(rmsData, cpsData, salesData, meetingsData);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
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

  // CRUD Handlers
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      await fetch(`${API_URL}/${type}/${id}`, {
        method: 'DELETE'
      });
      loadAllData();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Error deleting item');
    }
  };

  // RM Handlers
  const handleAddRM = () => {
    setEditingItem(null);
    setRmForm({
      name: '',
      phone: '',
      email: '',
      password: '',
      status: 'active'
    });
    setShowRMModal(true);
  };

  const handleEditRM = (rm) => {
    setEditingItem(rm);
    setRmForm({
      name: rm.name,
      phone: rm.phone,
      email: rm.email,
      password: '',
      status: rm.status
    });
    setShowRMModal(true);
  };

  const handleRMSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${API_URL}/rms/${editingItem.id}` : `${API_URL}/rms`;
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rmForm)
      });
      
      if (response.ok) {
        setShowRMModal(false);
        loadAllData();
      } else {
        alert('Failed to save RM');
      }
    } catch (err) {
      console.error('Error saving RM:', err);
      alert('Error saving RM');
    }
  };

  // CP Handlers
  const handleAddCP = () => {
    setEditingItem(null);
    setCpForm({
      cp_name: '',
      phone: '',
      email: '',
      address: '',
      cp_type: 'individual',
      operating_markets: '',
      industry: '',
      expected_monthly_business: '',
      rm_id: rms[0]?.id || '',
      status: 'active'
    });
    setShowCPModal(true);
  };

  const handleEditCP = (cp) => {
    setEditingItem(cp);
    setCpForm({
      cp_name: cp.cp_name,
      phone: cp.phone,
      email: cp.email || '',
      address: cp.address || '',
      cp_type: cp.cp_type,
      operating_markets: cp.operating_markets || '',
      industry: cp.industry || '',
      expected_monthly_business: cp.expected_monthly_business || '',
      rm_id: cp.rm_id,
      status: cp.status
    });
    setShowCPModal(true);
  };

  const handleCPSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${API_URL}/channel_partners/${editingItem.id}` : `${API_URL}/channel_partners`;
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cpForm)
      });
      
      if (response.ok) {
        setShowCPModal(false);
        loadAllData();
      } else {
        alert('Failed to save CP');
      }
    } catch (err) {
      console.error('Error saving CP:', err);
      alert('Error saving CP');
    }
  };

  // Target Handlers
  const handleAddTarget = (rm) => {
    setEditingItem(null);
    setTargetForm({
      rm_id: rm.id,
      period: getCurrentPeriod(),
      cp_onboarding_target: '',
      active_cp_target: '',
      meetings_target: '',
      revenue_target: ''
    });
    setShowTargetModal(true);
  };

  const handleTargetSave = async (e) => {
    e.preventDefault();
    try {
      const targetData = {
        rm_id: targetForm.rm_id,
        period: targetForm.period,
        cp_onboarding_target: parseInt(targetForm.cp_onboarding_target) || 0,
        active_cp_target: parseInt(targetForm.active_cp_target) || 0,
        meetings_target: parseInt(targetForm.meetings_target) || 0,
        revenue_target: parseInt(targetForm.revenue_target) || 0
      };
      
      const response = await fetch(`${API_URL}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetData)
      });
      
      if (response.ok) {
        setShowTargetModal(false);
        loadAllData();
      } else {
        alert('Failed to save target');
      }
    } catch (err) {
      console.error('Error saving target:', err);
      alert('Error saving target');
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

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error Loading Data</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={loadAllData} style={styles.retryBtn}>Retry</button>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
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
            <div style={styles.statValue}>{teamStats.totalRMs || rms.length}</div>
            <div style={styles.statLabel}>Total RMs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🤝</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalCPs || cps.length}</div>
            <div style={styles.statLabel}>Total CPs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statValue}>{teamStats.activeCPs || 0}</div>
            <div style={styles.statLabel}>Active CPs</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalSales || sales.length}</div>
            <div style={styles.statLabel}>Total Sales</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div>
            <div style={styles.statValue}>{teamStats.totalMeetings || meetings.length}</div>
            <div style={styles.statLabel}>Total Meetings</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💵</div>
          <div>
            <div style={styles.statValue}>{formatCurrency(teamStats.totalRevenue || 0)}</div>
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

      {/* Tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('overview')} style={{...styles.tab, background: activeTab === 'overview' ? '#3498db' : '#f8f9fa', color: activeTab === 'overview' ? 'white' : '#333'}}>📊 Team Overview</button>
        <button onClick={() => setActiveTab('rms')} style={{...styles.tab, background: activeTab === 'rms' ? '#3498db' : '#f8f9fa', color: activeTab === 'rms' ? 'white' : '#333'}}>👥 RMs ({rms.length})</button>
        <button onClick={() => setActiveTab('targets')} style={{...styles.tab, background: activeTab === 'targets' ? '#3498db' : '#f8f9fa', color: activeTab === 'targets' ? 'white' : '#333'}}>🎯 Targets ({targets.length})</button>
        <button onClick={() => setActiveTab('cps')} style={{...styles.tab, background: activeTab === 'cps' ? '#3498db' : '#f8f9fa', color: activeTab === 'cps' ? 'white' : '#333'}}>🤝 CPs ({cps.length})</button>
        <button onClick={() => setActiveTab('sales')} style={{...styles.tab, background: activeTab === 'sales' ? '#3498db' : '#f8f9fa', color: activeTab === 'sales' ? 'white' : '#333'}}>💰 Sales ({sales.length})</button>
        <button onClick={() => setActiveTab('meetings')} style={{...styles.tab, background: activeTab === 'meetings' ? '#3498db' : '#f8f9fa', color: activeTab === 'meetings' ? 'white' : '#333'}}>📅 Meetings ({meetings.length})</button>
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
            <div style={styles.tabHeader}>
              <h2 style={styles.sectionTitle}>Relationship Managers</h2>
              <button onClick={handleAddRM} style={styles.addButton}>➕ Add RM</button>
            </div>
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
                      <button onClick={() => handleEditRM(rm)} style={styles.editBtn} title="Edit">✏️</button>
                      <button onClick={() => handleAddTarget(rm)} style={styles.targetBtn} title="Set Target">🎯</button>
                      <button onClick={() => handleDelete('rms', rm.id)} style={styles.deleteBtn} title="Delete">🗑️</button>
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
                        <button onClick={() => handleDelete('targets', target.id)} style={styles.deleteBtn}>🗑️</button>
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
            <div style={styles.tabHeader}>
              <h2 style={styles.sectionTitle}>Channel Partners</h2>
              <button onClick={handleAddCP} style={styles.addButton}>➕ Add CP</button>
            </div>
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
                        <button onClick={() => handleEditCP(cp)} style={styles.editBtn} title="Edit">✏️</button>
                        <button onClick={() => handleDelete('channel_partners', cp.id)} style={styles.deleteBtn} title="Delete">🗑️</button>
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
                        <button onClick={() => handleDelete('sales', sale.id)} style={styles.deleteBtn}>🗑️</button>
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
                        <button onClick={() => handleDelete('meetings', meeting.id)} style={styles.deleteBtn}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RM Modal */}
      {showRMModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{editingItem ? 'Edit RM' : 'Add New RM'}</h3>
            <form onSubmit={handleRMSave}>
              <input type="text" placeholder="Name" value={rmForm.name} onChange={(e) => setRmForm({...rmForm, name: e.target.value})} required style={styles.modalInput} />
              <input type="tel" placeholder="Phone" value={rmForm.phone} onChange={(e) => setRmForm({...rmForm, phone: e.target.value})} required style={styles.modalInput} />
              <input type="email" placeholder="Email" value={rmForm.email} onChange={(e) => setRmForm({...rmForm, email: e.target.value})} required style={styles.modalInput} />
              <input type="password" placeholder="Password" value={rmForm.password} onChange={(e) => setRmForm({...rmForm, password: e.target.value})} required={!editingItem} style={styles.modalInput} />
              <select value={rmForm.status} onChange={(e) => setRmForm({...rmForm, status: e.target.value})} style={styles.modalInput}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowRMModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CP Modal */}
      {showCPModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{editingItem ? 'Edit CP' : 'Add New CP'}</h3>
            <form onSubmit={handleCPSave}>
              <input type="text" placeholder="CP Name" value={cpForm.cp_name} onChange={(e) => setCpForm({...cpForm, cp_name: e.target.value})} required style={styles.modalInput} />
              <input type="tel" placeholder="Phone" value={cpForm.phone} onChange={(e) => setCpForm({...cpForm, phone: e.target.value})} required style={styles.modalInput} />
              <input type="email" placeholder="Email" value={cpForm.email} onChange={(e) => setCpForm({...cpForm, email: e.target.value})} style={styles.modalInput} />
              <input type="text" placeholder="Address" value={cpForm.address} onChange={(e) => setCpForm({...cpForm, address: e.target.value})} style={styles.modalInput} />
              <select value={cpForm.cp_type} onChange={(e) => setCpForm({...cpForm, cp_type: e.target.value})} style={styles.modalInput}>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
              <input type="text" placeholder="Operating Markets" value={cpForm.operating_markets} onChange={(e) => setCpForm({...cpForm, operating_markets: e.target.value})} style={styles.modalInput} />
              <input type="text" placeholder="Industry" value={cpForm.industry} onChange={(e) => setCpForm({...cpForm, industry: e.target.value})} style={styles.modalInput} />
              <input type="number" placeholder="Expected Monthly Business" value={cpForm.expected_monthly_business} onChange={(e) => setCpForm({...cpForm, expected_monthly_business: e.target.value})} style={styles.modalInput} />
              <select value={cpForm.rm_id} onChange={(e) => setCpForm({...cpForm, rm_id: e.target.value})} required style={styles.modalInput}>
                <option value="">Select RM</option>
                {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
              </select>
              <select value={cpForm.status} onChange={(e) => setCpForm({...cpForm, status: e.target.value})} style={styles.modalInput}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCPModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Set Monthly Target</h3>
            <form onSubmit={handleTargetSave}>
              <input type="text" placeholder="Period (e.g., march-2026)" value={targetForm.period} onChange={(e) => setTargetForm({...targetForm, period: e.target.value})} required style={styles.modalInput} />
              <input type="number" placeholder="CP Onboarding Target" value={targetForm.cp_onboarding_target} onChange={(e) => setTargetForm({...targetForm, cp_onboarding_target: e.target.value})} required style={styles.modalInput} />
              <input type="number" placeholder="Active CP Target" value={targetForm.active_cp_target} onChange={(e) => setTargetForm({...targetForm, active_cp_target: e.target.value})} required style={styles.modalInput} />
              <input type="number" placeholder="Meetings Target" value={targetForm.meetings_target} onChange={(e) => setTargetForm({...targetForm, meetings_target: e.target.value})} required style={styles.modalInput} />
              <input type="number" placeholder="Revenue Target (₹)" value={targetForm.revenue_target} onChange={(e) => setTargetForm({...targetForm, revenue_target: e.target.value})} required style={styles.modalInput} />
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowTargetModal(false)} style={styles.modalCancel}>Cancel</button>
                <button type="submit" style={styles.modalSave}>Save</button>
              </div>
            </form>
          </div>
        </div>
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
  errorContainer: {
    padding: '40px',
    textAlign: 'center'
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px'
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
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  addButton: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
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
  editBtn: {
    padding: '5px 10px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#ffc107',
    color: '#333'
  },
  targetBtn: {
    padding: '5px 10px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    background: '#17a2b8',
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
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  modalInput: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },
  modalCancel: {
    padding: '8px 16px',
    background: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  modalSave: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default AdminDashboard;
