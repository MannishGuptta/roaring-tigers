import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyCPs() {
  const [rm, setRm] = useState(null);
  const [cps, setCps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const rmData = sessionStorage.getItem('rm');
    if (!rmData) {
      navigate('/');
      return;
    }
    const rm = JSON.parse(rmData);
    console.log('Logged in RM:', rm);
    setRm(rm);
    fetchCPs(rm.id);
  }, [navigate]);

  const fetchCPs = async (rmId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching CPs for RM ID:', rmId);
      
      // First, get ALL channel partners
      const response = await fetch('https://roaring-tigers-api.onrender.com/channel_partners');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const allCPs = await response.json();
      console.log('All CPs:', allCPs);
      
      // Filter manually to handle string/number comparison
      const rmCPs = allCPs.filter(cp => {
        // Convert both to string for comparison
        return String(cp.rm_id) === String(rmId);
      });
      
      console.log('Filtered CPs for RM:', rmCPs);
      setCps(rmCPs);
    } catch (err) {
      console.error('Error fetching CPs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCPs = cps.filter(cp => 
    cp.cp_name?.toLowerCase().includes(filter.toLowerCase()) ||
    cp.phone?.includes(filter) ||
    (cp.email && cp.email.toLowerCase().includes(filter.toLowerCase()))
  );

  if (!rm) return null;

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>👥 My Channel Partners</h1>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            ← Back to Dashboard
          </button>
        </div>
        <div style={styles.errorState}>
          <p style={styles.errorText}>Error: {error}</p>
          <button onClick={() => fetchCPs(rm.id)} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👥 My Channel Partners</h1>
          <p style={styles.subtitle}>
            {loading ? 'Loading...' : `Total: ${cps.length} CPs`}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={() => navigate('/onboard-cp')} 
            style={styles.addBtn}
          >
            ➕ Add New CP
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={styles.backBtn}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name, phone or email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* CP List */}
      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : filteredCPs.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            {cps.length === 0 
              ? "You haven't onboarded any Channel Partners yet" 
              : "No matching Channel Partners found"}
          </p>
          <button onClick={() => navigate('/onboard-cp')} style={styles.emptyBtn}>
            Onboard Your First CP
          </button>
        </div>
      ) : (
        <div style={styles.cpGrid}>
          {filteredCPs.map(cp => (
            <div key={cp.id} style={styles.cpCard}>
              <div style={styles.cpHeader}>
                <h3 style={styles.cpName}>{cp.cp_name}</h3>
                <span style={{
                  ...styles.cpType,
                  background: cp.cp_type === 'company' ? '#e7f3ff' : '#f0f0f0',
                  color: cp.cp_type === 'company' ? '#004085' : '#495057'
                }}>
                  {cp.cp_type === 'company' ? '🏢 Company' : '👤 Individual'}
                </span>
              </div>
              
              <div style={styles.cpDetails}>
                <p style={styles.detailItem}><strong>📞</strong> {cp.phone}</p>
                {cp.email && <p style={styles.detailItem}><strong>✉️</strong> {cp.email}</p>}
                {cp.address && <p style={styles.detailItem}><strong>📍</strong> {cp.address}</p>}
                {cp.operating_markets && (
                  <p style={styles.detailItem}><strong>🌍 Markets:</strong> {cp.operating_markets}</p>
                )}
                {cp.industry && (
                  <p style={styles.detailItem}><strong>🏭 Industry:</strong> {cp.industry}</p>
                )}
                {cp.expected_monthly_business > 0 && (
                  <p style={styles.detailItem}>
                    <strong>💰 Expected Monthly:</strong> ₹{Number(cp.expected_monthly_business).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div style={styles.cpFooter}>
                <span style={styles.onboardDate}>
                  📅 Onboarded: {new Date(cp.onboard_date).toLocaleDateString()}
                </span>
                <div style={styles.cpActions}>
                  <button style={styles.actionBtn} onClick={() => alert('Meeting Logger coming soon!')}>
                    📝 Log Meeting
                  </button>
                  <button style={styles.actionBtn} onClick={() => alert('Details view coming soon!')}>
                    📊 View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
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
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  addBtn: {
    padding: '10px 20px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  backBtn: {
    padding: '10px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  searchContainer: {
    marginBottom: '20px'
  },
  searchInput: {
    width: '100%',
    padding: '15px',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  },
  errorState: {
    textAlign: 'center',
    padding: '60px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  errorText: {
    fontSize: '16px',
    color: '#dc3545',
    marginBottom: '20px'
  },
  retryBtn: {
    padding: '10px 30px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px'
  },
  emptyBtn: {
    padding: '12px 30px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  cpGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  cpCard: {
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  cpHeader: {
    padding: '15px',
    background: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cpName: {
    margin: 0,
    fontSize: '18px',
    color: '#333'
  },
  cpType: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  cpDetails: {
    padding: '15px'
  },
  detailItem: {
    margin: '8px 0',
    color: '#495057',
    fontSize: '14px'
  },
  cpFooter: {
    padding: '15px',
    background: '#f8f9fa',
    borderTop: '1px solid #dee2e6'
  },
  onboardDate: {
    display: 'block',
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: '10px'
  },
  cpActions: {
    display: 'flex',
    gap: '10px'
  },
  actionBtn: {
    flex: 1,
    padding: '8px',
    background: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    fontSize: '12px',
    cursor: 'pointer'
  }
};

export default MyCPs;
