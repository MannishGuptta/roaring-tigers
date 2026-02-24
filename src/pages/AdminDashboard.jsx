import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [rms, setRms] = useState([]);
  const [cps, setCps] = useState([]);
  const [sales, setSales] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const baseUrl = 'https://roaring-tigers-api.onrender.com';

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      navigate('/admin');
      return;
    }
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching from:', baseUrl);
      
      // Fetch all data in parallel
      const [rmsRes, cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
        fetch(`${baseUrl}/rms`),
        fetch(`${baseUrl}/channel_partners`),
        fetch(`${baseUrl}/sales`),
        fetch(`${baseUrl}/meetings`),
        fetch(`${baseUrl}/targets`)
      ]);
      
      console.log('Response statuses:', {
        rms: rmsRes.status,
        cps: cpsRes.status,
        sales: salesRes.status,
        meetings: meetingsRes.status,
        targets: targetsRes.status
      });
      
      // Parse JSON
      const rmsData = await rmsRes.json();
      const cpsData = await cpsRes.json();
      const salesData = await salesRes.json();
      const meetingsData = await meetingsRes.json();
      const targetsData = await targetsRes.json();
      
      console.log('Data received:', {
        rms: rmsData?.length,
        cps: cpsData?.length,
        sales: salesData?.length,
        meetings: meetingsData?.length,
        targets: targetsData?.length
      });
      
      setRms(Array.isArray(rmsData) ? rmsData : []);
      setCps(Array.isArray(cpsData) ? cpsData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
      setTargets(Array.isArray(targetsData) ? targetsData : []);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error Loading Data</h2>
        <p style={styles.error}>{error}</p>
        <button onClick={fetchAllData} style={styles.retryBtn}>Retry</button>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>👑 Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Total RMs</h3>
          <p style={styles.statNumber}>{rms.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total CPs</h3>
          <p style={styles.statNumber}>{cps.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total Sales</h3>
          <p style={styles.statNumber}>{sales.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total Meetings</h3>
          <p style={styles.statNumber}>{meetings.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total Revenue</h3>
          <p style={styles.statNumber}>{formatCurrency(sales.reduce((sum, s) => sum + (s.sale_amount || 0), 0))}</p>
        </div>
      </div>

      {/* RMs Table */}
      <div style={styles.section}>
        <h2>Relationship Managers ({rms.length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rms.map(rm => (
              <tr key={rm.id}>
                <td>{rm.id}</td>
                <td>{rm.name}</td>
                <td>{rm.phone}</td>
                <td>{rm.email}</td>
                <td>{rm.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CPs Table */}
      <div style={styles.section}>
        <h2>Channel Partners ({cps.length})</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>RM ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cps.map(cp => (
              <tr key={cp.id}>
                <td>{cp.id}</td>
                <td>{cp.cp_name}</td>
                <td>{cp.phone}</td>
                <td>{cp.rm_id}</td>
                <td>{cp.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  errorContainer: {
    textAlign: 'center',
    padding: '40px'
  },
  error: {
    color: 'red',
    margin: '20px 0'
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
    marginBottom: '30px'
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#3498db',
    margin: '10px 0 0 0'
  },
  section: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px'
  }
};

export default AdminDashboard;
