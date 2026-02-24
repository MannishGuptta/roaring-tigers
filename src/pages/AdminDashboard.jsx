import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // THIS IS THE CORRECT URL - MAKE SURE IT'S EXACT
  const API_URL = 'https://roaring-tigers-backend.onrender.com';

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      navigate('/admin');
      return;
    }
    testConnection();
  }, [navigate]);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test each endpoint individually
      const endpoints = ['health', 'rms', 'channel_partners', 'meetings', 'sales', 'targets'];
      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const url = `${API_URL}/${endpoint}`;
          console.log(`Testing: ${url}`);
          const res = await fetch(url);
          const text = await res.text();
          results[endpoint] = {
            status: res.status,
            ok: res.ok,
            preview: text.substring(0, 100)
          };
        } catch (err) {
          results[endpoint] = {
            error: err.message
          };
        }
      }
      
      setTestResult(results);
    } catch (err) {
      setTestResult({ error: err.message });
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
        <h1>Testing Backend Connection...</h1>
        <p>Attempting to connect to: {API_URL}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👑 Admin Dashboard - Diagnostic Mode</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
      
      <div style={styles.section}>
        <h2>Backend URL: {API_URL}</h2>
        <button onClick={testConnection} style={styles.retryBtn}>🔄 Retest</button>
      </div>
      
      <div style={styles.results}>
        <h3>Test Results:</h3>
        <pre style={styles.pre}>
          {JSON.stringify(testResult, null, 2)}
        </pre>
      </div>
      
      <div style={styles.manualTest}>
        <h3>Manual Test Links:</h3>
        <ul>
          <li><a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">Health Check</a></li>
          <li><a href={`${API_URL}/rms`} target="_blank" rel="noopener noreferrer">RMs Data</a></li>
          <li><a href={`${API_URL}/channel_partners`} target="_blank" rel="noopener noreferrer">CPs Data</a></li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
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
  section: {
    marginBottom: '20px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '5px'
  },
  retryBtn: {
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  results: {
    marginBottom: '20px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '5px'
  },
  pre: {
    background: '#2d2d2d',
    color: '#f8f8f2',
    padding: '15px',
    borderRadius: '5px',
    overflow: 'auto',
    fontSize: '12px'
  },
  manualTest: {
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '5px'
  }
};

export default AdminDashboard;
