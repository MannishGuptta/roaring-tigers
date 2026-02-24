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
  const [rawResponse, setRawResponse] = useState(null);
  
  const navigate = useNavigate();
  const baseUrl = 'https://roaring-tigers-backend.onrender.com';

  useEffect(() => {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
      navigate('/admin');
      return;
    }
    fetchWithDebug();
  }, [navigate]);

  const fetchWithDebug = async () => {
    setLoading(true);
    try {
      // First, get the raw response as text
      const response = await fetch(`${baseUrl}/rms`);
      const text = await response.text();
      
      setRawResponse({
        url: `${baseUrl}/rms`,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        text: text.substring(0, 500) // First 500 chars
      });
      
      // Try to parse it
      try {
        const data = JSON.parse(text);
        setRms(Array.isArray(data) ? data : []);
        
        // If successful, fetch other data
        const [cpsRes, salesRes, meetingsRes, targetsRes] = await Promise.all([
          fetch(`${baseUrl}/channel_partners`).then(r => r.json()),
          fetch(`${baseUrl}/sales`).then(r => r.json()),
          fetch(`${baseUrl}/meetings`).then(r => r.json()),
          fetch(`${baseUrl}/targets`).then(r => r.json())
        ]);
        
        setCps(cpsRes);
        setSales(salesRes);
        setMeetings(meetingsRes);
        setTargets(targetsRes);
        
      } catch (e) {
        setError(`JSON Parse Error: ${e.message}`);
      }
      
    } catch (err) {
      setError(`Fetch Error: ${err.message}`);
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
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || rawResponse) {
    return (
      <div style={styles.debugContainer}>
        <h1 style={styles.debugTitle}>🔍 API Debug Information</h1>
        
        <div style={styles.section}>
          <h2>Request Details</h2>
          <p><strong>URL:</strong> {rawResponse?.url}</p>
          <p><strong>Status:</strong> {rawResponse?.status} {rawResponse?.statusText}</p>
          <p><strong>Content-Type:</strong> {rawResponse?.contentType || 'not set'}</p>
        </div>
        
        <div style={styles.section}>
          <h2>Raw Response (first 500 characters)</h2>
          <pre style={styles.pre}>
            {rawResponse?.text || 'No response received'}
          </pre>
        </div>
        
        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div style={styles.actions}>
          <button onClick={fetchWithDebug} style={styles.button}>🔄 Retry</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          <a 
            href={`${baseUrl}/rms`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={styles.link}
          >
            Open in Browser
          </a>
        </div>
        
        <p style={styles.note}>
          If you see HTML tags (&lt;!DOCTYPE&gt;, &lt;html&gt;, etc.) in the raw response, 
          your Render backend might be returning an error page instead of JSON.
        </p>
      </div>
    );
  }

  // Success state - show data
  return (
    <div style={styles.container}>
      <h1>✅ Admin Dashboard - Data Loaded Successfully</h1>
      <p>RMs: {rms.length}</p>
      <p>CPs: {cps.length}</p>
      <p>Sales: {sales.length}</p>
      <p>Meetings: {meetings.length}</p>
      <p>Targets: {targets.length}</p>
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
  debugContainer: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '30px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
  },
  debugTitle: {
    color: '#e67e22',
    marginBottom: '30px'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  pre: {
    background: '#2d2d2d',
    color: '#f8f8f2',
    padding: '15px',
    borderRadius: '5px',
    overflow: 'auto',
    fontSize: '12px',
    fontFamily: 'monospace',
    maxHeight: '300px'
  },
  errorBox: {
    background: '#fee',
    padding: '15px',
    borderRadius: '5px',
    color: '#c00',
    marginBottom: '20px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  button: {
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
  link: {
    padding: '10px 20px',
    background: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    display: 'inline-block'
  },
  note: {
    fontSize: '14px',
    color: '#666',
    marginTop: '20px',
    padding: '10px',
    background: '#fff3cd',
    borderRadius: '5px'
  }
};

export default AdminDashboard;
