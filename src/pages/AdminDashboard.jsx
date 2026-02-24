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
  const [retryCount, setRetryCount] = useState(0);
  
  const navigate = useNavigate();
  // Make sure this URL is exactly correct
  const API_URL = 'https://roaring-tigers-backend.onrender.com';

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      navigate('/admin');
      return;
    }
    fetchAllData();
  }, [navigate, retryCount]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching from:', API_URL);
      
      // Test health endpoint first with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const healthRes = await fetch(`${API_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!healthRes.ok) {
        throw new Error(`Health check failed: ${healthRes.status}`);
      }
      
      // Fetch all data with individual error handling
      const fetchWithTimeout = async (url) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) return [];
          return await res.json();
        } catch (err) {
          console.warn(`Failed to fetch ${url}:`, err);
          return [];
        }
      };

      const [rmsData, cpsData, salesData, meetingsData, targetsData] = await Promise.all([
        fetchWithTimeout(`${API_URL}/rms`),
        fetchWithTimeout(`${API_URL}/channel_partners`),
        fetchWithTimeout(`${API_URL}/sales`),
        fetchWithTimeout(`${API_URL}/meetings`),
        fetchWithTimeout(`${API_URL}/targets`)
      ]);
      
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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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
        <p style={styles.errorHint}>Attempting to connect to: {API_URL}</p>
        <p style={styles.errorHint}>Make sure your backend is running at: {API_URL}/health</p>
        <div style={styles.buttonGroup}>
          <button onClick={handleRetry} style={styles.retryBtn}>🔄 Retry</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
        <div style={styles.testLinks}>
          <h3>Test these URLs directly:</h3>
          <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">Health Check</a><br/>
          <a href={`${API_URL}/rms`} target="_blank" rel="noopener noreferrer">RMs Data</a><br/>
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
      
      <pre style={styles.debug}>
        {JSON.stringify({ 
          apiUrl: API_URL,
          rms: rms.length, 
          cps: cps.length, 
          sales: sales.length, 
          meetings: meetings.length,
          targets: targets.length 
        }, null, 2)}
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
    marginBottom: '10px'
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
