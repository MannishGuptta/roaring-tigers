import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../supabaseClient';

function MyCPs() {
  const [rm, setRm] = useState(null);
  const [cps, setCps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userData);
    setRm(user);
    fetchCPs(user.id);
  }, [navigate]);

  const fetchCPs = async (rmId) => {
    try {
      const { data, error } = await supabase
        .from('channel_partners')
        .select('*')
        .eq('rm_id', rmId)
        .order('join_date', { ascending: false });

      if (error) throw error;
      setCps(data || []);
    } catch (err) {
      console.error('Error fetching CPs:', err);
      setError('Failed to load channel partners');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (!rm) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>👥 My Channel Partners</h1>
        <div style={styles.headerButtons}>
          <Link to="/onboard-cp" style={{ textDecoration: 'none' }}>
            <button style={styles.addBtn}>➕ Add New CP</button>
          </Link>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loading}>Loading your channel partners...</div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div>
                <div style={styles.statValue}>{cps.length}</div>
                <div style={styles.statLabel}>Total CPs</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div>
                <div style={styles.statValue}>{cps.filter(cp => cp.status === 'active').length}</div>
                <div style={styles.statLabel}>Active</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏸️</div>
              <div>
                <div style={styles.statValue}>{cps.filter(cp => cp.status !== 'active').length}</div>
                <div style={styles.statLabel}>Inactive</div>
              </div>
            </div>
          </div>

          {/* CP List */}
          {cps.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>No channel partners yet.</p>
              <Link to="/onboard-cp" style={{ textDecoration: 'none' }}>
                <button style={styles.emptyStateBtn}>➕ Add Your First CP</button>
              </Link>
            </div>
          ) : (
            <div style={styles.cpGrid}>
              {cps.map(cp => (
                <div key={cp.id} style={styles.cpCard}>
                  <div style={styles.cpHeader}>
                    <h3 style={styles.cpName}>{cp.name}</h3>
                    <span style={{
                      ...styles.statusBadge,
                      background: cp.status === 'active' ? '#d4edda' : '#f8d7da',
                      color: cp.status === 'active' ? '#155724' : '#721c24'
                    }}>
                      {cp.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                  
                  <div style={styles.cpDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📞 Phone:</span>
                      <span style={styles.detailValue}>{cp.phone}</span>
                    </div>
                    
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>✉️ Email:</span>
                      <span style={styles.detailValue}>{cp.email || 'N/A'}</span>
                    </div>
                    
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📍 Address:</span>
                      <span style={styles.detailValue}>{cp.address || 'N/A'}</span>
                    </div>
                    
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>💰 Commission:</span>
                      <span style={styles.detailValue}>{cp.commission_rate || 0}%</span>
                    </div>
                    
                    {cp.gst_number && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>🔢 GST:</span>
                        <span style={styles.detailValue}>{cp.gst_number}</span>
                      </div>
                    )}
                    
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📅 Joined:</span>
                      <span style={styles.detailValue}>{formatDate(cp.join_date)}</span>
                    </div>

                    {/* Document Status */}
                    {(cp.pan_number || cp.aadhar_number) && (
                      <div style={styles.docSection}>
                        <div style={styles.docTitle}>📋 Documents</div>
                        {cp.pan_number && (
                          <div style={styles.docRow}>
                            <span>PAN:</span>
                            <span style={styles.docValue}>
                              {cp.pan_number} 
                              {cp.pan_verified && <span style={styles.verified}> ✓</span>}
                            </span>
                          </div>
                        )}
                        {cp.aadhar_number && (
                          <div style={styles.docRow}>
                            <span>Aadhar:</span>
                            <span style={styles.docValue}>
                              {cp.aadhar_number}
                              {cp.aadhar_verified && <span style={styles.verified}> ✓</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
    marginBottom: '30px',
    padding: '20px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    margin: 0
  },
  headerButtons: {
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
    fontSize: '14px',
    fontWeight: 'bold'
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
  errorMessage: {
    padding: '15px',
    background: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
    marginBottom: '20px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px'
  },
  loading: {
    fontSize: '18px',
    color: '#666'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
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
    fontSize: '20px',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  emptyStateText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px'
  },
  emptyStateBtn: {
    padding: '12px 24px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  cpGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  cpCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, boxShadow 0.2s'
  },
  cpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #dee2e6'
  },
  cpName: {
    fontSize: '18px',
    margin: 0
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  cpDetails: {
    fontSize: '14px',
    lineHeight: '1.6'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  detailLabel: {
    color: '#666',
    fontWeight: 'bold'
  },
  detailValue: {
    color: '#333'
  },
  docSection: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px dashed #dee2e6'
  },
  docTitle: {
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#495057'
  },
  docRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '3px'
  },
  docValue: {
    fontFamily: 'monospace'
  },
  verified: {
    color: '#28a745',
    fontWeight: 'bold'
  }
};

export default MyCPs;
