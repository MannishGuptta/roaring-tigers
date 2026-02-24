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
  const [apiUrl, setApiUrl] = useState('https://roaring-tigers-backend.onrender.com');
  
  const navigate = useNavigate();

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
      console.log('Fetching from:', apiUrl);
      
      // Test health endpoint first
      const healthRes = await fetch(`${apiUrl}/health`);
      console.log('Health check status:', healthRes.status);
      
      if (!healthRes.ok) {
        throw new Error(`Health check failed: ${healthRes.status}`);
      }
      
      // Fetch all data
      const [rmsRes, cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
        fetch(`${apiUrl}/rms`),
        fetch(`${apiUrl}/channel_partners`),
        fetch(`${apiUrl}/sales`),
        fetch(`${apiUrl}/meetings`),
        fetch(`${apiUrl}/targets`)
      ]);
      
      console.log('Response statuses:', {
        rms: rmsRes.status,
        cps: cpsRes.status,
        sales: salesRes.status,
        meetings: meetingsRes.status,
        targets: targetsRes.status
      });
      
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
      
      setRms(rmsData || []);
      setCps(cpsData || []);
      setSales(salesData || []);
      setMeetings(meetingsData || []);
      setTargets(targetsData || []);
      
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
        <h2>❌ Connection Error</h2>
        <p style={styles.errorMessage}>{error}</p>
        <p style={styles.errorHint}>Attempting to connect to: {apiUrl}</p>
        <div style={styles.buttonGroup}>
          <button onClick={fetchAllData} style={styles.retryBtn}>🔄 Retry</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
        <div style={styles.testLinks}>
          <h3>Test these URLs directly:</h3>
          <a href={`${apiUrl}/health`} target="_blank" rel="noopener noreferrer">Health Check</a><br/>
          <a href={`${apiUrl}/rms`} target="_blank" rel="noopener noreferrer">RMs Data</a><br/>
          <a href={`${apiUrl}/channel_partners`} target="_blank" rel="noopener noreferrer">CPs Data</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👑 Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
      
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
      </div>
      
      <pre style={styles.debug}>
        {JSON.stringify({ rms: rms.length, cps: cps.length, sales: sales.length, meetings: meetings.length }, null, 2)}
      </pre>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
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
    maxWidth: '600px',
    margin: '40px auto',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  errorMessage: {
    color: '#dc3545',
    margin: '20px 0'
  },
  errorHint: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '20px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '30px'
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  testLinks: {
    textAlign: 'left',
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '5px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
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
  debug: {
    background: '#f5f5f5',
    padding: '15px',
    borderRadius: '5px',
    overflow: 'auto'
  }
};

export default AdminDashboard;
