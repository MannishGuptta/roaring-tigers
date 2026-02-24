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
  
  // ✅ CORRECT BACKEND URL - DO NOT CHANGE
  const API_URL = 'https://roaring-tigers-backend.onrender.com';

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
      console.log('🌐 Connecting to backend:', API_URL);
      
      // Test health endpoint first
      const healthRes = await fetch(`${API_URL}/health`);
      if (!healthRes.ok) {
        throw new Error(`Backend health check failed`);
      }
      
      // Fetch all data
      const [rmsRes, cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
        fetch(`${API_URL}/rms`),
        fetch(`${API_URL}/channel_partners`),
        fetch(`${API_URL}/sales`),
        fetch(`${API_URL}/meetings`),
        fetch(`${API_URL}/targets`)
      ]);
      
      const rmsData = await rmsRes.json();
      const cpsData = await cpsRes.json();
      const salesData = await salesRes.json();
      const meetingsData = await meetingsRes.json();
      const targetsData = await targetsRes.json();
      
      setRms(rmsData || []);
      setCps(cpsData || []);
      setSales(salesData || []);
      setMeetings(meetingsData || []);
      setTargets(targetsData || []);
      
      console.log('✅ Data loaded successfully');
      
    } catch (err) {
      console.error('❌ Fetch error:', err);
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
      <div style={styles.container}>
        <h2>Loading Admin Dashboard...</h2>
        <p>Connecting to: {API_URL}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={{ color: '#dc3545' }}>❌ Connection Error</h2>
        <p>{error}</p>
        <p>Attempted to connect to: <strong>{API_URL}</strong></p>
        <div style={styles.buttonGroup}>
          <button onClick={fetchAllData} style={styles.retryBtn}>🔄 Retry</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
        <div style={styles.testLinks}>
          <h3>✅ Working Endpoints (test in browser):</h3>
          <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">Health Check</a><br/>
          <a href={`${API_URL}/rms`} target="_blank" rel="noopener noreferrer">RMs Data (6 records)</a><br/>
          <a href={`${API_URL}/channel_partners`} target="_blank" rel="noopener noreferrer">CPs Data</a>
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
      
      <div style={styles.dataSummary}>
        <h3>📊 Data Summary</h3>
        <p><strong>Connected to:</strong> {API_URL}</p>
        <p><strong>RMs:</strong> {rms.length} records</p>
        <p><strong>CPs:</strong> {cps.length} records</p>
        <p><strong>Sales:</strong> {sales.length} records</p>
        <p><strong>Meetings:</strong> {meetings.length} records</p>
        <p><strong>Targets:</strong> {targets.length} records</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
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
  retryBtn: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px'
  },
  buttonGroup: {
    margin: '20px 0'
  },
  testLinks: {
    textAlign: 'left',
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '5px',
    marginTop: '20px'
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
  dataSummary: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px'
  }
};

export default AdminDashboard;
